import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Globalcontext from "./context/Globalcontext.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <Globalcontext>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Globalcontext>
);
