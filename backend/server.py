from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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
    back_blurb: str
    config: Dict[str, Any]


class Book(BaseModel):
    meta: BookMeta
    sections: List[Section]


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


@api_router.get("/")
async def root():
    return {"message": "Happiness Trading API"}


@api_router.get("/book", response_model=Book)
async def get_book():
    meta = await db.book_meta.find_one({}, {"_id": 0})
    sections = await db.sections.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return Book(meta=BookMeta(**meta), sections=[Section(**s) for s in sections])


@api_router.get("/assets/{name}")
async def get_asset(name: str):
    path = (ASSETS_DIR / name).resolve()
    if path.parent != ASSETS_DIR.resolve() or not path.is_file():
        raise HTTPException(404, "Not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})


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
