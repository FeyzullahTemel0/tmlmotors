"use client";

import { CircleCheck } from "lucide-react";
import { featureCatalog, featureGroupKeys } from "@/lib/vehicle-features";
import type { VehicleFeatureNotes, VehicleFeatures, FeatureGroupKey } from "@/lib/vehicle-types";
import { usePreferences } from "@/lib/i18n/preferences-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const groupKeys: Record<FeatureGroupKey, TranslationKey> = {
  security: "featSecurity", interior: "featInterior", exterior: "featExterior", multimedia: "featMultimedia",
};

export function VehicleFeatureList({ features, notes }: { features?: VehicleFeatures; notes?: VehicleFeatureNotes }) {
  const { t } = usePreferences();
  const groups = featureGroupKeys.filter(
    (key) => (features?.[key]?.length ?? 0) > 0 || Boolean(notes?.[key]?.trim()),
  );
  if (!groups.length) return null;

  return (
    <div className="vd-features">
      {groups.map((key) => {
        const selected = new Set(features?.[key] ?? []);
        const custom = [...selected].filter((option) => !featureCatalog[key].includes(option));
        const options = [...featureCatalog[key], ...custom];
        return (
          <section className="vd-feature-group" key={key}>
            <h3>{t(groupKeys[key])}</h3>
            <ul>
              {options.map((option) => (
                <li key={option} className={selected.has(option) ? "is-on" : "is-off"}>
                  <CircleCheck size={14} />
                  {option}
                </li>
              ))}
            </ul>
            {notes?.[key] ? <p className="vd-feature-note">{notes[key]}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
