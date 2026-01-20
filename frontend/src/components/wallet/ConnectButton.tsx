import { ConnectKitButton } from 'connectkit';

export function ConnectButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="btn btn-primary flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>{ensName ?? truncatedAddress}</span>
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
