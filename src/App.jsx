import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";

import Home from "./pages/Home";
import MathStudio from "./pages/MathStudio";
import MosaicCrochetPatternMaker from "./pages/MosaicCrochetPatternMaker";
import About from "./pages/About"

import './App.css'

// FIX COLORS: Blue should always be the starting color even if there are an odd number of rows

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/MathStudio" element={<MathStudio />} />
        <Route path="/MosaicCrochetPatternMaker" element={<MosaicCrochetPatternMaker />} />
        <Route path="/About" element={<About />} />
      </Routes>
    </>
  )
}

export default App
