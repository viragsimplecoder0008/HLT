import { useEffect } from 'react';

export type Theme = 'dark';

export function useTheme() {
  useEffect(() => {
    // Always apply dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return { theme: 'dark' as Theme };
}
