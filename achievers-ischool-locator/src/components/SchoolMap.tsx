"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { darkMapStyle } from "@/lib/mapStyle";

export type SchoolTier = {
  secondary?: "Top" | "Middle" | "Accessible" | "Transition" | null;
  rankIndex?: number | null;
};

export type SchoolCurriculum = {
  secondary?: string[]; // e.g. ["IGCSE","IBDP"]
  pathway?: string | string[] | null; // your JSON has both string and array in some rows
};

export type SchoolStages = {
  kindergarten?: boolean;
  primary?: boolean;
  secondary?: boolean;
};

export type School = {
  name: string;
  chineseName?: string;
  abbreviation?: string;
  category?: string;
  address: string;
  lat: number;
  lng: number;

  tier?: SchoolTier;
  curriculum?: SchoolCurriculum;
  stages?: SchoolStages;
};

const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };
const defaultCenter = { lat: 22.3193, lng: 114.1694 };

function gmapsSearchUrl(name: string, address: string) {
  const q = encodeURIComponent(`${name} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function normalizeArray(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function formatStages(stages?: SchoolStages) {
  const chips: { key: "K" | "P" | "S"; on: boolean }[] = [
    { key: "K", on: !!stages?.kindergarten },
    { key: "P", on: !!stages?.primary },
    { key: "S", on: !!stages?.secondary },
  ];
  return chips;
}

function formatTier(tier?: SchoolTier) {
  const rank = tier?.rankIndex;
  const name = tier?.secondary;
  if (rank == null || !name) return null;
  return `Tier ${rank} (${name})`;
}


export function SchoolMap({
  schools,
  selectedSchool,
  onSelectSchool,
  hoveredSchool,
}: {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (s: School | null) => void;
  hoveredSchool?: School | null;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Icon color by category (keep your logic)
  const getIconColor = (category?: string): string => {
    if (!category) return "#EA4335"; // Default red
    if (category.includes("Private / International")) return "#8BC34A";
    if (category.includes("Direct Subsidy Scheme")) return "#FFA500";
    return "#EA4335";
  };

  const createIcon = (color: string): google.maps.Icon | undefined => {
    if (typeof window === "undefined" || !(window as any).google?.maps) return undefined;
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 11 20 30 20 30s20-19 20-30C40 9 31 0 20 0z" fill="${color}"/><circle cx="20" cy="20" r="8" fill="#FFFFFF"/></svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`,
      scaledSize: new google.maps.Size(28, 35),
      anchor: new google.maps.Point(14, 35),
    } as google.maps.Icon;
  };

  // Pan + open InfoWindow when selected from left list
  useEffect(() => {
    if (!selectedSchool || !mapRef.current) return;
    mapRef.current.panTo({ lat: selectedSchool.lat, lng: selectedSchool.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 13));
    setInfoOpen(true);
  }, [selectedSchool]);

  // Pan on hover (don’t force open)
  useEffect(() => {
    if (!hoveredSchool || !mapRef.current || selectedSchool) return;
    mapRef.current.panTo({ lat: hoveredSchool.lat, lng: hoveredSchool.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 13));
  }, [hoveredSchool, selectedSchool]);

  // Precompute stage chips for the selected school
  const selectedStageChips = useMemo(() => formatStages(selectedSchool?.stages), [selectedSchool]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={11}
      options={{
        styles: darkMapStyle as any,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      }}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      onClick={() => {
        onSelectSchool(null);
        setInfoOpen(false);
      }}
    >
      {schools.map((s) => {
        const iconColor = getIconColor(s.category);
        const markerIcon = createIcon(iconColor);

        return (
          <Marker
            key={`${s.name}-${s.lat}-${s.lng}`}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.name}
            icon={markerIcon}
            onClick={() => {
              onSelectSchool(s);
              setInfoOpen(true);
            }}
          />
        );
      })}

      {selectedSchool && infoOpen && (
        <InfoWindow
          position={{ lat: selectedSchool.lat, lng: selectedSchool.lng }}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div style={{ maxWidth: 280, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontWeight: 800, marginBottom: 6, color: "#0c007d" }}>
                {selectedSchool.name}
              </div>
            </div>

            {selectedSchool.chineseName && (
              <div style={{ fontSize: 13, marginBottom: 6, color: "#4b5563" }}>
                {selectedSchool.chineseName}
              </div>
            )}

            {/* Tier + stages row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {formatTier(selectedSchool.tier) && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid rgba(12,0,125,0.18)",
                background: "rgba(12,0,125,0.06)",
                color: "#0c007d",
              }}
            >
              {formatTier(selectedSchool.tier)}
            </span>
          )}

              {selectedStageChips.map((c) => (
                <span
                  key={c.key}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: c.on ? "#0c007d" : "#e5e7eb",
                    color: c.on ? "#ffffff" : "#9ca3af",
                    letterSpacing: "0.04em",
                  }}
                >
                  {c.key}
                </span>
              ))}
            </div>

            {/* Curriculum (no pathway on map) */}
            {selectedSchool.curriculum?.secondary?.length ? (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#374151" }}>
                  <span style={{ fontWeight: 700 }}>Curriculum:</span>{" "}
                  {selectedSchool.curriculum.secondary.join(", ")}
                </div>
              </div>
            ) : null}

            {selectedSchool.category && (
              <div style={{ fontSize: 11, marginBottom: 8, color: "#6b7280" }}>
                {selectedSchool.category}
              </div>
            )}

            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10, color: "#111827" }}>
              {selectedSchool.address}
            </div>

            <a
              href={gmapsSearchUrl(selectedSchool.name, selectedSchool.address)}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                textDecoration: "none",
                padding: "7px 10px",
                borderRadius: 12,
                border: "1px solid rgba(12,0,125,0.25)",
                background: "rgba(12,0,125,0.06)",
                color: "#0c007d",
                display: "inline-block",
                fontWeight: 700,
              }}
            >
              Open in Google Maps
            </a>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}



// "use client";

// import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { darkMapStyle } from "@/lib/mapStyle";

// export type School = {
//   name: string;
//   chineseName?: string;
//   abbreviation?: string;
//   category?: string;
//   address: string;
//   lat: number;
//   lng: number;
// };

// const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };
// const defaultCenter = { lat: 22.3193, lng: 114.1694 };

// function gmapsSearchUrl(name: string, address: string) {
//   const q = encodeURIComponent(`${name} ${address}`);
//   return `https://www.google.com/maps/search/?api=1&query=${q}`;
// }

// export function SchoolMap({
//   schools,
//   selectedSchool,
//   onSelectSchool,
//   hoveredSchool,
// }: {
//   schools: School[];
//   selectedSchool: School | null;
//   onSelectSchool: (s: School | null) => void;
//   hoveredSchool?: School | null;
// }) {
//   const mapRef = useRef<google.maps.Map | null>(null);
//   const [infoOpen, setInfoOpen] = useState(false);

//   // Function to get icon color based on school category
//   const getIconColor = (category?: string): string => {
//     if (!category) return "#EA4335"; // Default red
//     if (category.includes("Private / International")) {
//       return "#8BC34A"; // Light green for Private/International
//     }
//     if (category.includes("Direct Subsidy Scheme")) {
//       return "#FFA500"; // Orange for Direct Subsidy Scheme
//     }
//     return "#EA4335"; // Default red
//   };

//   // Function to create SVG icon with specified color
//   const createIcon = (color: string): google.maps.Icon | undefined => {
//     if (typeof window === "undefined" || !(window as any).google?.maps) return undefined;
//     const svgIcon =
//       `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 11 20 30 20 30s20-19 20-30C40 9 31 0 20 0z" fill="${color}"/><circle cx="20" cy="20" r="8" fill="#FFFFFF"/></svg>`;
//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`,
//       scaledSize: new google.maps.Size(28, 35),
//       anchor: new google.maps.Point(14, 35),
//     } as google.maps.Icon;
//   };

//   // When user clicks a school from the left list, pan + open InfoWindow
//   useEffect(() => {
//     if (!selectedSchool || !mapRef.current) return;
//     mapRef.current.panTo({ lat: selectedSchool.lat, lng: selectedSchool.lng });
//     mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 13));
//     setInfoOpen(true);
//   }, [selectedSchool]);

//   // When user hovers a school, pan to it but don't open InfoWindow
//   useEffect(() => {
//     if (!hoveredSchool || !mapRef.current || selectedSchool) return;
//     mapRef.current.panTo({ lat: hoveredSchool.lat, lng: hoveredSchool.lng });
//     mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 13));
//   }, [hoveredSchool, selectedSchool]);

//   return (
//     <GoogleMap
//       mapContainerStyle={containerStyle}
//       center={defaultCenter}
//       zoom={11}
//       options={{
//         styles: darkMapStyle as any,
//         disableDefaultUI: true,
//         zoomControl: true,
//         clickableIcons: false,
//       }}
//       onLoad={(map) => {
//         mapRef.current = map;
//       }}
//       onClick={() => {
//         onSelectSchool(null);
//         setInfoOpen(false);
//       }}
//     >
//       {schools.map((s) => {
//         const iconColor = getIconColor(s.category);
//         const markerIcon = createIcon(iconColor);
//         return (
//           <Marker
//             key={`${s.name}-${s.lat}-${s.lng}`}
//             position={{ lat: s.lat, lng: s.lng }}
//             title={s.name}
//             icon={markerIcon}
//             onClick={() => {
//               onSelectSchool(s);
//               setInfoOpen(true);
//             }}
//           />
//         );
//       })}

//       {selectedSchool && infoOpen && (
//         <InfoWindow
//           position={{ lat: selectedSchool.lat, lng: selectedSchool.lng }}
//           onCloseClick={() => setInfoOpen(false)}
//         >
//           <div style={{ maxWidth: 260 }}>
//             <div style={{ fontWeight: 700, marginBottom: 6 }}>
//               {selectedSchool.name}
//             </div>
//             {selectedSchool.chineseName && (
//               <div style={{ fontSize: 13, marginBottom: 4, color: '#666' }}>
//                 {selectedSchool.chineseName}
//               </div>
//             )}
//             {selectedSchool.category && (
//               <div style={{ fontSize: 11, marginBottom: 8, color: '#888' }}>
//                 {selectedSchool.category}
//               </div>
//             )}
//             <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
//               {selectedSchool.address}
//             </div>
//             <a
//               href={gmapsSearchUrl(selectedSchool.name, selectedSchool.address)}
//               target="_blank"
//               rel="noreferrer"
//               style={{
//                 fontSize: 12,
//                 textDecoration: "none",
//                 padding: "6px 10px",
//                 borderRadius: 10,
//                 border: "1px solid rgba(12,0,125,0.25)",
//                 background: "rgba(12,0,125,0.06)",
//                 color: "#0c007d",
//                 display: "inline-block",
//               }}
//             >
//               Open in Google Maps
//             </a>
//           </div>
//         </InfoWindow>
//       )}
//     </GoogleMap>
//   );
// }
