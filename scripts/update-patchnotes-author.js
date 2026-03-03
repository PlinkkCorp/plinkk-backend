#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/dashboard/.env') });
const { PrismaClient } = require('../packages/prisma/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateAuthors() {
  try {
    console.log("🔍 Recherche ou création de l'auteur 'Plinkk Team'...");

    // Chercher un utilisateur existant ou en créer un nouveau
    let plinkkTeam = await prisma.user.findFirst({
      where: { userName: "plinkk-team" },
    });

    if (!plinkkTeam) {
      console.log("⚠️  Utilisateur 'Plinkk Team' non trouvé. Création...");
      
      // Trouver un rôle admin
      const adminRole = await prisma.role.findFirst({
        where: { name: "ADMIN" },
      });

      // Générer un ID simple (16 caractères alphanumériques)
      const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 16; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      };

      plinkkTeam = await prisma.user.create({
        data: {
          id: generateId(),
          userName: "plinkk-team",
          email: "team@plinkk.fr",
          password: "$2b$10$dummy.hash.value.for.system.account",
          name: "Plinkk Team",
          image: "https://cdn.plinkk.fr/logo.svg",
          hasPassword: false,
          emailVerified: true,
          roleId: adminRole?.id,
        },
      });

      console.log(`✓ Utilisateur 'Plinkk Team' créé avec l'ID: ${plinkkTeam.id}`);
    } else {
      console.log(`✓ Utilisateur 'Plinkk Team' trouvé: ${plinkkTeam.id}`);
    }

    // Mettre à jour toutes les patch notes
    console.log("📝 Mise à jour des patch notes...");
    
    const result = await prisma.patchNote.updateMany({
      data: {
        createdById: plinkkTeam.id,
      },
    });

    console.log(`✅ ${result.count} patch note(s) mise(s) à jour avec le nouvel auteur !`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateAuthors();
