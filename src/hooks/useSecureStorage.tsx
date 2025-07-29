import { useState, useEffect } from 'react';

/**
 * Secure storage hook that only stores non-sensitive UI preferences
 * and validates data before storing
 */

interface SecureStorageOptions {
  validate?: (value: any) => boolean;
  sanitize?: (value: any) => any;
}

const ALLOWED_KEYS = [
  'theme',
  'sidebar-collapsed',
  'language',
  'ui-preferences'
] as const;

type AllowedKey = typeof ALLOWED_KEYS[number];

/**
 * Secure localStorage wrapper that only allows specific keys
 * and validates data before storage
 */
export function useSecureStorage<T>(
  key: AllowedKey,
  defaultValue: T,
  options: SecureStorageOptions = {}
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      if (!ALLOWED_KEYS.includes(key)) {
        console.warn(`Security: Attempted to access disallowed key: ${key}`);
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      
      // Validate the data if validator provided
      if (options.validate && !options.validate(parsed)) {
        console.warn(`Security: Invalid data for key ${key}, using default`);
        localStorage.removeItem(key); // Clean up invalid data
        return defaultValue;
      }

      return options.sanitize ? options.sanitize(parsed) : parsed;
    } catch (error) {
      console.warn(`Security: Failed to parse localStorage key ${key}:`, error);
      localStorage.removeItem(key); // Clean up corrupted data
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    try {
      if (!ALLOWED_KEYS.includes(key)) {
        console.warn(`Security: Attempted to store disallowed key: ${key}`);
        return;
      }

      // Validate before storing
      if (options.validate && !options.validate(newValue)) {
        console.warn(`Security: Attempted to store invalid data for key ${key}`);
        return;
      }

      const sanitized = options.sanitize ? options.sanitize(newValue) : newValue;
      setValue(sanitized);
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch (error) {
      console.error(`Security: Failed to store localStorage key ${key}:`, error);
    }
  };

  return [value, setStoredValue];
}

/**
 * Clear all sensitive data from localStorage
 * This should be called on logout
 */
export function clearSensitiveData(): void {
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    // Remove any keys that aren't in our allowed list
    if (!ALLOWED_KEYS.includes(key as AllowedKey)) {
      if (key.includes('lead') || key.includes('sitplan') || key.includes('TA')) {
        console.log(`Security: Clearing potentially sensitive key: ${key}`);
        localStorage.removeItem(key);
      }
    }
  });
}

/**
 * Validate theme preference
 */
export const validateTheme = (value: any): boolean => {
  return typeof value === 'string' && ['light', 'dark', 'system'].includes(value);
};

/**
 * Validate sidebar state
 */
export const validateSidebarState = (value: any): boolean => {
  return typeof value === 'boolean';
};

/**
 * Hook for theme storage
 */
export function useThemeStorage() {
  return useSecureStorage('theme', 'system', {
    validate: validateTheme
  });
}

/**
 * Hook for sidebar state storage
 */
export function useSidebarStorage() {
  return useSecureStorage('sidebar-collapsed', false, {
    validate: validateSidebarState
  });
}