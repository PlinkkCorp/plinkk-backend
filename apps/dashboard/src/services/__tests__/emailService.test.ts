/**
 * Script de test pour le service d'email
 * 
 * Usage:
 *   bun apps/dashboard/src/services/__tests__/emailService.test.ts
 * 
 * Ou:
 *   bun src/services/__tests__/emailService.test.ts
 */

import { EmailService } from "../emailService";
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function testEmailService() {
  console.log("=== Test du Service d'Email ===\n");

  // Vérifier la configuration
  if (!EmailService.isConfigured()) {
    console.error("❌ Service d'email non configuré");
    console.error("   Ajoutez RESEND_API_KEY dans votre fichier .env");
    console.error("   Obtenez une clé API sur https://resend.com");
    process.exit(1);
  }

  console.log("✅ Service d'email configuré\n");

  // Email de test (remplacez par votre email pour tester)
  const testEmail = process.env.TEST_EMAIL || "delivered@resend.dev";
  const testUsername = "TestUser";

  console.log(`📧 Envoi d'un email de test à : ${testEmail}\n`);

  try {
    // Test 1: Email de bienvenue
    console.log("1️⃣  Test: Email de bienvenue...");
    const welcome = await EmailService.sendWelcomeEmail(testEmail, testUsername);
    if (welcome) {
      console.log("   ✅ Email de bienvenue envoyé\n");
    } else {
      console.log("   ❌ Échec de l'envoi\n");
    }

    // Test 2: Email de confirmation de changement d'email
    console.log("2️⃣  Test: Confirmation de changement d'email...");
    const emailChange = await EmailService.sendEmailChangeConfirmation(
      testEmail,
      testUsername
    );
    if (emailChange) {
      console.log("   ✅ Email de confirmation envoyé\n");
    } else {
      console.log("   ❌ Échec de l'envoi\n");
    }

    // Test 3: Email de réinitialisation de mot de passe
    console.log("3️⃣  Test: Réinitialisation de mot de passe...");
    const testToken = "test_token_123456789";
    const passwordReset = await EmailService.sendPasswordResetEmail(
      testEmail,
      testUsername,
      testToken
    );
    if (passwordReset) {
      console.log("   ✅ Email de réinitialisation envoyé\n");
    } else {
      console.log("   ❌ Échec de l'envoi\n");
    }

    // Test 4: Email de vérification
    console.log("4️⃣  Test: Vérification d'email...");
    const verificationToken = "verification_token_123456789";
    const verification = await EmailService.sendEmailVerification(
      testEmail,
      testUsername,
      verificationToken
    );
    if (verification) {
      console.log("   ✅ Email de vérification envoyé\n");
    } else {
      console.log("   ❌ Échec de l'envoi\n");
    }

    // Test 5: Email générique
    console.log("5️⃣  Test: Email générique...");
    const generic = await EmailService.sendGenericEmail(
      testEmail,
      "Test d'email générique",
      "Nouvelle fonctionnalité",
      "Ceci est un email de test pour vérifier le système d'envoi.",
      "https://plinkk.fr",
      "Visiter Plinkk"
    );
    if (generic) {
      console.log("   ✅ Email générique envoyé\n");
    } else {
      console.log("   ❌ Échec de l'envoi\n");
    }

    console.log("=== Tests terminés ===");
    console.log("\n💡 Conseil: Vérifiez votre boîte mail (y compris les spams)");
    console.log("💡 Dashboard Resend: https://resend.com/emails");

  } catch (error) {
    console.error("\n❌ Erreur lors des tests:", error);
    process.exit(1);
  }
}

// Exécuter les tests
testEmailService();
