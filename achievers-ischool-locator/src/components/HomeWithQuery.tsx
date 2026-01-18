"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { School } from "@/components/SchoolMap";

export default function HomeWithQuery({
  schools,
  onSelectSchool,
}: {
  schools: School[];
  onSelectSchool: (s: School) => void;
}) {
  const searchParams = useSearchParams();
  const schoolParam = searchParams.get("school");

  useEffect(() => {
    if (!schoolParam) return;

    const decoded = decodeURIComponent(schoolParam);

    const found =
      schools.find((s) => s.name === decoded) ||
      schools.find((s) => s.name.toLowerCase() === decoded.toLowerCase());

    if (found) {
      onSelectSchool(found);
    }
  }, [schoolParam, schools, onSelectSchool]);

  return null; // no UI
}
