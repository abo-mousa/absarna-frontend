import { createContext, useContext, useEffect, useState } from 'react';
import { safeStorage } from '@/lib/safeStorage';

const ThemeContext = createContext(null);

function getInitialTheme() {
    // Mirrors the inline script in index.html that already applied the `dark` class
    // pre-paint — read it back from the DOM rather than re-deriving from localStorage/
    // matchMedia, so the two can never disagree.
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        // safeStorage, not localStorage: this effect runs on the very first render, and a
        // browser that blocks site data throws on the accessor itself — which used to take the
        // whole app down into the error boundary before anything had painted.
        safeStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
