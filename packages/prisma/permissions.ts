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
];
