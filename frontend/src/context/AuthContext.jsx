import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client from '../api/client';

const TOKEN_KEY = 'token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return undefined;
    }

    let cancelled = false;
    client
      .get('/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {
            /* ignore */
          }
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(email, password) {
    const data = await client.post('/auth/login', { email, password });
    const accessToken = data.access_token;
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } catch {
      /* ignore */
    }
    setToken(accessToken);
    const me = await client.get('/auth/me');
    setUser(me);
    return me;
  }

  async function register(email, password) {
    const data = await client.post('/auth/register', { email, password });
    const accessToken = data.access_token;
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } catch {
      /* ignore */
    }
    setToken(accessToken);
    const me = await client.get('/auth/me');
    setUser(me);
    return me;
  }

  function logout() {
    client
      .post('/auth/logout')
      .catch(() => {
        /* best effort – session is cleared client-side regardless */
      })
      .finally(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
        setToken(null);
        setUser(null);
      });
  }

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden.');
  }
  return context;
}
