'use client';

/**
 * OneSignal init, called once from the dashboard layout. No-ops if
 * NEXT_PUBLIC_ONESIGNAL_APP_ID isn't set, so the app runs fine without
 * push configured. Replaces firebase-messaging-sw.js / pwa.js's manual
 * script-tag wiring — actual OneSignal Web SDK script tag should be
 * added to app/(dashboard)/layout.tsx via next/script once the real
 * App ID is available; left as a stub here pending that config value.
 */
export function initPush() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || typeof window === 'undefined') return;
  // Intentionally left as a stub — wire up the OneSignal Web SDK here
  // once the real App ID + service worker registration path are
  // confirmed against the existing OneSignal account.
}
