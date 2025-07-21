import { useState, useEffect } from 'react';
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/localStorage';

function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    return getLocalStorageItem(key, defaultValue);
  });

  useEffect(() => {
    setLocalStorageItem(key, state);
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState; 