import path from "path";

export type DocNode = {
  slug: string; // url segment (e.g. "premiers-pas")
  title: string;
  excerpt?: string;
  file: string; // relative to views root, e.g. "docs/pages/getting-started.ejs"
  children?: DocNode[];
};

export const docsTree: DocNode[] = [
  {
    slug: "",
    title: "Aperçu",
    excerpt:
      "Présentation globale de Plinkk, philosophie, fonctionnalités clés et liens rapides.",
    file: "docs/pages/index.ejs",
  },
  {
    slug: "premiers-pas",
    title: "Premiers pas",
    excerpt:
      "Créer un compte, configurer votre profil, ajouter des liens et publier.",
    file: "docs/pages/getting-started.ejs",
  },
  {
    slug: "editeur",
    title: "Éditeur",
    excerpt: "Édition en direct, autosave, aperçu, organisation des liens.",
    file: "docs/pages/editor.ejs",
  },
  {
    slug: "liens",
    title: "Liens",
    excerpt: "Types de liens, descriptions, icônes, tri et bonnes pratiques.",
    file: "docs/pages/links.ejs",
  },
  {
    slug: "themes",
    title: "Thèmes et styles",
    excerpt: "Couleurs, animations, canvas, contrastes et accessibilité.",
    file: "docs/pages/themes.ejs",
    children: [
      {
        slug: "layouts",
        title: "Mise en page (Layouts)",
        excerpt: "Choix et configuration de l'agencement des blocs.",
        file: "docs/pages/layouts.ejs",
      },
    ],
  },
  {
    slug: "boutons-thematiques",
    title: "Boutons thématiques",
    excerpt: "Styles et icônes cohérents pour les plateformes populaires.",
    file: "docs/pages/thematic-buttons.ejs",
  },
  {
    slug: "labels-icones",
    title: "Labels & icônes sociales",
    excerpt: "Chips, réseaux sociaux, recommandations de lisibilité.",
    file: "docs/pages/labels-icons.ejs",
  },
  {
    slug: "status-bar",
    title: "Status bar",
    excerpt: "Statuts (en ligne, occupé, AFK) façon Discord.",
    file: "docs/pages/status-bar.ejs",
  },
  {
    slug: "beta",
    title: "Espace bêta",
    excerpt: "Tester les nouveautés sur beta.plinkk.fr et donner du feedback.",
    file: "docs/pages/beta.ejs",
  },
  {
    slug: "export-import",
    title: "Export / Import",
    excerpt:
      "Sauvegarder et migrer votre configuration entre stable et bêta.",
    file: "docs/pages/export-import.ejs",
  },
  {
    slug: "roles-admin",
    title: "Rôles & administration",
    excerpt: "Gestion des accès, modération et paramètres globaux.",
    file: "docs/pages/roles-admin.ejs",
  },
  {
    slug: "domaines",
    title: "Domaines personnalisés",
    excerpt: "Configurer un domaine personnalisé et vérifier le DNS.",
    file: "docs/pages/domains.ejs",
  },
  {
    slug: "auto-hebergement",
    title: "Auto‑hébergement",
    excerpt: "Déployer Plinkk avec Docker, configurer l'ENV et la base.",
    file: "docs/pages/self-hosting.ejs",
  },
  {
    slug: "securite-vie-privee",
    title: "Sécurité & vie privée",
    excerpt: "Bonnes pratiques, validations et respect des données.",
    file: "docs/pages/security-privacy.ejs",
  },
  {
    slug: "cli-outils",
    title: "Outils CLI & scripts",
    excerpt: "Scripts d'administration et maintenance.",
    file: "docs/pages/cli-tools.ejs",
  },
  {
    slug: "depannage",
    title: "Dépannage",
    excerpt: "Erreurs courantes, logs et résolution de problèmes.",
    file: "docs/pages/troubleshooting.ejs",
  },
  {
    slug: "faq",
    title: "FAQ",
    excerpt: "Questions fréquentes.",
    file: "docs/pages/faq.ejs",
  },
  {
    slug: "changelog",
    title: "Changelog",
    excerpt: "Historique des changements et nouveautés.",
    file: "docs/pages/changelog.ejs",
  },
];

export type FlatDoc = {
  path: string; // e.g. "/docs/themes/layouts"
  segments: string[];
  title: string;
  excerpt?: string;
  file: string;
  parents: { title: string; path: string }[]; // for breadcrumbs
};

export function flattenDocs(tree: DocNode[], base: string = "/docs"): FlatDoc[] {
  const out: FlatDoc[] = [];
  const visit = (
    node: DocNode,
    parents: { title: string; path: string; slug: string }[]
  ) => {
    const segs = [...parents.map((p) => p.slug), node.slug].filter(Boolean);
    const p = base + (segs.length ? "/" + segs.join("/") : "");
    out.push({
      path: p,
      segments: segs,
      title: node.title,
      excerpt: node.excerpt,
      file: node.file,
      parents: parents.map((pr) => ({ title: pr.title, path: base + (pr.slug ? "/" + pr.slug : "") })),
    });
    (node.children || []).forEach((c) => visit(c, [...parents, { title: node.title, path: p, slug: node.slug }]));
  };
  tree.forEach((n) => visit(n, []));
  return out;
}

export const flatDocs = flattenDocs(docsTree);

export function getDocBySegments(segments: string[]): FlatDoc | undefined {
  const norm = segments.filter(Boolean).join("/");
  return flatDocs.find((d) => d.segments.join("/") === norm);
}

export function getPrevNext(pathname: string): { prev?: FlatDoc; next?: FlatDoc } {
  const idx = flatDocs.findIndex((d) => d.path === pathname);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? flatDocs[idx - 1] : undefined,
    next: idx < flatDocs.length - 1 ? flatDocs[idx + 1] : undefined,
  };
}

export function resolveViewAbsolute(viewRoot: string, fileRel: string) {
  return path.join(viewRoot, fileRel);
}
