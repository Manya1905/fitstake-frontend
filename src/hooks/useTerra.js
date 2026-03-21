import { useState, useCallback } from 'react';
import { BACKEND_URL } from '../utils/constants';

export function useTerra() {
  const [terraUserId, setTerraUserId] = useState(
    () => localStorage.getItem('terraUserId') || ''
  );
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem('terraUserId'));
  const [loading, setLoading] = useState(false);

  const connectFitnessApp = useCallback(async (referenceId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/terra/widget-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId }),
      });
      const data = await res.json();

      if (data.url) {
        // Open Terra widget in new window
        const popup = window.open(data.url, 'terra-connect', 'width=600,height=700');

        // Listen for the widget to close and check for stored user ID
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkClosed);
            // The Terra webhook will provide the user ID — for now prompt user
            const userId = localStorage.getItem('terraUserId');
            if (userId) {
              setTerraUserId(userId);
              setIsConnected(true);
            }
            setLoading(false);
          }
        }, 1000);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error connecting fitness app:', error);
      setLoading(false);
    }
  }, []);

  const saveTerraUserId = useCallback((userId) => {
    localStorage.setItem('terraUserId', userId);
    setTerraUserId(userId);
    setIsConnected(true);
  }, []);

  const fetchActivity = useCallback(async (startDate, endDate) => {
    if (!terraUserId) return null;

    try {
      const params = new URLSearchParams({
        terraUserId,
        startDate,
        endDate,
      });

      const res = await fetch(`${BACKEND_URL}/api/terra/activity?${params}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  }, [terraUserId]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('terraUserId');
    setTerraUserId('');
    setIsConnected(false);
  }, []);

  return {
    terraUserId,
    isConnected,
    loading,
    connectFitnessApp,
    saveTerraUserId,
    fetchActivity,
    disconnect,
  };
}
