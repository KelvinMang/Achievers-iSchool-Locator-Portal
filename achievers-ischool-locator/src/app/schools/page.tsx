"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import schoolsRaw from "@/data/schools.json";
import type { School } from "@/components/SchoolMap";

const schoolHref = (name: string) => `${BASE_PATH}/?school=${encodeURIComponent(name)}`;

const BASE_PATH =
  process.env.NODE_ENV === "production"
    ? "/Achievers-iSchool-Locator-Portal"
    : "";


const getSchoolNameColor = (category?: string): string => {
  if (!category) return "text-achievers-primary";
  if (category.includes("Private / International")) {
    return "text-[#8BC34A]";
  }
  if (category.includes("Direct Subsidy Scheme")) {
    return "text-[#FFA500]";
  }
  return "text-achievers-primary";
};

type TierOption = {
  key: string; // "1|Top"
  label: string; // "Tier 1 (Top)"
  rankIndex: number;
  secondary: string;
};

function tierText(s: School): string | null {
  const rank = s.tier?.rankIndex;
  const sec = s.tier?.secondary;
  if (rank == null || !sec) return null;
  return `Tier ${rank} (${sec})`;
}

function stageChips(s: School) {
  return [
    { k: "K" as const, on: !!s.stages?.kindergarten },
    { k: "P" as const, on: !!s.stages?.primary },
    { k: "S" as const, on: !!s.stages?.secondary },
  ];
}

function curriculumText(s: School): string | null {
  const arr = s.curriculum?.secondary ?? [];
  if (!arr.length) return null;
  return `Curriculum: ${arr.join(", ")}`;
}

export default function SchoolsDirectoryPage() {
  const schools = schoolsRaw as School[];

  // Build filter options from dataset (no hard-code)
  const tierOptions = useMemo<TierOption[]>(() => {
    const map = new Map<string, TierOption>();
    for (const s of schools) {
      const rank = s.tier?.rankIndex;
      const sec = s.tier?.secondary;
      if (rank == null || !sec) continue;
      const key = `${rank}|${sec}`;
      if (!map.has(key)) {
        map.set(key, { key, label: `Tier ${rank} (${sec})`, rankIndex: rank, secondary: sec });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.rankIndex - b.rankIndex);
  }, [schools]);

  const curriculumOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const s of schools) {
      (s.curriculum?.secondary ?? []).forEach((c) => set.add(c));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [schools]);

  // Multi-select states
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<Array<"K" | "P" | "S">>([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return schools.filter((s) => {
      // Search query
      if (q) {
        const hay = [
          s.name,
          s.chineseName ?? "",
          s.abbreviation ?? "",
          s.address,
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Tier filter
      if (selectedTiers.length) {
        const rank = s.tier?.rankIndex;
        const sec = s.tier?.secondary;
        const key = rank != null && sec ? `${rank}|${sec}` : "";
        if (!selectedTiers.includes(key)) return false;
      }

      // Curriculum filter (match ANY selected curriculum)
      if (selectedCurricula.length) {
        const sch = new Set(s.curriculum?.secondary ?? []);
        const ok = selectedCurricula.some((c) => sch.has(c));
        if (!ok) return false;
      }

      // Stage filter (match ANY selected stage)
      if (selectedStages.length) {
        const hasK = !!s.stages?.kindergarten;
        const hasP = !!s.stages?.primary;
        const hasS = !!s.stages?.secondary;

        const ok =
          (selectedStages.includes("K") && hasK) ||
          (selectedStages.includes("P") && hasP) ||
          (selectedStages.includes("S") && hasS);

        if (!ok) return false;
      }

      return true;
    });
  }, [schools, query, selectedTiers, selectedCurricula, selectedStages]);

  const activeFilterCount =
    (selectedTiers.length ? 1 : 0) +
    (selectedCurricula.length ? 1 : 0) +
    (selectedStages.length ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const toggle = <T,>(arr: T[], value: T) =>
    arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

  return (
    <main className="min-h-screen bg-white text-achievers-primary">
      {/* Brand bar */}
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

          <nav className="flex items-center gap-3">
            {/* Locator (secondary) */}
            <Link
              href={`${BASE_PATH}/`}
              className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25 transition shadow-sm"
            >
              Locator
            </Link>

            {/* All Schools (active) */}
            <Link
              href={`${BASE_PATH}/schools/`}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-achievers-primary hover:bg-white/90 transition shadow-md"
            >
              All Schools
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[420px_1fr] lg:gap-6 lg:px-6">
        {/* Filters */}
        <section className="rounded-2xl border border-achievers-primary/10 bg-white shadow-lg overflow-hidden lg:h-[80vh]">
          <div className="p-6 border-b border-achievers-primary/5 bg-gradient-to-b from-white to-achievers-primary/2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold tracking-tight">All Schools</div>
                <div className="mt-1 text-xs text-achievers-primary/60">
                  Filter by tier, curriculum, and stages (multi-select)
                </div>
              </div>
              <div className="rounded-full border border-achievers-primary/15 bg-achievers-primary/5 px-3 py-1 text-xs font-semibold text-achievers-primary">
                {filtered.length} / {schools.length}
              </div>
            </div>

            {/* Search */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-achievers-primary/80 mb-2.5">
                Search
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name / Chinese / Abbrev / Address"
                className="w-full rounded-xl border-2 border-achievers-primary/15 bg-white px-4 py-3.5 text-sm outline-none transition-all placeholder:text-achievers-primary/40 focus:border-achievers-secondary focus:shadow-md focus:shadow-achievers-secondary/10"
              />
            </div>

            {/* Stage filter */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-achievers-primary/80 mb-2.5">
                Stages (Any)
              </div>
              <div className="flex flex-wrap gap-2">
              {(
                [
                  { k: "K" as const, label: "Kindergarten" },
                  { k: "P" as const, label: "Primary" },
                  { k: "S" as const, label: "Secondary" },
                ] as const
              ).map((item) => {
                const on = selectedStages.includes(item.k);
                return (
                  <button
                    key={item.k}
                    onClick={() => setSelectedStages(toggle(selectedStages, item.k))}
                    className={`text-[12px] font-extrabold px-3 py-1 rounded-full tracking-wide transition ${
                      on
                        ? "bg-achievers-primary text-white shadow-sm"
                        : "bg-achievers-primary/10 text-achievers-primary/50 hover:text-achievers-primary hover:bg-achievers-primary/15"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              </div>
            </div>

            {/* Tier filter */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-achievers-primary/80 mb-2.5">
                Tier (Any)
              </div>
              <div className="flex flex-wrap gap-2">
                {tierOptions.map((t) => {
                  const on = selectedTiers.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      onClick={() => setSelectedTiers(toggle(selectedTiers, t.key))}
                      className={`text-[12px] font-extrabold px-3 py-1 rounded-full tracking-wide transition ${
                        on
                          ? "bg-achievers-primary text-white shadow-sm"
                          : "bg-achievers-primary/10 text-achievers-primary/50 hover:text-achievers-primary hover:bg-achievers-primary/15"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Curriculum filter */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-achievers-primary/80 mb-2.5">
                Curriculum (Any)
              </div>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-auto pr-1">
                {curriculumOptions.map((c) => {
                  const on = selectedCurricula.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCurricula(toggle(selectedCurricula, c))}
                      className={`text-[12px] font-extrabold px-3 py-1 rounded-full tracking-wide transition ${
                        on
                          ? "bg-achievers-secondary text-white shadow-sm"
                          : "bg-achievers-secondary/10 text-achievers-primary/55 hover:text-achievers-primary hover:bg-achievers-secondary/15"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-achievers-primary/55">
                Active filters: {activeFilterCount}
              </div>
              <button
                onClick={() => {
                  setSelectedTiers([]);
                  setSelectedCurricula([]);
                  setSelectedStages([]);
                  setQuery("");
                }}
                className="rounded-xl border border-achievers-primary/15 bg-white px-3 py-2 text-xs font-semibold text-achievers-primary hover:bg-achievers-primary/5"
              >
                Clear all
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border-2 border-achievers-primary/10 bg-white shadow-lg overflow-hidden lg:h-[80vh]">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-achievers-primary/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-achievers-primary/80 uppercase tracking-wide">
                Schools
              </div>
              <div className="text-xs font-medium text-achievers-primary/50 bg-achievers-primary/5 px-2.5 py-1 rounded-full">
                {filtered.length} results
              </div>
            </div>
          </div>

          <div className="h-[calc(80vh-56px)] overflow-y-auto px-6 py-5 space-y-3">
            {filtered.map((s) => (
            <Link
            key={`${s.name}-${s.lat}-${s.lng}`}
            href={schoolHref(s.name)}
            className="block rounded-xl border-2 border-achievers-primary/10 bg-white px-4 py-3.5 hover:border-achievers-primary/20 hover:bg-achievers-primary/3 transition"
            >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-achievers-primary truncate">
                      {s.name}
                    </div>
                    {s.chineseName && (
                      <div className="mt-1 text-xs text-achievers-primary/60">
                        {s.chineseName}
                      </div>
                    )}

                    {s.category && (
                      <div
                        className={`mt-1.5 text-xs font-semibold ${getSchoolNameColor(
                          s.category
                        )}`}
                      >
                        {s.category}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {tierText(s) && (
                      <span className="text-[12px] font-extrabold px-3 py-1 rounded-full border border-achievers-primary/30 text-achievers-primary/80 bg-white">
                        {tierText(s)}
                      </span>
                    )}

                    {stageChips(s).map((c) => (
                      <span
                        key={c.k}
                        className={`text-[12px] font-extrabold px-3 py-1 rounded-full tracking-wider ${
                          c.on
                            ? "bg-achievers-primary text-white shadow-sm"
                            : "bg-achievers-primary/10 text-achievers-primary/35"
                        }`}
                      >
                        {c.k}
                      </span>
                    ))}
                  </div>
                </div>

                {curriculumText(s) && (
                  <div className="mt-2 font-extrabold text-[12px] text-achievers-primary/60 leading-snug">
                    {curriculumText(s)}
                  </div>
                )}

                <div className="mt-2.5 text-xs text-achievers-primary/60 leading-relaxed">
                  📍 {s.address}
                </div>
              </Link>
            ))}

            {!filtered.length && (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">😕</div>
                <div className="text-sm font-medium text-achievers-primary/70 mb-1">
                  No schools match your filters
                </div>
                <div className="text-xs text-achievers-primary/50">
                  Try clearing some filters or changing the search keyword.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
