/**
 * Push Notifications API client
 * Handles web push notification subscriptions
 */

import { api } from './api';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    os?: string;
  };
}

/**
 * Get VAPID public key for push notification subscription
 */
export async function getPushPublicKey(): Promise<string> {
  const response = await api.get<{ publicKey: string; enabled?: boolean; message?: string }>('/api/settings/me/push-public-key');
  if (!response.enabled || !response.publicKey) {
    throw new Error(response.message || 'Push notifications are not configured. VAPID keys not set.');
  }
  return response.publicKey;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  subscription: PushSubscriptionData
): Promise<void> {
  return api.post<void>('/api/settings/me/push-subscription', subscription);
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  endpoint: string
): Promise<void> {
  return api.post<void>('/api/settings/me/push-subscription/unsubscribe', { endpoint });
}

/**
 * Request push notification permission and subscribe
 */
export async function requestPushPermissionAndSubscribe(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser');
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Push notification permission denied');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Get VAPID public key
  const publicKey = await getPushPublicKey();

  // Convert VAPID key from base64 URL to Uint8Array
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey,
  });

  // Get subscription data
  const subscriptionData: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!),
    },
    userAgent: navigator.userAgent,
    deviceInfo: {
      platform: navigator.platform,
      browser: getBrowserName(),
      os: getOSName(),
    },
  };

  // Send subscription to backend
  await subscribeToPushNotifications(subscriptionData);

  return subscription;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if push notification permission is granted
 */
export async function checkPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Convert base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

/**
 * Get OS name from user agent
 */
function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

