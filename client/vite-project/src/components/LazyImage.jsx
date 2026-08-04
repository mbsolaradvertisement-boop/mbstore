import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function LazyImage({ src, alt, className = "", imageClassName = "", rootMargin = "200px", ...props }) {
  const frameRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <div ref={frameRef} className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <AnimatePresence>{!loaded && <motion.div key="skeleton" className="mb-shimmer absolute inset-0 bg-slate-200" exit={{ opacity: 0 }} aria-hidden="true" />}</AnimatePresence>
      {visible && <motion.img src={src} alt={alt} loading="lazy" decoding="async" onLoad={handleLoad} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.02 }} transition={{ duration: .35 }} className={`h-full w-full object-cover ${imageClassName}`} {...props} />}
    </div>
  );
}

export default memo(LazyImage);
