"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getMapPartners,
  getProvinceStats,
  type MapPartner,
  type ProvinceStats,
} from "@/services/mapService";
import { Skeleton } from "@/components/ui/skeleton";
import { MapFilterGroup } from "@/components/map/MapFilterGroup";
import { MapLegend } from "@/components/map/MapLegend";
import { MapTotals } from "@/components/map/MapTotals";
import type { MapGenderFilter, MapLayerFilter } from "@/components/map/CambodiaMap";

const CambodiaMap = dynamic(
  () => import("@/components/map/CambodiaMap").then((mod) => mod.CambodiaMap),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

const LAYER_FILTER_OPTIONS: MapLayerFilter[] = ["all", "students", "ngos", "schools"];
const LAYER_FILTER_LABELS: Record<MapLayerFilter, string> = {
  all: "All",
  students: "Students",
  ngos: "NGO",
  schools: "Schools",
};

const GENDER_FILTER_OPTIONS: MapGenderFilter[] = ["all", "male", "female", "other"];
const GENDER_FILTER_LABELS: Record<MapGenderFilter, string> = {
  all: "All Genders",
  male: "Male",
  female: "Female",
  other: "Other",
};

export default function MapPage() {
  const [stats, setStats] = useState<ProvinceStats[]>([]);
  const [ngos, setNgos] = useState<MapPartner[]>([]);
  const [schools, setSchools] = useState<MapPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<MapGenderFilter>("all");
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>("all");
  const colorBy = "students" as const;

  const loadMapData = useCallback(() => {
    setLoading(true);
    return Promise.all([getProvinceStats(), getMapPartners()])
      .then(([provinceStats, partners]) => {
        setStats(provinceStats);
        setNgos(partners.ngos);
        setSchools(partners.schools);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load map data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const totalStudents = useMemo(() => stats.reduce((sum, p) => sum + p.totalStudents, 0), [stats]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border">
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <CambodiaMap
          stats={stats}
          ngos={ngos}
          schools={schools}
          colorBy={colorBy}
          genderFilter={genderFilter}
          layerFilter={layerFilter}
        />
      )}

      <div className="absolute top-3 left-3 z-[1000] flex flex-col items-start gap-3">
        <div className="space-y-1">
          <p className="px-0.5 text-xs font-medium text-muted-foreground">Show</p>
          <MapFilterGroup
            value={layerFilter}
            options={LAYER_FILTER_OPTIONS}
            labels={LAYER_FILTER_LABELS}
            onChange={setLayerFilter}
            vertical
          />
        </div>
        <div className="space-y-1">
          <p className="px-0.5 text-xs font-medium text-muted-foreground">Gender</p>
          <MapFilterGroup
            value={genderFilter}
            options={GENDER_FILTER_OPTIONS}
            labels={GENDER_FILTER_LABELS}
            onChange={setGenderFilter}
            vertical
          />
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2">
        <MapTotals totalStudents={totalStudents} totalNgos={ngos.length} totalSchools={schools.length} />
        <MapLegend colorBy={colorBy} layerFilter={layerFilter} />
      </div>
    </div>
  );
}
