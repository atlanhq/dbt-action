export function truncate(value) {
  if (typeof value === "string")
    return value.length > 100 ? value.substring(0, 100) + "..." : value;
  if (Array.isArray(value))
    return value.length > 10
      ? value.slice(0, 10).join(", ") + "..."
      : value.join(", ");
  return "";
}
