"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { School } from "@/components/SchoolMap";

export default function HomeClient({
  schools,
  onPickSchool,
}: {
  schools: School[];
  onPickSchool: (s: School) => void;
}) {
  const searchParams = useSearchParams();
  const schoolParam = searchParams.get("school");

  useEffect(() => {
    if (!schoolParam) return;

    const decoded = decodeURIComponent(schoolParam);

    const found =
      schools.find((s) => s.name === decoded) ||
      schools.find((s) => s.name.toLowerCase() === decoded.toLowerCase());

    if (found) onPickSchool(found);
  }, [schoolParam, schools, onPickSchool]);

  return null;
}
