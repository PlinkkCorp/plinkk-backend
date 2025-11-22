export interface PermissionDefinition {
  key: string;
  category: string;
  description?: string;
  defaultRoles?: string[]; // noms de rôles auxquels attribuer par défaut
}

// Catégories: Administration, Modération, Utilisateur, Contenu, Sécurité, Statistiques
export const PERMISSIONS: PermissionDefinition[] = [
  // Administration générale
  { key: 'VIEW_ADMIN', category: 'Administration', description: 'Accéder à l’interface administrative', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },
  { key: 'MANAGE_ROLES', category: 'Administration', description: 'Créer / modifier / supprimer des rôles', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'ASSIGN_ROLE', category: 'Administration', description: 'Attribuer un rôle à un utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
  { key: 'MANAGE_ANNOUNCEMENTS', category: 'Administration', description: 'Gérer les annonces / messages globaux', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },
  { key: 'VIEW_SYSTEM_LOGS', category: 'Administration', description: 'Consulter les journaux système', defaultRoles: ['ADMIN','DEVELOPER'] },

  // Modération
  { key: 'MANAGE_USERS', category: 'Modération', description: 'Modifier des utilisateurs (email public, reset 2FA, etc.)', defaultRoles: ['ADMIN','MODERATOR','DEVELOPER'] },
  { key: 'BAN_USER', category: 'Modération', description: 'Bannir un utilisateur', defaultRoles: ['ADMIN','MODERATOR'] },
  { key: 'UNBAN_USER', category: 'Modération', description: 'Révoquer un bannissement', defaultRoles: ['ADMIN','MODERATOR'] },
  { key: 'MANAGE_BANNED_SLUGS', category: 'Modération', description: 'Gérer les slugs interdits', defaultRoles: ['ADMIN','MODERATOR','DEVELOPER'] },

  // Utilisateur (gestion de ses propres ressources étendues)
  { key: 'EXTENDED_PLINKK_LIMIT', category: 'Utilisateur', description: 'Accès à un nombre de Plinkk supérieur au standard', defaultRoles: ['PARTNER','DEVELOPER','ADMIN'] },
  { key: 'EXTENDED_THEME_LIMIT', category: 'Utilisateur', description: 'Peut créer davantage de thèmes privés', defaultRoles: ['DEVELOPER','ADMIN'] },

  // Contenu / Thèmes
  { key: 'CREATE_THEME', category: 'Contenu', description: 'Créer un thème', defaultRoles: ['USER','BETA','PARTNER','ADMIN','DEVELOPER'] },
  { key: 'APPROVE_THEME', category: 'Contenu', description: 'Approuver ou rejeter des thèmes', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },
  { key: 'ARCHIVE_THEME', category: 'Contenu', description: 'Archiver des thèmes', defaultRoles: ['ADMIN','DEVELOPER'] },

  // Sécurité
  { key: 'RESET_2FA_USER', category: 'Sécurité', description: 'Réinitialiser le 2FA d’un utilisateur', defaultRoles: ['ADMIN','DEVELOPER'] },

  // Statistiques
  { key: 'VIEW_STATS', category: 'Statistiques', description: 'Voir les statistiques globales avancées', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },
  
  // Administration avancée
  { key: 'MANAGE_BANNED_EMAILS', category: 'Administration', description: 'Gérer les emails bannis', defaultRoles: ['ADMIN','MODERATOR','DEVELOPER'] },
  { key: 'MANAGE_SITE_SETTINGS', category: 'Administration', description: 'Paramètres généraux du site', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_COSMETICS_CATALOG', category: 'Administration', description: 'Gérer le catalogue de cosmétiques', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_PLINKK_SETTINGS_GLOBAL', category: 'Administration', description: 'Ajuster des paramètres plinkk globaux', defaultRoles: ['ADMIN','DEVELOPER'] },

  // Modération avancée
  { key: 'DELETE_PLINKK', category: 'Modération', description: 'Supprimer une Plinkk', defaultRoles: ['ADMIN','MODERATOR'] },
  { key: 'EDIT_ANY_PLINKK', category: 'Modération', description: 'Modifier n’importe quelle Plinkk', defaultRoles: ['ADMIN','MODERATOR','DEVELOPER'] },
  { key: 'VIEW_USER_PRIVATE_EMAIL', category: 'Modération', description: 'Voir les emails privés des utilisateurs', defaultRoles: ['ADMIN','MODERATOR'] },
  { key: 'VIEW_PRIVATE_PAGES', category: 'Modération', description: 'Voir les pages privées', defaultRoles: ['ADMIN','MODERATOR','DEVELOPER'] },
  { key: 'SUSPEND_PLINKK', category: 'Modération', description: 'Suspendre temporairement une Plinkk', defaultRoles: ['ADMIN','MODERATOR'] },
  { key: 'MANAGE_REPORTS', category: 'Modération', description: 'Gérer les signalements', defaultRoles: ['ADMIN','MODERATOR'] },

  // Contenu / Plinkk
  { key: 'CREATE_PLINKK', category: 'Contenu', description: 'Créer une Plinkk', defaultRoles: ['USER','BETA','PARTNER','ADMIN','DEVELOPER'] },
  { key: 'EDIT_PLINKK', category: 'Contenu', description: 'Modifier ses Plinkks', defaultRoles: ['USER','BETA','PARTNER','ADMIN','DEVELOPER'] },
  { key: 'DELETE_OWN_PLINKK', category: 'Contenu', description: 'Supprimer ses propres Plinkks', defaultRoles: ['USER','BETA','PARTNER','ADMIN','DEVELOPER'] },
  { key: 'PUBLISH_PLINKK', category: 'Contenu', description: 'Publier / rendre publique une Plinkk', defaultRoles: ['USER','BETA','PARTNER','ADMIN','DEVELOPER'] },
  { key: 'EDIT_ANY_THEME', category: 'Contenu', description: 'Modifier n’importe quel thème', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'DELETE_ANY_THEME', category: 'Contenu', description: 'Supprimer un thème', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'FEATURE_THEME', category: 'Contenu', description: 'Mettre un thème en avant', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },

  // Utilisateur (profil)
  { key: 'CHANGE_USERNAME', category: 'Utilisateur', description: 'Changer son nom d’utilisateur au-delà des limites', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'CHANGE_EMAIL', category: 'Utilisateur', description: 'Changer l’email utilisateur', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'EXPORT_DATA', category: 'Utilisateur', description: 'Exporter les données (portabilité)', defaultRoles: ['ADMIN','DEVELOPER'] },

  // Sécurité avancée
  { key: 'VIEW_AUDIT_LOGS', category: 'Sécurité', description: 'Voir le journal d’audit', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_SECURITY_SETTINGS', category: 'Sécurité', description: 'Gérer les paramètres de sécurité', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'VIEW_ADMIN_LOGS', category: 'Sécurité', description: 'Voir les logs d’administration', defaultRoles: ['ADMIN', 'DEVELOPER'] },

  // Statistiques détaillées
  { key: 'VIEW_LOGIN_STATS', category: 'Statistiques', description: 'Voir les statistiques de connexion', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },
  { key: 'VIEW_THEME_STATS', category: 'Statistiques', description: 'Voir les statistiques des thèmes', defaultRoles: ['ADMIN','DEVELOPER','MODERATOR'] },

  // Développement / Intégrations / API
  { key: 'RUN_MIGRATIONS', category: 'Développement', description: 'Lancer des migrations', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'SEED_DATABASE', category: 'Développement', description: 'Exécuter des seeds', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'ACCESS_DEV_TOOLS', category: 'Développement', description: 'Accéder aux outils développeur', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_API_KEYS', category: 'Développement', description: 'Gérer les clés API', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_WEBHOOKS', category: 'Développement', description: 'Gérer les webhooks', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_INTEGRATIONS', category: 'Intégrations', description: 'Configurer des intégrations', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_UMAMI', category: 'Intégrations', description: 'Configurer Umami / Analytics', defaultRoles: ['ADMIN','DEVELOPER'] },
  { key: 'MANAGE_ANALYTICS', category: 'Intégrations', description: 'Configurer les analytiques', defaultRoles: ['ADMIN','DEVELOPER'] },

  { key: 'IMPERSONATE_USER', category: 'Administration', description: 'Se connecter en tant qu’un autre utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
  { key: 'VIEW_SYSTEM_HEALTH', category: 'Administration', description: 'Voir l’état du système', defaultRoles: ['ADMIN', 'DEVELOPER'] },
  { key: 'RUN_SYSTEM_TASKS', category: 'Administration', description: 'Lancer des tâches système', defaultRoles: ['ADMIN', 'DEVELOPER'] },

  // Billing
  { key: 'VIEW_BILLING', category: 'Facturation', description: 'Voir la facturation', defaultRoles: ['ADMIN'] },
  { key: 'MANAGE_SUBSCRIPTIONS', category: 'Facturation', description: 'Gérer les abonnements', defaultRoles: ['ADMIN'] },
  { key: 'ISSUE_REFUNDS', category: 'Facturation', description: 'Émettre des remboursements', defaultRoles: ['ADMIN'] },
];
