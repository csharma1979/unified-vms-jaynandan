import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Service Business Management System. All rights reserved.</p>
        <p className="mt-4 text-gray-400">
          Technology Partner –{' '}
          <a 
            href="https://fritado.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Fritado
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;