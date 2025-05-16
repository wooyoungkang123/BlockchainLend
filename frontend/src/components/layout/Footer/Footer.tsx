import React from 'react';
import { Twitter, ExternalLink, Globe, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { name: 'About', href: '#' },
    { name: 'Docs', href: '#' },
    { name: 'Governance', href: '#' },
    { name: 'Security', href: '#' },
    { name: 'Terms', href: '#' },
    { name: 'Privacy', href: '#' },
  ];
  
  const socialLinks = [
    { name: 'Twitter', icon: <Twitter size={18} />, href: '#' },
    { name: 'GitHub', icon: <ExternalLink size={18} />, href: '#' },
    { name: 'Website', icon: <Globe size={18} />, href: '#' },
    { name: 'Discord', icon: <MessageCircle size={18} />, href: '#' },
  ];
  
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                L
              </div>
            </div>
          </div>
          
          {/* App Name */}
          <div className="mb-6">
            <span className="text-gray-900 font-medium text-xl">LendFlow</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center space-x-8 mb-6">
            {links.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                className="text-gray-500 hover:text-gray-900"
              >
                {link.name}
              </a>
            ))}
          </nav>
          
          {/* Social Links */}
          <div className="flex justify-center space-x-8 mb-8">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-400 hover:text-gray-500"
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center text-sm text-gray-400">
          <p>© {currentYear} LendFlow Protocol. All rights reserved.</p>
          <p className="mt-2">
            The protocol is provided "as is", without warranty of any kind.
          </p>
        </div>
      </div>
    </footer>
  );
}; 