const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© {currentYear} DeFi Lending Pool. All rights reserved.</p>
        <div className="footer-links">
          <a href="#" target="_blank" rel="noopener noreferrer">Terms</a>
          <a href="#" target="_blank" rel="noopener noreferrer">Privacy</a>
          <a href="#" target="_blank" rel="noopener noreferrer">Docs</a>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 