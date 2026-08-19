import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authNotice, setAuthNotice] = useState("");
  const refresh = useCallback(async ({ showLoader = true } = {}) => { if(showLoader)setChecking(true); try { const { data } = await api.get("/auth/me"); setUser(data.authenticated ? data.user : null); return data.user; } catch { setUser(null); return null; } finally { if(showLoader)setChecking(false); } }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const expired=event=>{setUser(null);setAuthNotice(event.detail?.message||"Your session has expired. Please login again.")}; window.addEventListener("mbstore:session-expired",expired); return()=>window.removeEventListener("mbstore:session-expired",expired); }, []);
  useEffect(() => { const recheck=()=>{if(document.visibilityState==="visible")refresh({showLoader:false})}; document.addEventListener("visibilitychange",recheck); window.addEventListener("focus",recheck); return()=>{document.removeEventListener("visibilitychange",recheck);window.removeEventListener("focus",recheck)}; }, [refresh]);
  const logout = useCallback(async () => { try { await api.post("/auth/logout"); } finally { setUser(null); } }, []);
  const login = useCallback((authenticatedUser) => setUser(authenticatedUser), []);
  const clearAuthNotice=useCallback(()=>setAuthNotice(""),[]);
  const value = useMemo(() => ({ user, setUser, checking, authLoading: checking, loading: checking, isAuthenticated: Boolean(user), authNotice, clearAuthNotice, login, checkAuth: refresh, refreshSession: refresh, refresh, refreshUser: refresh, logout }), [user, checking, authNotice, clearAuthNotice, login, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
