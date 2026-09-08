"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

export function ScorecardRadarChart({
  responsiveness,
  quality,
  price,
  reliability,
}: {
  responsiveness: number | null;
  quality: number | null;
  price: number | null;
  reliability: number | null;
}) {
  const data = [
    { dimension: "Responsiveness", value: responsiveness ?? 0 },
    { dimension: "Quality", value: quality ?? 0 },
    { dimension: "Price", value: price ?? 0 },
    { dimension: "Reliability", value: reliability ?? 0 },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid className="stroke-neutral-200 dark:stroke-neutral-700" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
          <Radar dataKey="value" stroke="#171717" fill="#171717" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
