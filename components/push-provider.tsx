"use client";

import { useEffect } from "react";
import type { PushDebugStatus } from "@/lib/types";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

declare global {
  interface Window {
    __pushDebug?: PushDebugStatus;
  }
}

export function PushProvider() {
  useEffect(() => {
    async function register() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        window.__pushDebug = {
          supported: false,
          permission: "unsupported",
          serviceWorkerRegistered: false,
          subscriptionExists: false,
        };
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        window.__pushDebug = {
          supported: true,
          permission: Notification.permission,
          serviceWorkerRegistered: false,
          subscriptionExists: false,
          error: "NEXT_PUBLIC_VAPID_PUBLIC_KEY 누락",
        };
        return;
      }

      try {
        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

        if (permission !== "granted") {
          window.__pushDebug = {
            supported: true,
            permission,
            serviceWorkerRegistered: false,
            subscriptionExists: false,
          };
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });

        const result = await response.json();
        window.__pushDebug = {
          supported: true,
          permission,
          serviceWorkerRegistered: true,
          subscriptionExists: true,
          endpoint: subscription.endpoint,
          lastSaved: result.latestUpdatedAt ?? undefined,
          savedCount: result.savedCount ?? undefined,
        };
      } catch (error) {
        window.__pushDebug = {
          supported: true,
          permission: Notification.permission,
          serviceWorkerRegistered: false,
          subscriptionExists: false,
          error: error instanceof Error ? error.message : "구독 등록 실패",
        };
      }
    }

    void register();
  }, []);

  return null;
}
