// Legacy compatibility wrapper.
// The application now uses components/layouts/Layout.jsx as its single active layout.
// Keeping this wrapper prevents old imports of AppLayout from loading a second,
// outdated navigation system.
export { default } from "../layouts/Layout";
