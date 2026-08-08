import { Link } from "react-router-dom";

export default function ProfileProgressBadge({ completion, to, className = "" }) {
  if (completion === null || completion === undefined || completion >= 100) return null;
  const radius = 18; const circumference = 2 * Math.PI * radius;
  return <Link to={to} title={`Profile ${completion}% complete`} aria-label={`Complete profile, ${completion}% finished`} className={`relative grid size-12 shrink-0 place-items-center rounded-full bg-white shadow-sm ${className}`}>
    <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden="true"><circle cx="22" cy="22" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4"/><circle cx="22" cy="22" r={radius} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-completion/100)}/></svg>
    <span className="relative text-[10px] font-black text-teal-800">{completion}%</span>
  </Link>;
}
