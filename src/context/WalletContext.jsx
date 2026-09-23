import { createContext, useCallback, useContext, useEffect, useState } from "react";

const WalletContext = createContext(null);

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setError(null);

    if (!window.ethereum) {
      setError("No wallet found. Please install MetaMask or a compatible wallet.");
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setChainId(currentChainId);
        setStatus("connected");
      } else {
        setStatus("disconnected");
        setError("No accounts returned from wallet.");
      }
    } catch (err) {
      setStatus("disconnected");
      setError(err?.message || "Failed to connect wallet.");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setStatus("disconnected");
      } else {
        setAccount(accounts[0]);
        setStatus("connected");
      }
    };

    const handleChainChanged = (nextChainId) => {
      setChainId(nextChainId);
    };

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setStatus("connected");
          const currentChainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          setChainId(currentChainId);
        }
      })
      .catch(() => {});

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const value = {
    account,
    chainId,
    status,
    error,
    isConnected: status === "connected" && Boolean(account),
    isConnecting: status === "connecting",
    connect,
    disconnect,
    shortenAddress,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
