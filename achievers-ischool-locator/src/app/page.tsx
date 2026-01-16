"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import schoolsRaw from "@/data/schools.json";
import { haversineKm } from "@/lib/distance";
import { SchoolMap, School } from "@/components/SchoolMap";

type RankedSchool = School & { distanceKm: number };

const HK_BOUNDS = {
  north: 22.56,
  south: 22.15,
  east: 114.44,
  west: 113.83,
};

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const schools = schoolsRaw as School[];

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: ["places"],
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [ranked, setRanked] = useState<RankedSchool[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  const nearest10 = useMemo(() => ranked.slice(0, 10), [ranked]);

  function computeNearest(lat: number, lng: number) {
    const list = schools
      .map((s) => ({
        ...s,
        distanceKm: haversineKm(lat, lng, s.lat, s.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    setRanked(list);
  }

  if (!apiKey) {
    return <div className="p-6 text-red-600">Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local</div>;
  }

  if (loadError) {
    return <div className="p-6 text-red-600">Failed to load Google Maps. Check APIs + key restrictions.</div>;
  }

  if (!isLoaded) {
    return <div className="p-6 text-achievers-primary/70">Loading…</div>;
  }

  return (
    <main className="min-h-screen bg-white text-achievers-primary">
      {/* Top brand bar */}
      <header className="sticky top-0 z-50 border-b border-achievers-primary/10 bg-achievers-primary">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-center px-4 lg:px-6">
          <Image
            src="/achievers-logo-white.png"
            alt="The Achievers"
            width={260}
            height={70}
            priority
            className="h-14 w-auto brightness-0 invert"
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[420px_1fr] lg:gap-6 lg:px-6">
        {/* Left panel */}
        <section className="rounded-2xl border border-achievers-primary/10 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold tracking-tight">iSchool Locator</div>
          <div className="mt-1 text-sm text-achievers-primary/70">
            Select your urban area to see nearest schools
          </div>

          {/* Autocomplete input */}
          <div className="mt-4">
            <div className="text-xs font-medium text-achievers-primary/70 mb-2">
              Your area (Hong Kong)
            </div>

            <Autocomplete
              onLoad={(ac) => {
                acRef.current = ac;
                ac.setOptions({
                  componentRestrictions: { country: "hk" },
                  fields: ["geometry", "name"],
                  types: ["geocode"],
                  bounds: HK_BOUNDS as any,
                  strictBounds: false,
                });
              }}
              onPlaceChanged={() => {
                const place = acRef.current?.getPlace();
                const loc = place?.geometry?.location;

                if (!loc) {
                  setInputError("Please select a location from suggestions to confirm.");
                  return;
                }

                const lat = loc.lat();
                const lng = loc.lng();

                setInputError(null);
                setUserLocation({ lat, lng });
                computeNearest(lat, lng);

                // Optional: clear previous selected school until user clicks one
                setSelectedSchool(null);
              }}
            >
              <input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError(null);
                }}
                placeholder="e.g. North Point / Tin Hau / Tsing Yi"
                className="w-full rounded-xl border border-achievers-primary/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-achievers-primary/40 focus:border-achievers-secondary/50"
              />
            </Autocomplete>

            {inputError && (
              <div className="mt-2 text-xs text-red-600">{inputError}</div>
            )}
          </div>

          {/* Results */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-achievers-primary/70">
                Nearest schools
              </div>
              <div className="text-xs text-achievers-primary/60">
                {userLocation ? "Top 10" : "Select an area"}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {userLocation && nearest10.length === 0 && (
                <div className="text-sm text-achievers-primary/60">
                  No results yet.
                </div>
              )}

              {nearest10.map((s, idx) => (
                <button
                  key={`${s.name}-${s.lat}-${s.lng}`}
                  onClick={() => setSelectedSchool(s)}
                  className="w-full text-left rounded-xl border border-achievers-primary/10 bg-white px-4 py-3 transition hover:border-achievers-primary/30 hover:bg-achievers-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium leading-snug">
                      {idx === 0 ? "Closest — " : ""}
                      {s.name}
                    </div>
                    <div className="text-xs text-achievers-primary/70">
                      {s.distanceKm.toFixed(1)} km
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-achievers-primary/70 line-clamp-2">
                    {s.address}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="relative overflow-hidden rounded-2xl border border-achievers-primary/10 bg-white shadow-sm">
          <div className="absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white/80 to-transparent" />
          <div className="absolute left-4 top-4 z-20 text-xs text-achievers-primary/70">
            Hong Kong • International Schools
          </div>

          <div className="h-[76vh] lg:h-[80vh]">
            <SchoolMap
              schools={schools}
              selectedSchool={selectedSchool}
              onSelectSchool={setSelectedSchool}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

// import Image from "next/image";
// import schools from "@/data/schools.json";
// import { SchoolMap } from "@/components/SchoolMap";

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-white text-achievers-primary">
//       {/* Top brand bar */}
//       <header className="sticky top-0 z-50 border-b border-achievers-primary/10 bg-achievers-primary">
//         <div className="mx-auto flex h-20 max-w-7xl items-center justify-start px-4 lg:px-10">
//           <Image
//             src="/achievers-logo-white.png"
//             alt="The Achievers"
//             width={500}
//             height={125}
//             priority
//             className="ml-4 h-16 w-auto scale-250 brightness-0 invert lg:ml-6"
//           />
//         </div>
//       </header>

//       {/* Content */}
//       <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[380px_1fr] lg:gap-6 lg:px-6">
//         {/* Left panel */}
//         <section className="rounded-2xl border border-achievers-primary/10 bg-white p-5 shadow-sm">
//           <div className="flex items-start justify-between gap-3">
//             <div>
//               <div className="text-base font-semibold tracking-tight">
//                 iSchool Locator
//               </div>
//               <div className="mt-1 text-sm text-achievers-primary/70">
//                 Showing {(schools as any[]).length} schools on map (MVP Step 1)
//               </div>
//             </div>
//             <div className="rounded-full border border-achievers-primary/20 bg-achievers-primary/5 px-3 py-1 text-xs text-achievers-primary">
//               HK
//             </div>
//           </div>

//           <div className="mt-5 max-h-[65vh] space-y-2 overflow-auto pr-1">
//             {(schools as any[]).map((s) => (
//               <div
//                 key={`${s.name}-${s.lat}-${s.lng}`}
//                 className="rounded-xl border border-achievers-primary/10 bg-white px-4 py-3 transition hover:border-achievers-primary/30 hover:bg-achievers-primary/5"
//               >
//                 <div className="text-sm font-medium leading-snug">{s.name}</div>
//                 <div className="mt-1 text-xs text-achievers-primary/70">{s.address}</div>
//               </div>
//             ))}
//           </div>

//           <div className="mt-5 rounded-xl border border-achievers-secondary/30 bg-achievers-secondary/10 px-4 py-3 text-xs text-achievers-primary">
//             Next: add Autocomplete + Top 10 nearest ranking.
//           </div>
//         </section>

//         {/* Map */}
//         <section className="relative overflow-hidden rounded-2xl border border-achievers-primary/10 bg-white shadow-sm">
//           <div className="absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white/80 to-transparent" />
//           <div className="absolute left-4 top-4 z-20 text-xs text-achievers-primary/70">
//             Hong Kong • International Schools
//           </div>

//           <div className="h-[76vh] lg:h-[80vh]">
//             <SchoolMap schools={schools as any} />
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }
