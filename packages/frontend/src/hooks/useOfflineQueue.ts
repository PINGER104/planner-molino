import { useState, useEffect, useCallback } from 'react';

interface QueuedAction {
  id: string;
  action: string; // e.g., 'createDatiCarico'
  data: unknown;
  timestamp: number;
}

const DB_NAME = 'planner-molino-offline';
const STORE_NAME = 'queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  const loadQueueSize = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const count = store.count();
      count.onsuccess = () => setQueueSize(count.result);
    } catch {
      /* ignore */
    }
  }, []);

  const syncQueue = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const allRequest = store.getAll();

      allRequest.onsuccess = async () => {
        const items: QueuedAction[] = allRequest.result;
        for (const item of items) {
          try {
            // Execute the queued action via the appropriate service
            // This is a simplified version - in production you'd route to the right service
            const response = await fetch(`/api/${item.action}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });

            if (response.ok) {
              // Remove from queue
              const deleteTx = db.transaction(STORE_NAME, 'readwrite');
              deleteTx.objectStore(STORE_NAME).delete(item.id);
            }
          } catch {
            /* retry on next sync */
          }
        }
        loadQueueSize();
      };
    } catch {
      /* ignore */
    }
  }, [loadQueueSize]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue size on mount
    loadQueueSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue, loadQueueSize]);

  const enqueue = useCallback(async (action: string, data: unknown) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
    };
    store.add(item);
    await new Promise<void>(resolve => {
      tx.oncomplete = () => resolve();
    });
    setQueueSize(prev => prev + 1);
  }, []);

  return { isOnline, queueSize, enqueue, syncQueue };
}
