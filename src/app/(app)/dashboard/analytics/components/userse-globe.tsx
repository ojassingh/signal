"use client";

import dynamic from "next/dynamic";
import type { GlobeFeatureCollection } from "./globe-map";

const GlobeMap = dynamic(() => import("./globe-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400" />
        <span className="text-sm text-zinc-500">Loading Globe...</span>
      </div>
    </div>
  ),
});

export function UserGlobe({
  data,
  className,
}: {
  data?: GlobeFeatureCollection;
  className?: string;
}) {
  return <GlobeMap className={className} data={data} />;
}
