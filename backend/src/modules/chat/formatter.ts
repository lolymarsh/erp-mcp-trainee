export function formatResult(
  data: Record<string, unknown>[],
  format: string,
): string {
  switch (format) {
    case "csv":
      return formatCsv(data);
    case "html":
      return formatHtml(data);
    case "json":
      return JSON.stringify(data, null, 2);
    case "table":
      return formatTextTable(data);
    case "text":
    default:
      return formatText(data);
  }
}

function formatText(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "No results found.";
  }
  const columns = Object.keys(data[0]);
  const header = columns.join(" | ");
  const separator = columns.map(() => "---").join("-|-");
  const rows = data.map((row) =>
    columns.map((col) => String(row[col] ?? "")).join(" | "),
  );
  return [header, separator, ...rows].join("\n");
}

function formatTextTable(data: Record<string, unknown>[]): string {
  return formatText(data);
}

function formatCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "";
  }
  const columns = Object.keys(data[0]);
  const escapeCsv = (val: string): string => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const header = columns.map(escapeCsv).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCsv(String(row[col] ?? ""))).join(","),
  );
  return [header, ...rows].join("\n");
}

function formatHtml(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "<p>No results found.</p>";
  }
  const columns = Object.keys(data[0]);
  const thead = `<thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${data
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${escapeHtml(String(row[col] ?? ""))}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return `<table border="1" cellpadding="4" cellspacing="0">${thead}${tbody}</table>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
