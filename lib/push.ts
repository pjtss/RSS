import webpush from "web-push";
import { getPool } from "./db";
import type { AlertItem, PushSubscriptionRecord } from "./types";

let configured = false;

function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID 환경변수가 설정되지 않았습니다.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function savePushSubscription(subscription: PushSubscriptionRecord) {
  const client = await getPool().connect();

  try {
    await client.query(
      `
        INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (endpoint) DO UPDATE SET
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          user_agent = EXCLUDED.user_agent,
          updated_at = NOW()
      `,
      [subscription.endpoint, subscription.p256dh, subscription.auth, subscription.userAgent ?? null],
    );
  } finally {
    client.release();
  }
}

export async function removePushSubscription(endpoint: string) {
  const client = await getPool().connect();

  try {
    await client.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
  } finally {
    client.release();
  }
}

export async function loadPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const client = await getPool().connect();

  try {
    const { rows } = await client.query(
      "SELECT endpoint, p256dh, auth, user_agent FROM push_subscriptions ORDER BY updated_at DESC",
    );

    return rows.map((row) => ({
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      userAgent: row.user_agent ?? undefined,
    }));
  } finally {
    client.release();
  }
}

export async function sendPushAlerts(alerts: AlertItem[]) {
  if (alerts.length === 0) {
    return;
  }

  configureWebPush();
  const subscriptions = await loadPushSubscriptions();

  for (const alert of alerts) {
    const payload = JSON.stringify({
      title: `[${alert.level}] ${alert.company}`,
      body: alert.title,
      url: alert.link,
      tag: `${alert.source}:${alert.externalId}`,
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription(subscription.endpoint);
        }
      }
    }
  }
}
