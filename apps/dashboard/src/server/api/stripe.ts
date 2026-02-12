import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "@plinkk/prisma";
import {
  stripe,
  createCheckoutSession,
  syncSubscription, // Nouvelle fonction importée
  handleSuccessfulPayment,
  getUserPurchases,
  getOrCreateStripeCustomer,
  PRODUCTS,
  ProductType,
} from "../../services/stripeService";

export function apiStripeRoutes(fastify: FastifyInstance) {
  // ─── Liste des produits disponibles ───────────────────────────────────────
  fastify.get("/products", async (_request, reply) => {
    return reply.send({
      products: Object.entries(PRODUCTS).map(([key, p]) => ({
        id: key,
        name: p.name,
        description: p.description,
        price: p.unitAmount / 100,
        currency: "EUR",
      })),
    });
  });

  // ─── Mise à jour / Création de plan (Unified Subscription) ───────────────
  fastify.post("/update-plan", { preHandler: requireAuth }, async (request, reply) => {
    if (!stripe) return reply.code(503).send({ error: "Paiements non disponibles" });

    const userId = request.userId!;
    const body = request.body as { 
      premium?: boolean; 
      extraPlinkks?: number; 
      extraRedirects?: number;
      plan?: 'monthly' | 'yearly' | 'lifetime';
    };

    const dashboardUrl = process.env.DASHBOARD_URL || "http://127.0.0.1:3001";

    try {
      const result = await syncSubscription(
        userId,
        {
          premium: body.premium || false,
          extraPlinkks: Math.max(0, body.extraPlinkks || 0),
          extraRedirects: Math.max(0, body.extraRedirects || 0),
          plan: body.plan,
        },
        dashboardUrl
      );
      
      return reply.send(result);
    } catch (e: any) {
      request.log?.error(e, "Plan update failed");
      return reply.code(500).send({ error: e.message || "Erreur de mise à jour du plan" });
    }
  });

  // ─── Résiliation abonnement ───────────────────────────────────────────────
  fastify.post("/cancel-subscription", { preHandler: requireAuth }, async (request, reply) => {
    if (!stripe) return reply.code(503).send({ error: "Paiements non disponibles" });

    const userId = request.userId!;

    // Prevent cancellation during impersonation
    const impersonatedUserId = request.session.get('impersonatedUserId');
    if (impersonatedUserId) {
      return reply.code(403).send({
        error: "Impossible d'annuler un abonnement en mode impersonation.",
        details: "Pour des raisons de sécurité, veuillez quitter le mode impersonation avant de gérer les abonnements."
      });
    }

    try {
      const customerId = await getOrCreateStripeCustomer(userId);
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      const sub = subs.data[0];

      if (!sub) {
        return reply.send({ updated: true, message: "Aucun abonnement actif à résilier." });
      }

      if (sub.cancel_at_period_end) {
        return reply.send({ updated: true, message: "La résiliation est déjà programmée." });
      }

      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      return reply.send({ updated: true, message: "Résiliation programmée à la fin de la période." });
    } catch (e: any) {
      request.log?.error(e, "Subscription cancel failed");
      return reply.code(500).send({ error: e.message || "Erreur lors de la résiliation" });
    }
  });

  // ─── (Legacy) Créer une session de paiement simple ───────────────────────
  fastify.post("/checkout", { preHandler: requireAuth }, async (request, reply) => {
    // Legacy endpoint, redirige vers update-plan idéalement, mais gardé pour compatibilité si besoin.
    // Pour ce use case, on réimplémente une logique simplifiée ou on débranche.
    return reply.code(400).send({ error: "Utilisez la nouvelle interface d'abonnement." });
  });

  // ─── Historique des achats ────────────────────────────────────────────────
  fastify.get("/purchases", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const purchases = await getUserPurchases(userId);

    return reply.send({
      purchases: purchases.map((p) => ({
        id: p.id,
        type: p.type,
        amount: p.amount / 100,
        currency: "EUR",
        createdAt: p.createdAt,
      })),
    });
  });

  // ─── Webhook Stripe ──────────────────────────────────────────────────────
  // Note: Ce endpoint doit recevoir le body brut pour vérifier la signature
  fastify.post("/webhook", {
    config: {
      rawBody: true,
      rateLimit: false,
    },
  }, async (request, reply) => {
    if (!stripe) {
      return reply.code(503).send({ error: "Stripe non configuré" });
    }

    const sig = request.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Si pas de webhook secret configuré, traiter directement (dev mode)
    if (!webhookSecret) {
      request.log?.warn("[Stripe] STRIPE_WEBHOOK_SECRET non configuré — vérification de signature ignorée");
      const event = request.body as Stripe.Event;

      if (event?.type === "checkout.session.completed") {
        try {
          await handleSuccessfulPayment(event.data.object as Stripe.Checkout.Session);
        } catch (e) {
          request.log?.error(e, "handleSuccessfulPayment failed");
        }
      }
      return reply.send({ received: true });
    }

    // En production, vérifier la signature
    if (!sig) {
      return reply.code(400).send({ error: "Signature Stripe manquante" });
    }

    let event: Stripe.Event;
    try {
      const rawBody = request.rawBody || JSON.stringify(request.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (e: any) {
      request.log?.error(e, "Stripe webhook signature verification failed");
      return reply.code(400).send({ error: "Signature invalide" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        try {
          await handleSuccessfulPayment(session);
        } catch (e) {
          request.log?.error(e, "handleSuccessfulPayment failed");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = (typeof subscription.customer === 'string')
          ? subscription.customer
          : subscription.customer.id;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true, premiumSource: true }
        });

        // Only revoke premium if it was managed by Stripe
        if (user && user.premiumSource === 'STRIPE') {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isPremium: false,
              premiumSource: null,
              premiumUntil: null,
            }
          });
          request.log?.info(`[Stripe] Premium revoked for user ${user.id}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end: number };
        const customerId = (typeof subscription.customer === 'string')
          ? subscription.customer
          : subscription.customer.id;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId }
        });

        if (user && subscription.status === 'active') {
          // current_period_end is a Unix timestamp in seconds
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isPremium: true,
              premiumSource: 'STRIPE',
              premiumUntil: currentPeriodEnd,
            }
          });
          request.log?.info(`[Stripe] Premium updated for user ${user.id}, expires: ${currentPeriodEnd}`);
        }
        break;
      }

      default:
        request.log?.info(`[Stripe] Événement non géré: ${event.type}`);
    }

    return reply.send({ received: true });
  });
}
