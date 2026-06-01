
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import Admin from "./app/admin/Admin.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/sex" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);
