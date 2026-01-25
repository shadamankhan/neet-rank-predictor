import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <header style={{ background: 'var(--amu-primary)', color: 'white', padding: '1rem' }}>
          <div className="amu-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>AMU Class 11 Entrance Prep</h1>
            <nav>
              <a href="/" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>Home</a>
              <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</a>
            </nav>
          </div>
        </header>
        <main className="amu-container" style={{ padding: '2rem 1rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
