import { Input, type InputProps } from "@/components/ui/input";
import { filterDecimalInput, filterIntegerInput } from "@/lib/numeric-input";

type NumericInputProps = Omit<InputProps, "type" | "value" | "onChange" | "inputMode"> & {
  value: string;
  onValueChange: (value: string) => void;
  mode: "decimal" | "integer";
};

export function NumericInput({
  value,
  onValueChange,
  mode,
  ...props
}: NumericInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode={mode === "integer" ? "numeric" : "decimal"}
      autoComplete="off"
      value={value}
      onChange={(e) => {
        const next =
          mode === "integer"
            ? filterIntegerInput(e.target.value)
            : filterDecimalInput(e.target.value);
        onValueChange(next);
      }}
    />
  );
}
