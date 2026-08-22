import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "./Loader";

export default function AppLoader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const finish = () => setLoading(false);

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.removeEventListener("load", finish);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>{loading && <Loader key="initial-loader" />}</AnimatePresence>
    </>
  );
}
