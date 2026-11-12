from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

from seed_content import SEED_VERSION, META, build_sections

ROOT_DIR = Path(__file__).parent
ASSETS_DIR = ROOT_DIR / "assets"
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


class Section(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    order: int
    type: str
    title: str
    subtitle: Optional[str] = None
    variant: Optional[str] = None
    group: str
    start_right: bool = True
    content: str = ""
    part_number: Optional[int] = None
    chapter_number: Optional[int] = None
    illustration: Optional[str] = None
    quiz: Optional[Dict[str, Any]] = None


class BookMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    subtitle: str
    author: str
    publisher: str
    year: str
    front_cover: Optional[str] = None
    author_photo: Optional[str] = None
    back_photo: Optional[str] = None
    back_tagline: Optional[str] = None
    back_summary: Optional[str] = None
    back_blurb: str
    config: Dict[str, Any]


class Book(BaseModel):
    meta: BookMeta
    sections: List[Section]
    content_hash: str


class LayoutIn(BaseModel):
    key: str
    layout: Dict[str, Any]


def content_hash(meta: dict, sections: list) -> str:
    raw = json.dumps({"meta": meta, "sections": sections}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(raw.encode()).hexdigest()[:16]


async def load_book() -> Book:
    meta = await db.book_meta.find_one({}, {"_id": 0, "seed_version": 0})
    sections = await db.sections.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    m, ss = BookMeta(**meta), [Section(**s) for s in sections]
    return Book(meta=m, sections=ss, content_hash=content_hash(m.model_dump(), [s.model_dump() for s in ss]))


async def seed():
    meta = await db.book_meta.find_one({}, {"_id": 0})
    if meta and meta.get("seed_version") == SEED_VERSION:
        return
    await db.book_meta.delete_many({})
    await db.sections.delete_many({})
    await db.book_meta.insert_one({**BookMeta(**META).model_dump(), "seed_version": SEED_VERSION})
    await db.sections.insert_many([Section(**s).model_dump() for s in build_sections()])
    await db.sections.create_index("key", unique=True)
    logger.info("Book content seeded")


@app.on_event("startup")
async def on_startup():
    await seed()
    await db.layouts.create_index("key", unique=True)


@api_router.get("/")
async def root():
    return {"message": "Happiness Trading API"}


@api_router.get("/book", response_model=Book)
async def get_book():
    return await load_book()


@api_router.get("/layout/{key}")
async def get_layout(key: str):
    doc = await db.layouts.find_one({"key": key}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Layout not computed yet")
    return doc


@api_router.post("/layout")
async def save_layout(body: LayoutIn):
    # First computed layout for the current content wins; later devices reuse it.
    book = await load_book()
    if not body.key.startswith(book.content_hash + ":"):
        raise HTTPException(409, "Layout key does not match current book content")
    if len(json.dumps(body.layout)) > 8_000_000 or not isinstance(body.layout.get("pages"), list):
        raise HTTPException(400, "Invalid layout")
    await db.layouts.update_one({"key": body.key}, {"$setOnInsert": {"key": body.key, "layout": body.layout,
                                "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    doc = await db.layouts.find_one({"key": body.key}, {"_id": 0})
    return doc


@api_router.get("/assets/{name}")
async def get_asset(name: str):
    path = (ASSETS_DIR / name).resolve()
    if path.parent != ASSETS_DIR.resolve() or not path.is_file():
        raise HTTPException(404, "Not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})


PRINT_DIR = ROOT_DIR / "print" / "output"


@api_router.get("/print/files")
async def list_print_files():
    return [{"name": f.name, "size": f.stat().st_size} for f in sorted(PRINT_DIR.glob("HappinessTrading_*"))]


@api_router.get("/print/files/{name}")
async def get_print_file(name: str):
    path = (PRINT_DIR / name).resolve()
    if path.parent != PRINT_DIR.resolve() or not path.is_file():
        raise HTTPException(404, "Not found")
    return FileResponse(path, filename=name)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
