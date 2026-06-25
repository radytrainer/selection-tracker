"use client";

import Link from "next/link";
import { Building2, CheckCircle2, HeartHandshake, MapPin, User } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, ZoomControl } from "react-leaflet";
import { CAMBODIA_BOUNDS, CAMBODIA_CENTER, PROVINCE_COORDINATES } from "@/lib/cambodia-provinces";
import type { MapPartner, ProvinceStats } from "@/services/mapService";

export type MapColorBy = "students" | "ngos" | "schools";
export type MapGenderFilter = "all" | "male" | "female" | "other";
export type MapLayerFilter = "all" | "students" | "ngos" | "schools";

function colorForCount(count: number, max: number) {
  if (max <= 0) return "#93c5fd";
  const ratio = count / max;
  if (ratio > 0.66) return "#1e3a8a";
  if (ratio > 0.33) return "#2563eb";
  if (ratio > 0) return "#93c5fd";
  return "#cbd5e1";
}

function studentValue(province: ProvinceStats, genderFilter: MapGenderFilter) {
  if (genderFilter === "male") return province.maleStudents;
  if (genderFilter === "female") return province.femaleStudents;
  if (genderFilter === "other") return province.otherStudents;
  return province.totalStudents;
}

/** Spreads partners that share a province center apart so pins don't stack;
 * stable per id (no lat/lng saved yet) instead of jittering on every render. */
function jitteredPosition(id: string, code: string | null): [number, number] | null {
  if (!code) return null;
  const base = PROVINCE_COORDINATES[code];
  if (!base) return null;

  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 0.08 + ((hash >> 8) % 100) / 1000;

  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

function partnerPosition(partner: MapPartner): [number, number] | null {
  if (partner.lat != null && partner.lng != null) return [partner.lat, partner.lng];
  return jitteredPosition(partner.id, partner.provinceCode);
}

export function CambodiaMap({
  stats,
  ngos,
  schools,
  colorBy = "students",
  genderFilter = "all",
  layerFilter = "all",
}: {
  stats: ProvinceStats[];
  ngos: MapPartner[];
  schools: MapPartner[];
  colorBy?: MapColorBy;
  genderFilter?: MapGenderFilter;
  layerFilter?: MapLayerFilter;
}) {
  const showStudents = layerFilter === "all" || layerFilter === "students";
  const showNgos = layerFilter === "all" || layerFilter === "ngos";
  const showSchools = layerFilter === "all" || layerFilter === "schools";
  const ngoCountByProvince = new Map<string, number>();
  for (const ngo of ngos) {
    if (!ngo.provinceCode) continue;
    ngoCountByProvince.set(ngo.provinceCode, (ngoCountByProvince.get(ngo.provinceCode) ?? 0) + 1);
  }
  const schoolCountByProvince = new Map<string, number>();
  for (const school of schools) {
    if (!school.provinceCode) continue;
    schoolCountByProvince.set(school.provinceCode, (schoolCountByProvince.get(school.provinceCode) ?? 0) + 1);
  }

  function metricValue(province: ProvinceStats) {
    if (colorBy === "ngos") return ngoCountByProvince.get(province.code) ?? 0;
    if (colorBy === "schools") return schoolCountByProvince.get(province.code) ?? 0;
    return studentValue(province, genderFilter);
  }

  const max = Math.max(1, ...stats.map((s) => metricValue(s)));

  return (
    <MapContainer
      center={CAMBODIA_CENTER}
      zoom={7}
      minZoom={7}
      maxBounds={CAMBODIA_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Default position (top-left) overlapped the filter dropdowns rendered
          on top of the map in page.tsx — moved out of their way. */}
      <ZoomControl position="topright" />
      {showStudents && stats.map((province) => {
        const coords = PROVINCE_COORDINATES[province.code];
        if (!coords) return null;

        const value = metricValue(province);
        const radius = 8 + (value / max) * 22;
        const color = colorForCount(value, max);

        return (
          <CircleMarker
            key={province.provinceId}
            center={coords}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Tooltip permanent direction="center" className="map-count-label">
              {value}
            </Tooltip>
            <Popup>
              <div className="w-56 space-y-2.5 py-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <p className="text-sm font-semibold">{province.nameEn}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-2.5 py-1.5">
                  <span className="text-xs text-muted-foreground">Total Students</span>
                  <span className="text-base font-bold text-primary">{province.totalStudents}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-blue-500" />
                    Male
                  </span>
                  <span className="font-medium">{province.maleStudents}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-pink-500" />
                    Female
                  </span>
                  <span className="font-medium">{province.femaleStudents}</span>
                </div>

                <div className="space-y-1.5 border-t pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="size-3.5 text-indigo-600" />
                      From NGO
                    </span>
                    <span className="font-semibold">{province.ngoStudents}</span>
                  </div>
                  <p className="pl-5 text-[11px] text-muted-foreground">
                    Male {province.ngoMaleStudents} · Female {province.ngoFemaleStudents}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="size-3.5 text-slate-500" />
                      Non-NGO
                    </span>
                    <span className="font-semibold">{province.nonNgoStudents}</span>
                  </div>
                  <p className="pl-5 text-[11px] text-muted-foreground">
                    Male {province.nonNgoMaleStudents} · Female {province.nonNgoFemaleStudents}
                  </p>
                </div>

                <div className="space-y-1.5 border-t pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <HeartHandshake className="size-3.5 text-pink-600" />
                      Home Visit Completed
                    </span>
                    <span className="font-medium">{province.homeVisitCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-green-600" />
                      Final Selected
                    </span>
                    <span className="font-semibold text-green-700">{province.selectedStudents}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {showNgos && ngos.map((ngo) => {
        const position = partnerPosition(ngo);
        if (!position) return null;
        return (
          <CircleMarker
            key={`ngo-${ngo.id}`}
            center={position}
            radius={6}
            pathOptions={{ color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.9, weight: 1 }}
          >
            <Tooltip>{ngo.name}</Tooltip>
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{ngo.name}</p>
                <p className="text-muted-foreground">NGO Partner</p>
                <Link href={`/ngos/${ngo.id}`} className="text-primary hover:underline">
                  View details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {showSchools && schools.map((school) => {
        const position = partnerPosition(school);
        if (!position) return null;
        return (
          <CircleMarker
            key={`school-${school.id}`}
            center={position}
            radius={6}
            pathOptions={{ color: "#d97706", fillColor: "#d97706", fillOpacity: 0.9, weight: 1 }}
          >
            <Tooltip>{school.name}</Tooltip>
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{school.name}</p>
                <p className="text-muted-foreground">School Partner</p>
                <Link href={`/schools/${school.id}`} className="text-primary hover:underline">
                  View details
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
