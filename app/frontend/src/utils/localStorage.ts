// Utility functions for localStorage with proper Date handling

export const setLocalStorageItem = (key: string, value: any): void => {
  try {
    const serializedValue = JSON.stringify(value, (key, val) => {
      if (val instanceof Date) {
        return { __type: 'Date', value: val.toISOString() };
      }
      return val;
    });
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    const parsedValue = JSON.parse(item, (key, val) => {
      if (val && typeof val === 'object' && val.__type === 'Date') {
        return new Date(val.value);
      }
      return val;
    });
    
    return parsedValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const removeLocalStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
  }
};

export const clearAllAppData = (): void => {
  const keys = ['travelQuery', 'itinerary', 'dashboardVisible', 'messages', 'chatHistory'];
  keys.forEach(key => removeLocalStorageItem(key));
}; 