"use client";

import { useMemo } from "react";
import {
  PHONE_COUNTRIES,
  buildE164,
  formatNationalDigits,
  parsePhoneValue,
  type PhoneCountry,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  id?: string;
};

export function PhoneInput({
  value,
  onChange,
  className,
  inputClassName,
  disabled,
  id,
}: PhoneInputProps) {
  const { country, national } = useMemo(() => parsePhoneValue(value), [value]);

  function updateCountry(next: PhoneCountry) {
    const digits = national.replace(/\D/g, "");
    onChange(digits ? buildE164(next, digits) : "");
  }

  function updateNational(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, country.nationalLength);
    onChange(digits ? buildE164(country, digits) : "");
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        aria-label="Indicatif téléphonique"
        className="h-10 min-w-[7.5rem] rounded-md border border-input bg-background px-2 text-sm"
        value={country.code}
        disabled={disabled}
        onChange={(e) => {
          const next = PHONE_COUNTRIES.find((c) => c.code === e.target.value) ?? country;
          updateCountry(next);
        }}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.dial} {c.label}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        className={cn("flex-1", inputClassName)}
        placeholder={country.example}
        value={formatNationalDigits(national, country)}
        onChange={(e) => updateNational(e.target.value)}
      />
    </div>
  );
}
