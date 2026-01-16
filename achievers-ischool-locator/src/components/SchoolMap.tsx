"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { darkMapStyle } from "@/lib/mapStyle";

export type School = {
  name: string;
  chineseName?: string;
  abbreviation?: string;
  category?: string;
  address: string;
  lat: number;
  lng: number;
};

const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };
const defaultCenter = { lat: 22.3193, lng: 114.1694 };

function gmapsSearchUrl(name: string, address: string) {
  const q = encodeURIComponent(`${name} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function SchoolMap({
  schools,
  selectedSchool,
  onSelectSchool,
}: {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (s: School | null) => void;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Function to get icon color based on school category
  const getIconColor = (category?: string): string => {
    if (!category) return "#EA4335"; // Default red
    if (category.includes("Private / International")) {
      return "#8BC34A"; // Light green for Private/International
    }
    if (category.includes("Direct Subsidy Scheme")) {
      return "#FFA500"; // Orange for Direct Subsidy Scheme
    }
    return "#EA4335"; // Default red
  };

  // Function to create SVG icon with specified color
  const createIcon = (color: string): google.maps.Icon | undefined => {
    if (typeof window === "undefined" || !(window as any).google?.maps) return undefined;
    const svgIcon =
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><path d="M20 0C9 0 0 9 0 20c0 11 20 30 20 30s20-19 20-30C40 9 31 0 20 0z" fill="${color}"/><circle cx="20" cy="20" r="8" fill="#FFFFFF"/></svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`,
      scaledSize: new google.maps.Size(28, 35),
      anchor: new google.maps.Point(14, 35),
    } as google.maps.Icon;
  };

  // When user clicks a school from the left list, pan + open InfoWindow
  useEffect(() => {
    if (!selectedSchool || !mapRef.current) return;
    mapRef.current.panTo({ lat: selectedSchool.lat, lng: selectedSchool.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 13));
    setInfoOpen(true);
  }, [selectedSchool]);

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
          <div style={{ maxWidth: 260 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {selectedSchool.name}
            </div>
            {selectedSchool.chineseName && (
              <div style={{ fontSize: 13, marginBottom: 4, color: '#666' }}>
                {selectedSchool.chineseName}
              </div>
            )}
            {selectedSchool.category && (
              <div style={{ fontSize: 11, marginBottom: 8, color: '#888' }}>
                {selectedSchool.category}
              </div>
            )}
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
              {selectedSchool.address}
            </div>
            <a
              href={gmapsSearchUrl(selectedSchool.name, selectedSchool.address)}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(12,0,125,0.25)",
                background: "rgba(12,0,125,0.06)",
                color: "#0c007d",
                display: "inline-block",
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

// import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
// import { darkMapStyle } from "@/lib/mapStyle";
// import { useMemo, useState } from "react";

// export type School = {
//   name: string;
//   address: string;
//   lat: number;
//   lng: number;
// };

// const containerStyle: React.CSSProperties = {
//   width: "100%",
//   height: "100%",
// };

// const defaultCenter = { lat: 22.3193, lng: 114.1694 };

// function gmapsSearchUrl(name: string, address: string) {
//   const q = encodeURIComponent(`${name} ${address}`);
//   return `https://www.google.com/maps/search/?api=1&query=${q}`;
// }

// export function SchoolMap({ schools }: { schools: School[] }) {
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
//   const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

//   const { isLoaded, loadError } = useJsApiLoader({
//     id: "google-map-script",
//     googleMapsApiKey: apiKey || "",
//   });

//   // Create Google Maps style red pin marker icon - only when map is loaded
//   const locationIcon = useMemo(() => {
//     if (!isLoaded || typeof window === "undefined" || !(window as any).google?.maps) {
//       return undefined;
//     }
//     const google = (window as any).google;

//     const svgIcon = `
//       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
//         <path d="M20 0C9 0 0 9 0 20c0 11 20 30 20 30s20-19 20-30C40 9 31 0 20 0z" fill="#EA4335"/>
//         <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
//       </svg>
//     `;

//     return {
//       url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`,
//       scaledSize: new google.maps.Size(28, 35),
//       anchor: new google.maps.Point(14, 35),
//     };
//   }, [isLoaded]);

//   if (!apiKey) {
//     return (
//       <div className="h-full w-full grid place-items-center text-sm text-red-500">
//         Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local
//       </div>
//     );
//   }

//   if (loadError) {
//     return (
//       <div className="h-full w-full grid place-items-center text-sm text-red-500">
//         Failed to load Google Maps. Check API key restrictions & enabled APIs.
//       </div>
//     );
//   }

//   if (!isLoaded) {
//     return (
//       <div className="h-full w-full grid place-items-center text-sm text-achievers-primary/70">
//         Loading map…
//       </div>
//     );
//   }

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
//       onClick={() => setSelectedSchool(null)}
//     >
//       {schools.map((s) => (
//         <Marker
//           key={`${s.name}-${s.lat}-${s.lng}`}
//           position={{ lat: s.lat, lng: s.lng }}
//           title={s.name}
//           icon={locationIcon}
//           onClick={() => setSelectedSchool(s)}
//         />
//       ))}

//       {selectedSchool && (
//         <InfoWindow
//           position={{ lat: selectedSchool.lat, lng: selectedSchool.lng }}
//           onCloseClick={() => setSelectedSchool(null)}
//         >
//           <div style={{ maxWidth: 260 }}>
//             <div style={{ fontWeight: 700, marginBottom: 6 }}>
//               {selectedSchool.name}
//             </div>

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

