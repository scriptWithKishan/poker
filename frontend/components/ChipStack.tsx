import React from 'react';

export function ChipStack() {
  return (
    <div className="chip-stack">
      <div className="chip chip-1"></div>
      <div className="chip chip-2"></div>
      <div className="chip chip-3"></div>
      <div className="chip chip-4"></div>
      <div className="chip chip-5"></div>

      {/* Floating Cards */}
      <div className="floating-card card-1">
        <span>A</span>
        <svg viewBox="0 0 20 20">
          <path d="M10 1L17 10L10 19L3 10L10 1Z" />
        </svg>
      </div>
      <div className="floating-card card-2">
        <span>K</span>
        <svg viewBox="0 0 20 20">
          <path d="M10 3C10 3 6 0 3 3C0 6 3 9 10 17C17 9 20 6 17 3C14 0 10 3 10 3Z" />
        </svg>
      </div>
    </div>
  );
}
