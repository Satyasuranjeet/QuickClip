import { useState, useEffect } from 'react';
import { healthCheck } from '../api/clipboardApi';

interface ConnectionStatusProps {
  showWhenConnected?: boolean;
}

const ConnectionStatus = ({ showWhenConnected = false }: ConnectionStatusProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      const connected = await healthCheck();
      setIsConnected(connected);
      setIsChecking(false);
    };

    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return null;
  }

  if (isConnected && !showWhenConnected) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 bg-[#12121a] border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50">
        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">Disconnected</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#12121a] border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50">
      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
      <span className="text-xs font-medium">Connected</span>
    </div>
  );
};

export default ConnectionStatus;
