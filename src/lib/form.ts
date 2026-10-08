import { roundMoney } from "@/lib/inventory";

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; message: string };

export function textField(
  formData: FormData,
  key: string,
  opts: { label: string; max: number; required?: boolean },
): Ok<string> | Err {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    if (opts.required === false) return { ok: true, value: "" };
    return { ok: false, message: `Enter ${opts.label}.` };
  }
  if (value.length > opts.max) {
    return {
      ok: false,
      message: `${opts.label} needs to be under ${opts.max} characters.`,
    };
  }
  return { ok: true, value };
}

export function numberField(
  formData: FormData,
  key: string,
  opts: {
    label: string;
    min: number;
    max?: number;
    integer?: boolean;
    money?: boolean;
  },
): Ok<number> | Err {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, message: `Enter ${opts.label}.` };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { ok: false, message: `${opts.label} needs to be a number.` };
  }
  if (opts.integer && !Number.isInteger(value)) {
    return {
      ok: false,
      message: `${opts.label} needs to be a whole number, like 1 or 12.`,
    };
  }
  if (value < opts.min) {
    if (opts.min === 0) {
      return { ok: false, message: `${opts.label} can't be negative.` };
    }
    if (opts.min === 1) {
      return { ok: false, message: `${opts.label} must be at least 1.` };
    }
    return { ok: false, message: `${opts.label} must be at least ${opts.min}.` };
  }
  if (opts.max !== undefined && value > opts.max) {
    return {
      ok: false,
      message: `${opts.label} looks too large. Check the number and try again.`,
    };
  }
  return { ok: true, value: opts.money ? roundMoney(value) : value };
}

export function skuField(formData: FormData): Ok<string> | Err {
  const parsed = textField(formData, "sku", { label: "a SKU", max: 40 });
  if (!parsed.ok) return parsed;
  const sku = parsed.value.toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{0,39}$/.test(sku)) {
    return {
      ok: false,
      message: "Use letters, numbers, dots, or dashes for the SKU. For example HNY-001.",
    };
  }
  return { ok: true, value: sku };
}
