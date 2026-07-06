"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PickableMapView } from "./PickableMapView";
import {
  DEFAULT_MAP_CENTER,
  formatCoordsLabel,
  reverseGeocode,
  searchPlaces,
  type PlaceResult,
} from "@/lib/geocoding";
import type { LatLng } from "./LeafletMap";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export type { PlaceResult };

type LocationPickerProps = {
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  mapHeightClassName?: string;
  defaultCenter?: LatLng;
};

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function LocationPicker({
  value,
  onChange,
  label,
  required,
  placeholder,
  mapHeightClassName = "h-[280px]",
  defaultCenter = DEFAULT_MAP_CENTER,
}: LocationPickerProps) {
  const { t } = useLang();
  const listId = useId();
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [open, setOpen] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounced(query, 350);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value?.label]);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);

    searchPlaces(debouncedQuery, ctrl.signal)
      .then((items) => {
        setSuggestions(items);
        setDegraded(false);
      })
      .catch(() => {
        setSuggestions([]);
        setDegraded(true);
      })
      .finally(() => setSearching(false));

    return () => ctrl.abort();
  }, [debouncedQuery, open]);

  const pickPlace = useCallback(
    (place: PlaceResult) => {
      onChange(place);
      setQuery(place.label);
      setOpen(false);
      setSuggestions([]);
    },
    [onChange]
  );

  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      setReverseLoading(true);
      try {
        const place = await reverseGeocode(lat, lng);
        pickPlace(place);
      } catch {
        pickPlace({
          label: formatCoordsLabel(lat, lng),
          lat,
          lng,
        });
        setDegraded(true);
      } finally {
        setReverseLoading(false);
      }
    },
    [pickPlace]
  );

  const mapPosition: LatLng | null = value
    ? [value.lat, value.lng]
    : null;

  const mapCenter: LatLng = mapPosition ?? defaultCenter;

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && " *"}
        </Label>
      )}

      {degraded && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t("Autocomplétion indisponible — saisissez le lieu manuellement ou cliquez sur la carte.")}
          </span>
        </div>
      )}

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          placeholder={placeholder ?? t("Rechercher un lieu…")}
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
            if (!v.trim()) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) {
              e.preventDefault();
              pickPlace(suggestions[0]);
            }
          }}
          required={required && !value}
        />
        {(searching || reverseLoading) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && suggestions.length > 0 && (
          <ul
            id={listId}
            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-lg"
          >
            {suggestions.map((s) => (
              <li key={`${s.placeId ?? s.label}-${s.lat}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickPlace(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border",
          mapHeightClassName
        )}
      >
        <PickableMapView
          center={mapCenter}
          zoom={mapPosition ? 14 : 12}
          position={mapPosition}
          onPick={handleMapPick}
          className="h-full w-full"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("Cliquez sur la carte pour affiner l'emplacement.")}
        {value && (
          <span className="ml-1 font-mono text-[10px]">
            ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
          </span>
        )}
      </p>
    </div>
  );
}
