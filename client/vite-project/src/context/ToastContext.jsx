import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "success") => { const id = crypto.randomUUID(); setToasts((items) => [...items, { id, message, type }]); window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4500); }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed right-4 top-4 z-[12000] grid w-[min(92vw,380px)] gap-2" aria-live="polite"><AnimatePresence>{toasts.map((item) => <motion.div key={item.id} initial={{ opacity: 0, y: -12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} className={`flex gap-3 rounded-2xl border bg-white p-4 shadow-xl ${item.type === "error" ? "border-red-200 text-red-700" : "border-teal-200 text-teal-800"}`}>{item.type === "error" ? <FiXCircle className="mt-0.5 shrink-0"/> : <FiCheckCircle className="mt-0.5 shrink-0"/>}<p className="text-sm font-semibold">{item.message}</p></motion.div>)}</AnimatePresence></div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
