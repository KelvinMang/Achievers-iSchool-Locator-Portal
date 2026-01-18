"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import schoolsRaw from "@/data/schools.json";
import { haversineKm } from "@/lib/distance";
import { SchoolMap, School } from "@/components/SchoolMap";
import { useSearchParams } from "next/navigation";

type RankedSchool = School & { distanceKm: number };

const HK_BOUNDS = {
  north: 22.56,
  south: 22.15,
  east: 114.44,
  west: 113.83,
};

const BASE_PATH =
  process.env.NODE_ENV === "production"
    ? "/Achievers-iSchool-Locator-Portal"
    : "";

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const searchParams = useSearchParams();
  const schoolParam = searchParams.get("school");

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
  const [hoveredSchool, setHoveredSchool] = useState<School | null>(null);
  const [searchMode, setSearchMode] = useState<"area" | "school">("area");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!schoolParam) return;
  
    const decoded = decodeURIComponent(schoolParam);
  
    // match by name (exact), with a safe fallback to case-insensitive
    const found =
      schools.find((s) => s.name === decoded) ||
      schools.find((s) => s.name.toLowerCase() === decoded.toLowerCase());
  
    if (!found) return;
  
    setSelectedSchool(found);
    setHoveredSchool(null);
  
    // optional: switch to school mode so UI feels consistent
    setSearchMode("school");
    setSchoolSearchQuery(found.name);
  }, [isLoaded, schoolParam, schools]);

  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapSectionRef = useRef<HTMLElement | null>(null);

  const nearest10 = useMemo(() => ranked.slice(0, 15), [ranked]);

  // Filter schools by search query
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return [];
    const query = schoolSearchQuery.toLowerCase().trim();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.chineseName?.toLowerCase().includes(query) ||
        s.abbreviation?.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query)
    );
  }, [schoolSearchQuery, schools]);

  // Function to get text color based on school category (matching map marker colors)
  const getSchoolNameColor = (category?: string): string => {
    if (!category) return "text-achievers-primary"; // Default color
    if (category.includes("Private / International")) {
      return "text-[#8BC34A]"; // Light green for Private/International
    }
    if (category.includes("Direct Subsidy Scheme")) {
      return "text-[#FFA500]"; // Orange for Direct Subsidy Scheme
    }
    return "text-achievers-primary"; // Default color
  };

  const normalizeArray = (v: string | string[] | null | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };
  
  const stageBadges = (s: School) => {
    const chips = [
      { k: "K", on: !!s.stages?.kindergarten },
      { k: "P", on: !!s.stages?.primary },
      { k: "S", on: !!s.stages?.secondary },
    ];
    return chips;
  };
  
  const tierLabel = (s: School): string | null => {
    const rank = s.tier?.rankIndex;
    const name = s.tier?.secondary;
  
    if (rank == null || !name) return null;
  
    return `Tier ${rank} (${name})`;
  };
    
  const curriculumLabel = (s: School): string | null => {
    if (s.curriculum?.secondary?.length) {
      return `Curriculum: ${s.curriculum.secondary.join(", ")}`;
    }
    return null;
  }; 

  // Scroll map into view when a school is selected
  useEffect(() => {
    if (selectedSchool && mapSectionRef.current) {
      // Small delay to ensure map has updated
      const timer = setTimeout(() => {
        mapSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedSchool]);

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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Image
            src={`${BASE_PATH}/achievers-logo-white.png`}
            alt="The Achievers"
            width={260}
            height={70}
            priority
            className="ml-4 h-16 w-auto scale-250 brightness-0 invert lg:ml-6"
          />

          <Link
            href="/schools"
            className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/30 transition shadow-sm"
          >
            All Schools
          </Link>
        </div>
    </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[420px_1fr] lg:gap-6 lg:px-6">
        {/* Left panel */}
        <section className="flex flex-col rounded-2xl border border-achievers-primary/10 bg-white shadow-lg lg:h-[80vh] overflow-hidden">
          {/* Fixed header section */}
          <div className="flex-shrink-0 p-6 pb-5 border-b border-achievers-primary/5 bg-gradient-to-b from-white to-achievers-primary/2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold tracking-tight text-achievers-primary">iSchool Locator</div>
              <div className="rounded-full border border-achievers-primary/20 bg-achievers-primary/5 px-2.5 py-1 text-xs font-medium text-achievers-primary">
                Hong Kong
              </div>
            </div>
            <div className="text-xs text-achievers-primary/60 leading-relaxed">
              {searchMode === "area" 
                ? "Find schools near your location"
                : "Search for a specific school"}
            </div>

            {/* Mode toggle */}
            <div className="mt-5 flex gap-1.5 rounded-xl border border-achievers-primary/10 bg-achievers-primary/3 p-1 shadow-inner">
              <button
                onClick={() => {
                  setSearchMode("area");
                  setSchoolSearchQuery("");
                  setSelectedSchool(null);
                  setUserLocation(null);
                  setRanked([]);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  searchMode === "area"
                    ? "bg-white text-achievers-primary shadow-md scale-[1.02]"
                    : "text-achievers-primary/50 hover:text-achievers-primary/80 hover:bg-white/50"
                }`}
              >
                📍 By Area
              </button>
              <button
                onClick={() => {
                  setSearchMode("school");
                  setInputValue("");
                  setInputError(null);
                  setUserLocation(null);
                  setRanked([]);
                  setSelectedSchool(null);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  searchMode === "school"
                    ? "bg-white text-achievers-primary shadow-md scale-[1.02]"
                    : "text-achievers-primary/50 hover:text-achievers-primary/80 hover:bg-white/50"
                }`}
              >
                🔍 By School
              </button>
            </div>

            {/* Search input based on mode */}
            <div className="mt-5">
              {searchMode === "area" ? (
                <>
                  <label className="block text-xs font-semibold text-achievers-primary/80 mb-2.5">
                    Your area (Hong Kong)
                  </label>

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
                    <div className="relative">
                      <input
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          setInputError(null);
                        }}
                        placeholder="e.g. North Point, Tin Hau, Tsing Yi..."
                        className="w-full rounded-xl border-2 border-achievers-primary/15 bg-white px-4 py-3.5 pl-11 text-sm outline-none transition-all placeholder:text-achievers-primary/40 focus:border-achievers-secondary focus:shadow-md focus:shadow-achievers-secondary/10"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-achievers-primary/40 text-lg">📍</span>
                    </div>
                  </Autocomplete>

                  {inputError && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span>⚠️</span>
                      <span>{inputError}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-achievers-primary/80 mb-2.5">
                    School name or abbreviation
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={schoolSearchQuery}
                      onChange={(e) => {
                        setSchoolSearchQuery(e.target.value);
                        setSelectedSchool(null);
                      }}
                      placeholder="e.g. HKIS, Island School, 漢基..."
                      className="w-full rounded-xl border-2 border-achievers-primary/15 bg-white px-4 py-3.5 pl-11 text-sm outline-none transition-all placeholder:text-achievers-primary/40 focus:border-achievers-secondary focus:shadow-md focus:shadow-achievers-secondary/10"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-achievers-primary/40 text-lg">🔍</span>
                    {schoolSearchQuery && (
                      <button
                        onClick={() => setSchoolSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-achievers-primary/40 hover:text-achievers-primary/70 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable results section */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {searchMode === "area" ? (
              <>
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-4 -mx-6 px-6 border-b border-achievers-primary/5 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-achievers-primary/80 uppercase tracking-wide">
                      Nearest schools
                    </div>
                    <div className="text-xs font-medium text-achievers-primary/50 bg-achievers-primary/5 px-2.5 py-1 rounded-full">
                      {userLocation ? "Top 15" : "Select an area"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {!userLocation && (
                    <div className="text-center py-12 px-4">
                      <div className="text-4xl mb-3">📍</div>
                      <div className="text-sm font-medium text-achievers-primary/70 mb-1">
                        Select your area
                      </div>
                      <div className="text-xs text-achievers-primary/50">
                        Enter a location above to find nearby schools
                      </div>
                    </div>
                  )}

                  {userLocation && nearest10.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <div className="text-4xl mb-3">🔍</div>
                      <div className="text-sm font-medium text-achievers-primary/70 mb-1">
                        No results found
                      </div>
                      <div className="text-xs text-achievers-primary/50">
                        Try selecting a different area
                      </div>
                    </div>
                  )}

                  {nearest10.map((s, idx) => {
                    const isSelected = selectedSchool?.name === s.name;
                    const isHovered = hoveredSchool?.name === s.name;
                    return (
                      <button
                        key={`${s.name}-${s.lat}-${s.lng}`}
                        onClick={() => {
                          setSelectedSchool(s);
                          setHoveredSchool(null);
                        }}
                        onMouseEnter={() => {
                          setHoveredSchool(s);
                          if (mapSectionRef.current && window.innerWidth < 1024) {
                            mapSectionRef.current.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'nearest',
                              inline: 'nearest'
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (!selectedSchool || selectedSchool.name !== s.name) {
                            setHoveredSchool(null);
                          }
                        }}
                        className={`w-full text-left rounded-xl border-2 transition-all duration-200 px-4 py-3.5 ${
                          isSelected
                            ? "border-achievers-secondary bg-achievers-secondary/10 shadow-md"
                            : isHovered
                            ? "border-achievers-primary/30 bg-achievers-primary/8 shadow-sm"
                            : "border-achievers-primary/10 bg-white hover:border-achievers-primary/20 hover:bg-achievers-primary/3"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {(
                                <span className="flex-shrink-0 text-xs font-bold text-achievers-secondary bg-achievers-secondary/10 px-2 py-0.5 rounded-full">
                                  #{idx+1}
                                </span>
                              )}
                              <div className={`text-sm font-semibold leading-snug text-achievers-primary truncate ${
                                isSelected ? "text-achievers-secondary" : ""
                              }`}>
                                {s.name}
                              </div>
                            </div>
                            {s.chineseName && (
                              <div className="mt-1 text-xs text-achievers-primary/60">
                                {s.chineseName}
                              </div>
                            )}
                            {s.category && (
                              <div className={`mt-1.5 text-xs font-medium ${getSchoolNameColor(s.category)}`}>
                                {s.category}
                              </div>
                            )}
                            {/* Tier / Stages / Curriculum */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {tierLabel(s) && (
                                <span className="text-[12px] font-semibold text-achievers-primary bg-achievers-primary/5 border border-achievers-primary/15 px-2 py-0.5 rounded-full">
                                  {tierLabel(s)}
                                </span>
                              )}

                              <div className="flex items-center gap-1.5">
                                {stageBadges(s).map((c) => (
                                  <span
                                    key={c.k}
                                    className={`text-[12px] font-extrabold px-3 py-1 rounded-full tracking-wider ${
                                      c.on
                                        ? "bg-achievers-primary text-white shadow-sm"
                                        : "bg-achievers-primary/10 text-achievers-primary/40"
                                    }`}
                                  >
                                    {c.k}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {curriculumLabel(s) && (
                              <div className="mt-2 text-[12px] font-extrabold text-achievers-primary/60 leading-snug">
                                {curriculumLabel(s)}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-xs font-bold text-achievers-primary/70 bg-achievers-primary/5 px-2.5 py-1 rounded-lg whitespace-nowrap">
                            {s.distanceKm.toFixed(1)} km
                          </div>
                        </div>
                        <div className="mt-2.5 text-xs text-achievers-primary/60 line-clamp-2 leading-relaxed">
                          {s.address}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-4 -mx-6 px-6 border-b border-achievers-primary/5 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-achievers-primary/80 uppercase tracking-wide">
                      Search results
                    </div>
                    <div className="text-xs font-medium text-achievers-primary/50 bg-achievers-primary/5 px-2.5 py-1 rounded-full">
                      {filteredSchools.length > 0 
                        ? `${filteredSchools.length} found`
                        : schoolSearchQuery.trim() 
                          ? "No results"
                          : "Start typing"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {!schoolSearchQuery.trim() && (
                    <div className="text-center py-12 px-4">
                      <div className="text-4xl mb-3">🔍</div>
                      <div className="text-sm font-medium text-achievers-primary/70 mb-1">
                        Search for a school
                      </div>
                      <div className="text-xs text-achievers-primary/50">
                        Type a school name, abbreviation, or address above
                      </div>
                    </div>
                  )}

                  {filteredSchools.length === 0 && schoolSearchQuery.trim() && (
                    <div className="text-center py-12 px-4">
                      <div className="text-4xl mb-3">😕</div>
                      <div className="text-sm font-medium text-achievers-primary/70 mb-1">
                        No schools found
                      </div>
                      <div className="text-xs text-achievers-primary/50">
                        Try a different name or abbreviation
                      </div>
                    </div>
                  )}

                  {filteredSchools.map((s) => {
                    const isSelected = selectedSchool?.name === s.name;
                    const isHovered = hoveredSchool?.name === s.name;
                    return (
                      <button
                        key={`${s.name}-${s.lat}-${s.lng}`}
                        onClick={() => {
                          setSelectedSchool(s);
                          setHoveredSchool(null);
                        }}
                        onMouseEnter={() => {
                          setHoveredSchool(s);
                          if (mapSectionRef.current && window.innerWidth < 1024) {
                            mapSectionRef.current.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'nearest',
                              inline: 'nearest'
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (!selectedSchool || selectedSchool.name !== s.name) {
                            setHoveredSchool(null);
                          }
                        }}
                        className={`w-full text-left rounded-xl border-2 transition-all duration-200 px-4 py-3.5 ${
                          isSelected
                            ? "border-achievers-secondary bg-achievers-secondary/10 shadow-md"
                            : isHovered
                            ? "border-achievers-primary/30 bg-achievers-primary/8 shadow-sm"
                            : "border-achievers-primary/10 bg-white hover:border-achievers-primary/20 hover:bg-achievers-primary/3"
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`text-sm font-semibold leading-snug text-achievers-primary mb-1 ${
                            isSelected ? "text-achievers-secondary" : ""
                          }`}>
                            {s.name}
                          </div>
                          {s.chineseName && (
                            <div className="mt-1 text-xs text-achievers-primary/60">
                              {s.chineseName}
                            </div>
                          )}
                          {s.category && (
                            <div className={`mt-1.5 text-xs font-medium ${getSchoolNameColor(s.category)}`}>
                              {s.category}
                            </div>
                          )}
                          {curriculumLabel(s) && (
                            <div className="mt-2 text-[11px] text-achievers-primary/60 leading-snug">
                              {curriculumLabel(s)}
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5 text-xs text-achievers-primary/60 line-clamp-2 leading-relaxed">
                          📍 {s.address}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Map */}
        <section 
          ref={mapSectionRef}
          className="relative overflow-hidden rounded-2xl border-2 border-achievers-primary/10 bg-white shadow-lg"
        >
          <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white via-white/95 to-transparent" />
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-sm border border-achievers-primary/10 rounded-lg px-3 py-1.5 shadow-sm">
              <div className="text-xs font-semibold text-achievers-primary/80">
                Hong Kong • International Schools
              </div>
            </div>
          </div>

          <div className="h-[76vh] lg:h-[80vh]">
            <SchoolMap
              schools={schools}
              selectedSchool={selectedSchool}
              hoveredSchool={hoveredSchool}
              onSelectSchool={setSelectedSchool}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
