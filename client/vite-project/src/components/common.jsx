import { motion } from "framer-motion";
import { FiImage } from "react-icons/fi";

export function ImagePlaceholder({ className = "", label = "Image Placeholder" }) {
  return (
    <div className={`placeholder-pattern flex items-center justify-center rounded-2xl border border-slate-200 ${className}`} aria-label={label} role="img">
      <div className="flex flex-col items-center gap-2 text-slate-400"><FiImage className="text-3xl" aria-hidden="true" /><span className="text-xs font-semibold">{label}</span></div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, copy, center = false }) {
  return <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
    {eyebrow && <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-sky-600">{eyebrow}</p>}
    <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{title}</h2>
    {copy && <p className="mt-4 leading-7 text-slate-600">{copy}</p>}
  </div>;
}

export function Reveal({ children, className = "", delay = 0 }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: .55, delay }}>{children}</motion.div>;
}
