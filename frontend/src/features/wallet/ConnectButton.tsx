import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

// Custom styled Connect Button component
export const ConnectButton = () => {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    type="button"
                    className="flex items-center px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 hover:scale-105 transition-transform"
                  >
                    <Wallet size={20} className="mr-2" />
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    className="flex items-center px-6 py-3 bg-red-600 text-white text-base font-semibold rounded-lg hover:bg-red-700"
                  >
                    <Wallet size={20} className="mr-2" />
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          marginRight: '8px',
                          display: 'inline-block',
                          overflow: 'hidden',
                          verticalAlign: 'middle',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100"
                  >
                    <Wallet size={20} className="mr-2" />
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}; 