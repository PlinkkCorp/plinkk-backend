import Stripe from "stripe";
import { prisma } from "@plinkk/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY manquante — les paiements seront désactivés.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// Produits disponibles à l'achat
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS = {
  premium_subscription: {
    name: "Plinkk Premium (Mensuel)",
    description: "Accédez à toutes les fonctionnalités Premium.",
    unitAmount: 499, // 4.99€
    type: "subscription" as const,
  },
  extra_plinkk: {
    name: "+1 Page Plinkk supplémentaire",
    description: "Ajoutez une page Plinkk supplémentaire à votre compte.",
    unitAmount: 100, // 1€ en centimes
    type: "subscription_addon" as const,
  },
  extra_redirects: {
    name: "+5 Redirections supplémentaires",
    description: "Ajoutez 5 redirections supplémentaires à votre compte.",
    unitAmount: 100, // 1€ en centimes
    type: "subscription_addon" as const,
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// ─────────────────────────────────────────────────────────────────────────────
// Récupérer ou créer un client Stripe
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  if (!stripe) throw new Error("Stripe non configuré");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, userName: true },
  });

  if (!user) throw new Error("Utilisateur introuvable");

  // Si l'utilisateur a déjà un customerId Stripe
  if (user.stripeCustomerId) return user.stripeCustomerId;

  // Créer un nouveau client Stripe
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.userName,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gestion centralisée de l'abonnement (Création / Mise à jour)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configure l'abonnement de l'utilisateur pour correspondre exactement à l'état demandé.
 * Si l'utilisateur n'a pas d'abonnement, une session Checkout est créée.
 * Si l'utilisateur a un abonnement, il est mis à jour (prorata automatique).
 */
export async function syncSubscription(
  userId: string,
  config: { premium: boolean; extraPlinkks: number; extraRedirects: number },
  dashboardUrl: string
): Promise<{ url?: string; updated?: boolean; message?: string }> {
  if (!stripe) throw new Error("Stripe non configuré");

  const customerId = await getOrCreateStripeCustomer(userId);

  // 1. Chercher un abonnement actif
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  
  let sub: any = subs.data[0];
  
  // Si on a un abonnement, on le recharge avec l'expansion nécessaire (limite de prof 4 de list dépassée sinon)
  if (sub) {
      sub = await stripe.subscriptions.retrieve(sub.id, {
          expand: ["items.data.price.product"]
      });
  }

  // Définition des produits (Metadonnées pour identification fiable)
  const PREMIUM_PRICE_DATA = {
    currency: "eur",
    product_data: { name: PRODUCTS.premium_subscription.name, metadata: { type: "premium_subscription" } },
    unit_amount: PRODUCTS.premium_subscription.unitAmount,
    recurring: { interval: "month" as const },
  };

  const PLINKK_PRICE_DATA = {
    currency: "eur",
    product_data: { name: PRODUCTS.extra_plinkk.name, metadata: { type: "extra_plinkk" } },
    unit_amount: PRODUCTS.extra_plinkk.unitAmount,
    recurring: { interval: "month" as const },
  };

  const REDIRECT_PRICE_DATA = {
    currency: "eur",
    product_data: { name: PRODUCTS.extra_redirects.name, metadata: { type: "extra_redirects" } },
    unit_amount: PRODUCTS.extra_redirects.unitAmount,
    recurring: { interval: "month" as const },
  };

  // CAS 1 : Pas d'abonnement actif -> On crée une session Checkout
  if (!sub) {
    // Si la config est vide (Free tier), rien à faire (ou message d'info)
    if (!config.premium && config.extraPlinkks === 0 && config.extraRedirects === 0) {
       return { message: "Aucun abonnement nécessaire pour le plan gratuit." };
    }

    const lineItems = [];
    if (config.premium) {
      lineItems.push({ price_data: PREMIUM_PRICE_DATA, quantity: 1 });
    }
    if (config.extraPlinkks > 0) {
      lineItems.push({ price_data: PLINKK_PRICE_DATA, quantity: config.extraPlinkks });
    }
    if (config.extraRedirects > 0) {
      lineItems.push({ price_data: REDIRECT_PRICE_DATA, quantity: config.extraRedirects });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: lineItems,
      metadata: { userId, type: "subscription_sync" },
      success_url: `${dashboardUrl}/premium?payment=success`,
      cancel_url: `${dashboardUrl}/premium?payment=cancel`,
    });

    return { url: session.url as string };
  }

  // CAS 2 : Abonnement existant -> Mise à jour (Update)
  const itemsToUpdate: any[] = [];
  
  // Helper pour trouver l'item existant via metadata du produit
  const findItem = (type: string) => 
    sub.items.data.find((item: any) => item.price.product.metadata.type === type || 
    // Fallback name matching si metadata manquante (anciens subs)
    item.price.product.name === PRODUCTS[type as ProductType]?.name);

  // Gestion Premium
  const premiumItem = findItem("premium_subscription");
  if (config.premium && !premiumItem) {
    itemsToUpdate.push({ price_data: PREMIUM_PRICE_DATA, quantity: 1 });
  } else if (!config.premium && premiumItem) {
    itemsToUpdate.push({ id: premiumItem.id, deleted: true });
  }

  // Gestion Extra Plinkks
  const plinkkItem = findItem("extra_plinkk");
  if (config.extraPlinkks > 0) {
    if (plinkkItem) itemsToUpdate.push({ id: plinkkItem.id, quantity: config.extraPlinkks });
    else itemsToUpdate.push({ price_data: PLINKK_PRICE_DATA, quantity: config.extraPlinkks });
  } else if (plinkkItem) {
    itemsToUpdate.push({ id: plinkkItem.id, deleted: true });
  }

  // Gestion Extra Redirects
  const redirectItem = findItem("extra_redirects");
  if (config.extraRedirects > 0) {
    if (redirectItem) itemsToUpdate.push({ id: redirectItem.id, quantity: config.extraRedirects });
    else itemsToUpdate.push({ price_data: REDIRECT_PRICE_DATA, quantity: config.extraRedirects });
  } else if (redirectItem) {
    itemsToUpdate.push({ id: redirectItem.id, deleted: true });
  }

  // Si tout est à 0 (retour au gratuit) -> On annule l'abonnement à la fin de la période
  // Ou on le supprime immediatement ? Préférable de supprimer items ou cancel sub.
  const isEmptySub = !config.premium && config.extraPlinkks === 0 && config.extraRedirects === 0;
  if (isEmptySub) {
    await stripe.subscriptions.cancel(sub.id);
    // On doit aussi mettre à jour la DB localement pour dire "pu de premium" quand le webhook arrivera
    return { updated: true, message: "Abonnement annulé. Retour au plan gratuit." };
  }

  if (itemsToUpdate.length > 0) {
    await stripe.subscriptions.update(sub.id, {
      items: itemsToUpdate,
      proration_behavior: "create_prorations", // Facture/Crédit immédiat
    });
  }

  return { updated: true, message: "Abonnement mis à jour avec succès." };
}

// ─────────────────────────────────────────────────────────────────────────────
// Créer une session de paiement Stripe Checkout (Legacy / Single use)
// ─────────────────────────────────────────────────────────────────────────────
export async function createCheckoutSession(
  userId: string,
  productType: ProductType,
  quantity: number = 1,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error("Stripe non configuré");

  const product = PRODUCTS[productType];
  if (!product) throw new Error("Produit inconnu");

  const customerId = await getOrCreateStripeCustomer(userId);
  
  // Both proper subscription and addons use "subscription" mode now
  const mode = (product.type === "subscription" || product.type === "subscription_addon") ? "subscription" : "payment";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: mode,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.unitAmount,
          recurring: (product.type === "subscription" || product.type === "subscription_addon") ? { interval: "month" } : undefined,
        },
        quantity: quantity,
      },
    ],
    metadata: {
      userId,
      productType,
      quantity: quantity.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// ─────────────────────────────────────────────────────────────────────────────
// Traiter un paiement réussi (appelé par le webhook)
// ─────────────────────────────────────────────────────────────────────────────

export async function handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const productType = session.metadata?.productType as ProductType | undefined;

  if (!userId || !productType) {
    console.error("[Stripe] Metadata manquante dans la session:", session.id);
    return;
  }

  const product = PRODUCTS[productType];
  if (!product) {
    console.error("[Stripe] Type de produit inconnu:", productType);
    return;
  }

  // Vérifier qu'on n'a pas déjà traité cette session
  const existing = await prisma.purchase.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) {
    console.log("[Stripe] Session déjà traitée:", session.id);
    return;
  }

  const quantity = parseInt(session.metadata?.quantity || "1", 10);

  // Enregistrer l'achat (historique)
  // Pour les abonnements, on enregistre aussi la première 'purchase'
  await prisma.purchase.create({
    data: {
      userId,
      type: productType,
      amount: product.unitAmount * quantity,
      quantity: quantity,
      stripeSessionId: session.id,
      stripePaymentId: (typeof session.payment_intent === 'string') 
        ? session.payment_intent 
        : (typeof session.subscription === 'string' ? session.subscription : undefined),
    },
  });

  // Mettre à jour les limites de l'utilisateur
  if (productType === "extra_plinkk") {
    await prisma.user.update({
      where: { id: userId },
      data: { extraPlinkks: { increment: quantity } },
    });
    console.log(`[Stripe] +${quantity} plinkk(s) pour l'utilisateur ${userId}`);
  } else if (productType === "extra_redirects") {
    await prisma.user.update({
      where: { id: userId },
      data: { extraRedirects: { increment: 5 * quantity } },
    });
    console.log(`[Stripe] +${5 * quantity} redirections pour l'utilisateur ${userId}`);
  } else if (productType === "premium_subscription") {
    // Activer le premium
    // Note: Pour une gestion robuste, écouter aussi 'customer.subscription.updated' / 'deleted'
    // Ici on donne 32 jours de premium suite au paiement réussi
    const now = new Date();
    const premiumUntil = new Date(now.setDate(now.getDate() + 32));

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: premiumUntil,
        premiumSource: 'STRIPE', // Mark as Stripe-managed subscription
      },
    });
    console.log(`[Stripe] Premium activé pour l'utilisateur ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Récupérer l'historique des achats d'un utilisateur
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
