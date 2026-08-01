import { BrowserRouter, Route, Routes } from "react-router"
import ChessPage from "./ChessPage";
import Home from "./Home";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board" element={<ChessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App