import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

function toDbDate(value: Date | string | number) {
  const date = dayjs.utc(value);

  return date.isValid() ? date : null;
}

export function formatSeoulDate(value: Date | string | number) {
  const date = toDbDate(value);

  if (!date) {
    return "";
  }

  return date.format("YYYY. M. D. (dd)");
}

export function formatSeoulDateTime(value: Date | string | number) {
  const date = toDbDate(value)?.tz("Asia/Seoul");

  if (!date) {
    return "";
  }

  return date.format("YYYY. M. D. (dd) HH:mm:ss");
}
