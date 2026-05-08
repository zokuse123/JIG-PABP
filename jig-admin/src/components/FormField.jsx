import React from "react";

const inputStyle = {
  width: "100%",
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  outline: "none",
  background: "#fafafa",
  fontFamily: "inherit",
  transition: "border-color .15s",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
  display: "block",
};

/**
 * Komponen form field reusable: input, select, textarea
 */
export default function FormField({ label, type = "text", value, onChange, options, placeholder, required }) {
  const handleFocus = (e) => (e.target.style.borderColor = "#16a34a");
  const handleBlur  = (e) => (e.target.style.borderColor = "#e2e8f0");

  return (
    <div>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
      {type === "select" ? (
        <select
          style={inputStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {options.map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <input
          type={type}
          style={inputStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
}
