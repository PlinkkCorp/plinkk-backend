// Liste des slugs réservés en mémoire (préfixes/chemins système)
export const RESERVED_SLUGS = new Set<string>([
  'css', 'js', 'images', 'canvaAnimation', 'public', 'api', 'dashboard',
  'login', 'logout', 'register', 'totp', 'users', 'favicon.ico', 'robots.txt',
  'r', 'go'
]);
