'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/layout/auth-provider';

export function UserStatusDebug() {
  const { currentUser } = useAuth();
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] UserDataUpdated event received: ${JSON.stringify(event.detail)}`;
      console.log('🐛 DEBUG:', logMessage);
      setEventLog(prev => [...prev.slice(-4), logMessage]); // Keep last 5 events
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">🐛 User Status Debug</h3>
      <div className="mb-2">
        <strong>Current User:</strong> {currentUser?.name} ({currentUser?.role}) - {currentUser?.status}
      </div>
      <div className="mb-2">
        <strong>Patient ID:</strong> {currentUser?.patientId || 'None'}
      </div>
      <div>
        <strong>Recent Events:</strong>
        <div className="max-h-32 overflow-y-auto">
          {eventLog.map((log, index) => (
            <div key={index} className="text-xs text-gray-300">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
