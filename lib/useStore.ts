import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js';
import { useEffect, useRef } from 'react';

interface StoreItem {
  value: any;
  isPrevFetched?: boolean;
}

// Example store and getState implementation
const store = new Map<string, StoreItem>();

// Example subscribe function: adjust based on your actual store
const subscribe = (callback: () => void) => {
  // In a real-world scenario, this would listen for store changes
  // and call the callback when the store updates.
  const unsubscribe = () => {
    // Clean up any listeners when unsubscribed.
  };
  return unsubscribe;
};

// Get the current store state by key
const getStoreState = (key: string) => {
  let item = store.get(key);

  if (typeof item === 'undefined') {
    // Initialize the store if the key is not found
    item = { value: undefined, isPrevFetched: false };
    store.set(key, item);
  }

  if(item && item.isPrevFetched === false){
    store.set(key, {
      ...item,
      isPrevFetched: true
    });
  }

  return {
    value: item.value,
    isPrevFetched: item.isPrevFetched,
  };
};

// Hook to subscribe and get the state from the store
const useStore = (initialData: object|undefined, key: string): [any, (data: object) => void, boolean] => {
  const isMount = useRef(false);

  // Use useSyncExternalStore to subscribe to store changes
  const { value, isPrevFetched } = useSyncExternalStore(
    subscribe,
    () => getStoreState(key),  // Get the current state
    () => ({ value: initialData, isPrevFetched: undefined })  // Provide fallback in SSR scenarios (if needed)
  );

  // Update the store
  const setItem = (data: object) => {
    store.set(key, { value: data });  // Update isPrevFetched
    // Optionally notify subscribers here.
  };

  useEffect(() => {
    isMount.current = true;
    return () => {
      isMount.current = false;
    };
  }, []);

  return [value, setItem, isPrevFetched as boolean];
};

export default useStore;
