import React from "react";

/**
 * Card container putih dengan shadow ringan
 */
export default function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm ${className}`}
      style={{ padding: 20, ...style }}
    >
      {children}
    </div>
  );
}
