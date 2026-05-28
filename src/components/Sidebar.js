import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, Plus, History, Leaf } from 'lucide-react';

const Sidebar = ({ userRole, onLogout }) => {
  const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const navigate = useNavigate();

  const menuItems = {
    donor: [
      { label: 'Dashboard', icon: '📊', href: '/donor-dashboard' },
      { label: 'New Donation', icon: '➕', href: '#' },
      { label: 'History', icon: '📋', href: '#' },
    ],
    ngo: [
      { label: 'Dashboard', icon: '📊', href: '/ngo-dashboard' },
      { label: 'Available Food', icon: '🍽️', href: '/ngo-dashboard#foodGrid' },
      { label: 'Requests', icon: '📝', href: '/ngo-dashboard#requestedDonations' },
    ],
    volunteer: [
      { label: 'Dashboard', icon: '📊', href: '/volunteer-dashboard' },
      { label: 'Deliveries', icon: '🚚', href: '/volunteer-dashboard#deliveries' },
      { label: 'History', icon: '✓', href: '/volunteer-dashboard#completedDeliveries' },
    ],
    admin: [
      { label: 'Dashboard', icon: '📊', href: '/admin-dashboard' },
      { label: 'Users', icon: '👥', href: '/admin-dashboard#users' },
      { label: 'Donations', icon: '🍽️', href: '/admin-dashboard#donations' },
      // Analytics removed per request
    ],
  };

  // Ensure sidebar opens on large screens and closes on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(true);
      else setIsOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on Escape key for better UX
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[9999] p-2 rounded-lg bg-primary-500 text-white lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 z-[9999] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-800">
          <Leaf className="w-8 h-8 text-primary-400" />
          <span className="text-xl font-bold">FoodShare</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-6 space-y-2">
          {(menuItems[userRole] || menuItems['donor']).map((item, index) => {
            const isInternal = item.href && item.href.startsWith('/');
            const className = 'flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300';

            return isInternal ? (
              <button
                key={index}
                type="button"
                className={className}
                onClick={() => {
                  const [path, hash] = (item.href || '').split('#');
                  if (hash) {
                    if (window.location.pathname === path) {
                      const el = document.getElementById(hash);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      setIsOpen(false);
                      return;
                    }

                    navigate(path || '/');
                    setTimeout(() => {
                      const el = document.getElementById(hash);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else window.location.hash = hash;
                    }, 120);
                    setIsOpen(false);
                    return;
                  }

                  // If already on the same path, scroll to top
                  if (window.location.pathname === item.href) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsOpen(false);
                    return;
                  }

                  setIsOpen(false);
                  navigate(item.href);
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ) : (
              <button
                key={index}
                type="button"
                className={className}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  if (item.href === '#') return;
                  // navigate to absolute/relative hrefs
                  window.location.href = item.href;
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-800 p-6">
          <button
            onClick={() => {
              setIsOpen(false);
              if (typeof onLogout === 'function') onLogout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-secondary-400"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
