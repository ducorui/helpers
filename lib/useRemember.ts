import { useEffect, useState, Dispatch, SetStateAction } from 'react';

function setCookie(key: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString(); // Calculate expiration date
  document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(key: string) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${key}=`))
    ?.split('=')[1];
}

export default function useRemember<State>(
  initialState: State,
  key?: string,
): [State, Dispatch<SetStateAction<State>>] {
  // Retrieve the initial state from cookies if a key is provided
  const cookieValue = key ? getCookie(key) : undefined;
  const [state, setState] = useState<State>(
    cookieValue ? JSON.parse(decodeURIComponent(cookieValue)) : initialState
  );

  // Update cookies whenever the state changes
  useEffect(() => {
    if (key) {
      setCookie(key, JSON.stringify(state), 1); // Set cookie to expire in 7 days
    }
  }, [state, key]);

  return [state, setState];
}
