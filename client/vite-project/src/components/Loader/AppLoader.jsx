import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "./Loader";

const MINIMUM_VISIBLE_MS = 800;

export default function AppLoader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let timer;

    const finish = () => {
      const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (performance.now() - startedAt));
      timer = window.setTimeout(() => setLoading(false), remaining);
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>{loading && <Loader key="initial-loader" />}</AnimatePresence>
    </>
  );
}
