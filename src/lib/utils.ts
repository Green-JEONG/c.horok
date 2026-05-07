import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SEOUL_TIME_ZONE = "Asia/Seoul";

const seoulDateFormatter = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const seoulDateTimeFormatter = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getFormatterParts(
  formatter: Intl.DateTimeFormat,
  value: Date | string | number,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatter
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }

      return acc;
    }, {});
}

export function formatSeoulDate(value: Date | string | number) {
  const parts = getFormatterParts(seoulDateFormatter, value);

  if (!parts) {
    return "";
  }

  return `${parts.year}. ${parts.month}. ${parts.day}.`;
}

export function formatSeoulDateTime(value: Date | string | number) {
  const parts = getFormatterParts(seoulDateTimeFormatter, value);

  if (!parts) {
    return "";
  }

  const hour24 = Number(parts.hour);
  const period = hour24 < 12 ? "오전" : "오후";
  const hour12 = hour24 % 12 || 12;

  return `${parts.year}. ${parts.month}. ${parts.day}. ${period} ${hour12}:${parts.minute}:${parts.second}`;
}
