import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Reader from "./pages/Reader";
import { ReaderStateProvider } from "./components/book/readerState";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ReaderStateProvider><Reader /></ReaderStateProvider>} />
      </Routes>
      <Toaster position="bottom-center" />
    </BrowserRouter>
  );
}

export default App;
