import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#7A6BFF" fillOpacity="0.2"/>
          <path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM14 20V12L20 16L14 20Z" fill="#7A6BFF"/>
        </svg>
        <div className="logo-text">
          <h1>Lending Pool</h1>
          <span className="logo-badge">Sepolia Testnet</span>
        </div>
      </div>
      <div className="header-right">
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header; 