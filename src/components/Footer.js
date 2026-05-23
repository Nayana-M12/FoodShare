import React from 'react';
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Leaf } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6 text-primary-400" />
              <span className="font-bold text-lg">FoodShare</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connecting food donors with those in need. Together, we reduce waste and feed more lives.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="/" className="hover:text-primary-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-primary-400 transition-colors">
                  Register
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-primary-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#faq" className="hover:text-primary-400 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary-400 transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-primary-400 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-white">Contact Us</h4>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary-400" />
                <a href="mailto:info@foodshare.com" className="hover:text-primary-400 transition-colors">
                  info@foodshare.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-primary-400 mt-0.5" />
                <span>123 Green Street, Tech City, TC 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex justify-center gap-6">
            <a href="#facebook" className="text-gray-400 hover:text-primary-400 transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#twitter" className="text-gray-400 hover:text-primary-400 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#instagram" className="text-gray-400 hover:text-primary-400 transition-colors">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 FoodShare. All rights reserved. | Built with <span className="text-primary-400">❤️</span> for a better world.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
