import { memo } from "react";

const Shimmer = ({ className = "" }) => <div className={`mb-shimmer rounded-xl bg-slate-200 ${className}`} />;

export const ProductSkeleton = memo(function ProductSkeleton() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3" role="status" aria-label="Loading product"><Shimmer className="aspect-[4/3] w-full"/><div className="space-y-3 p-2 pt-4"><Shimmer className="h-3 w-1/3"/><Shimmer className="h-5 w-5/6"/><Shimmer className="h-4 w-2/3"/><div className="grid grid-cols-2 gap-2 pt-3"><Shimmer className="h-10"/><Shimmer className="h-10"/></div></div></div>;
});

export const CategorySkeleton = memo(function CategorySkeleton() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3" role="status" aria-label="Loading category"><Shimmer className="aspect-[4/3] w-full"/><Shimmer className="mx-1 mt-4 h-5 w-2/3"/></div>;
});

export const BannerSkeleton = memo(function BannerSkeleton() {
  return <div className="grid gap-8 rounded-3xl bg-slate-50 p-8 md:grid-cols-2" role="status" aria-label="Loading banner"><div className="space-y-5"><Shimmer className="h-4 w-32"/><Shimmer className="h-12 w-full"/><Shimmer className="h-5 w-4/5"/><Shimmer className="h-12 w-40"/></div><Shimmer className="aspect-[4/3] w-full"/></div>;
});

export const CompanySkeleton = memo(function CompanySkeleton() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6" role="status" aria-label="Loading company"><Shimmer className="aspect-[2/1] w-full"/><Shimmer className="mt-5 h-6 w-3/4"/><Shimmer className="mt-3 h-4 w-1/2"/></div>;
});
