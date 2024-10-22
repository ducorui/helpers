import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js';

type StoreType = {
    [key: string]: {
        data: any,
        status: "start" | "wait" | "complete",
    }
};

const store: StoreType = {};

// Create a simple subscribe method to listen for changes
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

// Update store and notify listeners

function updateStore(key: string, value: any, status: "wait" | "complete" = "complete") {
    store[key] = {
        ...store[key],
        data: value,
        status: status,
    };
    listeners.forEach(listener => listener());
}


function removeStore(key: string) {
    delete store[key];
    listeners.forEach(listener => listener());
}

// Hook to use the store
export function useStore(key: string) {
    
    return useSyncExternalStore(
        subscribe,
        () => {

            if (typeof store[key] === 'undefined') {

                store[key] = {
                    data: null,
                    status: "start",
                }
                listeners.forEach(listener => listener());
            }

            return {
                data: store[key],
                updateStore,
                removeStore,
            }
        }, // selector to get the store value
    );
}