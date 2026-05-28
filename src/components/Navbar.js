import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';

const Navbar = ({ isLoggedIn = false, onLogout = null, hideAuthLinks = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 hover:text-primary-700">
            <Leaf className="w-8 h-8" />
            <span>FoodShare</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {!hideAuthLinks && (
              <>
                <a href="#features" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Features
                </a>
                <a href="#stats" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Impact
                </a>
                <a href="#about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  About
                </a>
              </>
            )}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 font-medium transition-colors"
              >
                Logout
              </button>
            ) : !hideAuthLinks ? (
              <>
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 px-2">
            {!hideAuthLinks && (
              <>
                <a href="#features" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Features
                </a>
                <a href="#stats" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Impact
                </a>
                <a href="#about" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  About
                </a>
              </>
            )}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg font-medium"
              >
                Logout
              </button>
            ) : !hideAuthLinks ? (
              <>
                <Link to="/login" className="block px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                  Login
                </Link>
                <Link to="/register" className="block px-4 py-2 bg-primary-500 text-white rounded-lg mt-2">
                  Register
                </Link>
              </>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
