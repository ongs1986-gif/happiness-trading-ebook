import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Reader from "./pages/Reader";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Reader />} />
      </Routes>
      <Toaster position="bottom-center" />
    </BrowserRouter>
  );
}

export default App;
