import { Suspense, useEffect, useRef, useState } from "react";

export default function DeferredSection({ children, minHeight = 320 }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || visible) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={containerRef} style={!visible ? { minHeight } : undefined}>
    {visible && <Suspense fallback={<div className="section-shell py-20"><div className="h-48 animate-pulse rounded-2xl bg-slate-100"/></div>}>{children}</Suspense>}
  </div>;
}
