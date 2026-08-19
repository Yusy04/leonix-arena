/* global React */
// Leonix Arena — shared helpers
const { useState, useMemo, useEffect, useRef, createContext, useContext, useCallback } = React;

// Format helpers
function formatDate(iso, opts) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' });
}
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
function dayKey(iso) {
  return iso.substring(0, 10);
}
function relativeDay(iso) {
  const d = new Date(iso); d.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7 && diff > 0) return formatDate(iso, { weekday: 'long' });
  return formatDate(iso, { month: 'short', day: 'numeric' });
}

// Export to window
Object.assign(window, {
  formatDate, formatTime, formatDay, dayKey, relativeDay,
});
