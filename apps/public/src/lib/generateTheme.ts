import { prisma } from "../server/plinkkFrontUserRoutes";
import builtInThemes from "./builtInThemes";
import { builtInThemesTypes, coerceThemeData } from "./theme";

export async function generateTheme(userId?: string) {
  let builtIns: builtInThemesTypes[] = [];
  try {
    if (Array.isArray(builtInThemes)) builtIns = builtInThemes;
  } catch (e) {
    builtIns = [];
  }

  // Load approved community themes from DB
  const community = await prisma.theme.findMany({
    where: { status: "APPROVED", isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      data: true,
      author: { select: { id: true, userName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const list = [];
  // normalize community themes using coerceThemeData
  for (const t of community) {
    let full;
    try {
      full = coerceThemeData(t.data);
    } catch {
      full = t.data;
    }
    list.push({
      id: t.id,
      name: t.name,
      description: t.description || "",
      source: "community",
      author: t.author,
      ...(full || {}),
    });
  }

  if (userId && typeof userId === "string") {
    const mine = await prisma.theme.findMany({
      where: { authorId: userId, status: "APPROVED" },
      select: {
        id: true,
        name: true,
        description: true,
        data: true,
        author: { select: { id: true, userName: true } },
      },
    });
    for (const t of mine) {
      let full;
      try {
        full = coerceThemeData(t.data);
      } catch {
        full = t.data;
      }
      list.push({
        id: t.id,
        name: t.name,
        description: t.description || "",
        source: "mine",
        author: t.author,
        ...(full || {}),
      });
    }
  }
  return { builtIns, theme: list };
}
