import React from "react";

/**
 * Badge status reusable
 * @param {string} status - key status
 * @param {object} map    - STATUS_BOOKING atau STATUS_CAR
 */
export default function Badge({ status, map }) {
  const c = map[status] || { bg: "#f3f4f6", text: "#374151", label: status };
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {c.label}
    </span>
  );
}
