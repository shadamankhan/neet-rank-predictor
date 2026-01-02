import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import { auth, signInWithGoogle, logout } from "../firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { isAdminEmail } from "../utils/adminConfig";
import ThemePanel from "./ThemePanel";
import AskQueryModal from "./AskQueryModal";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const navigate = useNavigate(); // Hook initialized

  // Dropdown states
  const [stateDataOpen, setStateDataOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const [showAskModal, setShowAskModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) setUser(result.user);
      })
      .catch((error) => console.error("Redirect login error:", error));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close all menus on route change
  useEffect(() => {
    setIsOpen(false);
    setStateDataOpen(false);
    setToolsOpen(false);
    setResourcesOpen(false);
    setShowThemePanel(false);
  }, [location]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // --- Navigation Data ---
  const stateExplorers = [
    { to: "/deemed-explorer", label: "Deemed Colleges" },
    { to: "/karnataka-private", label: "Karnataka Pvt" },
    { to: "/kerala-private", label: "Kerala Pvt" },
    { to: "/up-private", label: "UP Private" },
    { to: "/bihar-private", label: "Bihar Private" },
    { to: "/haryana-private", label: "Haryana Pvt" },
    { to: "/west-bengal-private", label: "West Bengal Pvt" },
    { to: "/andhra-pradesh", label: "Andhra Pradesh" },
    { to: "/tamil-nadu-private", label: "Tamil Nadu Pvt" },
  ];

  const tools = [
    { to: "/college-finder", label: "State Quota Finder" },
    { to: "/private-finder", label: "Pvt/Deemed Finder" },
  ];

  const resources = [
    { to: "/roadmap", label: "NEET Roadmap" },
    { to: "/mentorship", label: "Tuition & Guidance" },
    { to: "/counselling-guidance", label: "Counselling Tips" },
  ];

  // Helper for Dropdowns (Desktop)
  const NavDropdown = ({ label, isOpen, setIsOpen, items }) => (
    <div
      className="relative group h-full flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-[15px] font-medium 
          ${isOpen ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute top-full right-0 mt-1 w-64 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] 
          border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 origin-top-right
          ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
        `}
      >
        <div className="p-1.5">
          {items.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center px-4 py-3 text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 mr-3 transition-colors" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  // Mobile Accordion Item
  const MobileMenuItem = ({ label, items, isOpen, setIsOpen }) => (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-4 text-left text-slate-700 font-medium active:bg-slate-50"
      >
        <span>{label}</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="bg-slate-50/50 px-4 pb-4 pt-1 space-y-1">
          {items.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-4 py-2.5 text-sm text-slate-600 rounded-lg active:bg-blue-50 active:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-[1000] bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)] h-[72px]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="relative z-10 flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-200">
              N
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Predictor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 h-full">
            <Link to="/" className="px-3 py-2 text-[15px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
              Home
            </Link>
            <Link to="/predict" className="px-3 py-2 text-[15px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
              Predictor
            </Link>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <Link to="/test-series" className="px-3 py-2 text-[15px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1">
              <span className="text-blue-600">⚡</span> Test Series
            </Link>

            <NavDropdown label="Tools" isOpen={toolsOpen} setIsOpen={setToolsOpen} items={tools} />
            <NavDropdown label="Resources" isOpen={resourcesOpen} setIsOpen={setResourcesOpen} items={resources} />
            <NavDropdown label="State Data" isOpen={stateDataOpen} setIsOpen={setStateDataOpen} items={stateExplorers} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user && isAdminEmail(user.email) && (
              <Link to="/admin" className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <span>Admin Panel</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              </Link>
            )}

            <button
              onClick={() => setShowAskModal(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95 flex items-center gap-2 group"
            >
              <span>Ask Expert</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>

            {/* Auth/Profile */}
            <div className="pl-4 border-l border-slate-200 flex items-center gap-3">
              <button
                onClick={() => setShowThemePanel(!showThemePanel)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Customize Theme"
              >
                🎨
              </button>

              {showThemePanel && (
                <div className="absolute top-[60px] right-20 z-50">
                  <ThemePanel onClose={() => setShowThemePanel(false)} />
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden xl:block">
                    <Link to="/profile" className="block text-sm font-semibold text-slate-700 leading-tight hover:text-blue-600 transition-colors">
                      {user.displayName || 'User'}
                    </Link>
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleLogout} className="text-[11px] font-medium text-red-500 hover:text-red-700">SIGNOUT</button>
                    </div>
                  </div>
                  <Link to="/profile" className="relative group">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="user" className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm">
                        {user.email?.[0].toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle().catch(e => alert(e.message))}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm hover:shadow-blue-500/25"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden relative z-50 p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between overflow-hidden">
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? 'translate-x-[110%]' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[900] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[950] lg:hidden 
          shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full pt-[80px] pb-6">
          <div className="flex-1 overflow-y-auto">
            <Link to="/" className="block px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">Home</Link>
            <Link to="/predict" className="block px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">Predictor</Link>
            <Link to="/test-series" className="block px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <span className="text-blue-600">⚡</span> Test Series
            </Link>

            <div className="my-2 border-t border-slate-100" />

            <MobileMenuItem label="Tools" items={tools} isOpen={toolsOpen} setIsOpen={setToolsOpen} />
            <MobileMenuItem label="Resources" items={resources} isOpen={resourcesOpen} setIsOpen={setResourcesOpen} />
            <MobileMenuItem label="State Data" items={stateExplorers} isOpen={stateDataOpen} setIsOpen={setStateDataOpen} />
          </div>

          <div className="px-6 space-y-4">
            <button
              onClick={() => {
                setShowAskModal(true);
                setIsOpen(false);
              }}
              className="w-full px-5 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              Ask Expert 💬
            </button>

            {user ? (
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="user" className="w-10 h-10 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{user.displayName || 'User'}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {isAdminEmail(user.email) && (
                    <Link to="/admin" className="px-3 py-2 text-center text-xs font-semibold bg-purple-50 text-purple-700 rounded-lg">
                      Admin
                    </Link>
                  )}
                  <Link to="/profile" className="px-3 py-2 text-center text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg">
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="col-span-2 px-3 py-2 text-center text-xs font-semibold border border-red-200 text-red-600 rounded-lg">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  signInWithGoogle();
                  setIsOpen(false);
                }}
                className="w-full px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <AskQueryModal isOpen={showAskModal} onClose={() => setShowAskModal(false)} />
    </>
  );
}
