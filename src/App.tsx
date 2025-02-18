import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/Products';
import Customers from './pages/Customers';
import POS from './pages/POS';
import Financial from './pages/Financial';
import BrandRegistration from './pages/BrandRegistration';


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAF7F2]">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/BrandRegistration" element={<BrandRegistration />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App