import { prisma } from "@plinkk/prisma";
import { FastifyRequest } from "fastify";

export type PublicMetrics = {
  userCount: number;
  linkCount: number;
  totalViews: number;
};

const METRICS_TTL_MS = 60_000;
const METRICS_QUERY_TIMEOUT_MS = 2_000;
let publicMetricsCache: { value: PublicMetrics; expiresAt: number } | null = null;
let publicMetricsRefreshPromise: Promise<PublicMetrics> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function getPublicMetrics(request: FastifyRequest | any): Promise<PublicMetrics> {
  const now = Date.now();
  if (publicMetricsCache && publicMetricsCache.expiresAt > now) {
    return publicMetricsCache.value;
  }

  if (publicMetricsRefreshPromise) {
    return publicMetricsRefreshPromise;
  }

  const fallback: PublicMetrics = publicMetricsCache?.value ?? {
    userCount: 0,
    linkCount: 0,
    totalViews: 0,
  };

  publicMetricsRefreshPromise = (async () => {
    const [usersRes, linksRes, viewsRes] = await Promise.allSettled([
      withTimeout(prisma.user.count(), METRICS_QUERY_TIMEOUT_MS, "user_count"),
      withTimeout(prisma.link.count(), METRICS_QUERY_TIMEOUT_MS, "link_count"),
      withTimeout(
        prisma.plinkk.aggregate({
          _sum: { views: true },
        }),
        METRICS_QUERY_TIMEOUT_MS,
        "plinkk_views_sum"
      ),
    ]);

    if (usersRes.status === "rejected") {
      request.log.warn({ err: usersRes.reason }, "public metrics: user.count failed");
    }
    if (linksRes.status === "rejected") {
      request.log.warn({ err: linksRes.reason }, "public metrics: link.count failed");
    }
    if (viewsRes.status === "rejected") {
      request.log.warn({ err: viewsRes.reason }, "public metrics: plinkk.aggregate failed");
    }

    const next: PublicMetrics = {
      userCount: usersRes.status === "fulfilled" ? usersRes.value : fallback.userCount,
      linkCount: linksRes.status === "fulfilled" ? linksRes.value : fallback.linkCount,
      totalViews:
        viewsRes.status === "fulfilled"
          ? viewsRes.value._sum.views || 0
          : fallback.totalViews,
    };

    publicMetricsCache = {
      value: next,
      expiresAt: Date.now() + METRICS_TTL_MS,
    };

    return next;
  })()
    .catch((err) => {
      request.log.warn({ err }, "public metrics: fallback used after refresh failure");
      return fallback;
    })
    .finally(() => {
      publicMetricsRefreshPromise = null;
    });

  return publicMetricsRefreshPromise;
}
