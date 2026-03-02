// Cat\u00e9gories: Administration, Mod\u00e9ration, Utilisateur, Contenu, S\u00e9curit\u00e9, Statistiques
const PERMISSIONS = [
    // Administration g\u00e9n\u00e9rale
    { key: 'VIEW_ADMIN', category: 'Administration', description: 'Acc\u00e9der \u00e0 l\u2019interface administrative', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'MANAGE_ROLES', category: 'Administration', description: 'Cr\u00e9er / modifier / supprimer des r\u00f4les', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'ASSIGN_ROLE', category: 'Administration', description: 'Attribuer un r\u00f4le \u00e0 un utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_ANNOUNCEMENTS', category: 'Administration', description: 'G\u00e9rer les annonces / messages globaux', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'VIEW_SYSTEM_LOGS', category: 'Administration', description: 'Consulter les journaux syst\u00e8me', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // Mod\u00e9ration
    { key: 'MANAGE_USERS', category: 'Mod\u00e9ration', description: 'Modifier des utilisateurs (email public, reset 2FA, etc.)', defaultRoles: ['ADMIN', 'MODERATOR', 'DEVELOPER'] },
    { key: 'BAN_USER', category: 'Mod\u00e9ration', description: 'Bannir un utilisateur', defaultRoles: ['ADMIN', 'MODERATOR'] },
    { key: 'UNBAN_USER', category: 'Mod\u00e9ration', description: 'R\u00e9voquer un bannissement', defaultRoles: ['ADMIN', 'MODERATOR'] },
    { key: 'MANAGE_BANNED_SLUGS', category: 'Mod\u00e9ration', description: 'G\u00e9rer les slugs interdits', defaultRoles: ['ADMIN', 'MODERATOR', 'DEVELOPER'] },
    // Utilisateur
    { key: 'EXTENDED_PLINKK_LIMIT', category: 'Utilisateur', description: 'Acc\u00e8s \u00e0 un nombre de Plinkk sup\u00e9rieur au standard', defaultRoles: ['PARTNER', 'DEVELOPER', 'ADMIN'] },
    { key: 'EXTENDED_THEME_LIMIT', category: 'Utilisateur', description: 'Peut cr\u00e9er davantage de th\u00e8mes priv\u00e9s', defaultRoles: ['DEVELOPER', 'ADMIN'] },
    // Contenu / Th\u00e8mes
    { key: 'CREATE_THEME', category: 'Contenu', description: 'Cr\u00e9er un th\u00e8me', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'APPROVE_THEME', category: 'Contenu', description: 'Approuver ou rejeter des th\u00e8mes', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'ARCHIVE_THEME', category: 'Contenu', description: 'Archiver des th\u00e8mes', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // S\u00e9curit\u00e9
    { key: 'RESET_2FA_USER', category: 'S\u00e9curit\u00e9', description: 'R\u00e9initialiser le 2FA d\u2019un utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // Statistiques
    { key: 'VIEW_STATS', category: 'Statistiques', description: 'Voir les statistiques globales avanc\u00e9es', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    // Administration avanc\u00e9e
    { key: 'MANAGE_BANNED_EMAILS', category: 'Administration', description: 'G\u00e9rer les emails bannis', defaultRoles: ['ADMIN', 'MODERATOR', 'DEVELOPER'] },
    { key: 'MANAGE_SITE_SETTINGS', category: 'Administration', description: 'Param\u00e8tres g\u00e9n\u00e9raux du site', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_COSMETICS_CATALOG', category: 'Administration', description: 'G\u00e9rer le catalogue de cosm\u00e9tiques', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_PLINKK_SETTINGS_GLOBAL', category: 'Administration', description: 'Ajuster des param\u00e8tres plinkk globaux', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // Mod\u00e9ration avanc\u00e9e
    { key: 'DELETE_PLINKK', category: 'Mod\u00e9ration', description: 'Supprimer une Plinkk', defaultRoles: ['ADMIN', 'MODERATOR'] },
    { key: 'EDIT_ANY_PLINKK', category: 'Mod\u00e9ration', description: 'Modifier n\u2019importe quelle Plinkk', defaultRoles: ['ADMIN', 'MODERATOR', 'DEVELOPER'] },
    { key: 'VIEW_USER_PRIVATE_EMAIL', category: 'Mod\u00e9ration', description: 'Voir les emails priv\u00e9s des utilisateurs', defaultRoles: ['ADMIN', 'MODERATOR'] },
    { key: 'VIEW_PRIVATE_PAGES', category: 'Mod\u00e9ration', description: 'Voir les pages priv\u00e9es', defaultRoles: ['ADMIN', 'MODERATOR', 'DEVELOPER'] },
    { key: 'SUSPEND_PLINKK', category: 'Mod\u00e9ration', description: 'Suspendre temporairement une Plinkk', defaultRoles: ['ADMIN', 'MODERATOR'] },
    { key: 'MANAGE_REPORTS', category: 'Mod\u00e9ration', description: 'G\u00e9rer les signalements', defaultRoles: ['ADMIN', 'MODERATOR'] },
    // Contenu / Plinkk
    { key: 'CREATE_PLINKK', category: 'Contenu', description: 'Cr\u00e9er une Plinkk', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'EDIT_PLINKK', category: 'Contenu', description: 'Modifier ses Plinkks', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'DELETE_OWN_PLINKK', category: 'Contenu', description: 'Supprimer ses propres Plinkks', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'PUBLISH_PLINKK', category: 'Contenu', description: 'Publier / rendre publique une Plinkk', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'EDIT_ANY_THEME', category: 'Contenu', description: 'Modifier n\u2019importe quel th\u00e8me', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'DELETE_ANY_THEME', category: 'Contenu', description: 'Supprimer un th\u00e8me', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'FEATURE_THEME', category: 'Contenu', description: 'Mettre un th\u00e8me en avant', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    // Utilisateur (profil)
    { key: 'CHANGE_USERNAME', category: 'Utilisateur', description: 'Changer son nom d\u2019utilisateur au-del\u00e0 des limites', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'CHANGE_EMAIL', category: 'Utilisateur', description: 'Changer l\u2019email utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'EXPORT_DATA', category: 'Utilisateur', description: 'Exporter les donn\u00e9es (portabilit\u00e9)', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // S\u00e9curit\u00e9 avanc\u00e9e
    { key: 'VIEW_AUDIT_LOGS', category: 'S\u00e9curit\u00e9', description: 'Voir le journal d\u2019audit', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_SECURITY_SETTINGS', category: 'S\u00e9curit\u00e9', description: 'G\u00e9rer les param\u00e8tres de s\u00e9curit\u00e9', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'VIEW_ADMIN_LOGS', category: 'S\u00e9curit\u00e9', description: 'Voir les logs d\u2019administration', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // Statistiques d\u00e9taill\u00e9es
    { key: 'VIEW_LOGIN_STATS', category: 'Statistiques', description: 'Voir les statistiques de connexion', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'VIEW_THEME_STATS', category: 'Statistiques', description: 'Voir les statistiques des th\u00e8mes', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    // D\u00e9veloppement / Int\u00e9grations / API
    { key: 'RUN_MIGRATIONS', category: 'D\u00e9veloppement', description: 'Lancer des migrations', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'SEED_DATABASE', category: 'D\u00e9veloppement', description: 'Ex\u00e9cuter des seeds', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'ACCESS_DEV_TOOLS', category: 'D\u00e9veloppement', description: 'Acc\u00e9der aux outils d\u00e9veloppeur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_API_KEYS', category: 'D\u00e9veloppement', description: 'G\u00e9rer les cl\u00e9s API', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_WEBHOOKS', category: 'D\u00e9veloppement', description: 'G\u00e9rer les webhooks', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_INTEGRATIONS', category: 'Int\u00e9grations', description: 'Configurer des int\u00e9grations', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_UMAMI', category: 'Int\u00e9grations', description: 'Configurer Umami / Analytics', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_ANALYTICS', category: 'Int\u00e9grations', description: 'Configurer les analytiques', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'IMPERSONATE_USER', category: 'Administration', description: 'Se connecter en tant qu\u2019un autre utilisateur', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'VIEW_SYSTEM_HEALTH', category: 'Administration', description: 'Voir l\u2019\u00e9tat du syst\u00e8me', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'RUN_SYSTEM_TASKS', category: 'Administration', description: 'Lancer des t\u00e2ches syst\u00e8me', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'ACCESS_MAINTENANCE', category: 'Administration', description: 'Acc\u00e9der aux pages en maintenance', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_MAINTENANCE', category: 'Administration', description: 'G\u00e9rer la maintenance (param\u00e8tres)', defaultRoles: ['ADMIN', 'DEVELOPER'] },
    // Billing
    { key: 'VIEW_BILLING', category: 'Facturation', description: 'Voir la facturation', defaultRoles: ['ADMIN'] },
    { key: 'MANAGE_SUBSCRIPTIONS', category: 'Facturation', description: 'G\u00e9rer les abonnements', defaultRoles: ['ADMIN'] },
    { key: 'ISSUE_REFUNDS', category: 'Facturation', description: '\u00c9mettre des remboursements', defaultRoles: ['ADMIN'] },
    // Redirections
    { key: 'CREATE_REDIRECT', category: 'Redirections', description: 'Cr\u00e9er des liens de redirection', defaultRoles: ['USER', 'BETA', 'PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'EXTENDED_REDIRECT_LIMIT', category: 'Redirections', description: 'Limite \u00e9tendue de redirections', defaultRoles: ['PARTNER', 'ADMIN', 'DEVELOPER'] },
    { key: 'MANAGE_REDIRECTS', category: 'Redirections', description: 'G\u00e9rer toutes les redirections (admin)', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'VIEW_REDIRECT_STATS', category: 'Redirections', description: 'Voir les statistiques de redirection globales', defaultRoles: ['ADMIN', 'DEVELOPER', 'MODERATOR'] },
    { key: 'DELETE_ANY_REDIRECT', category: 'Redirections', description: 'Supprimer n\u2019importe quelle redirection', defaultRoles: ['ADMIN', 'MODERATOR'] },
    // Premium
    { key: 'PREMIUM_STATS_EXTENDED', category: 'Premium', description: 'Acc\u00e8s aux statistiques \u00e9tendues (> 30 jours)', defaultRoles: ['ADMIN', 'DEVELOPER', 'PARTNER'] },
    { key: 'PREMIUM_EXPORT_CSV', category: 'Premium', description: 'Export CSV avanc\u00e9 des donn\u00e9es', defaultRoles: ['ADMIN', 'DEVELOPER', 'PARTNER'] },
    { key: 'PREMIUM_EXTENDED_LIMITS', category: 'Premium', description: 'Limites \u00e9tendues (plinkks, th\u00e8mes, redirections)', defaultRoles: ['ADMIN', 'DEVELOPER', 'PARTNER'] },
    // Communication / Emails
    { key: 'SEND_EMAILS', category: 'Administration', description: 'Envoyer des emails personnalis\u00e9s aux utilisateurs', defaultRoles: ['ADMIN', 'DEVELOPER'] },
];

module.exports = { PERMISSIONS };