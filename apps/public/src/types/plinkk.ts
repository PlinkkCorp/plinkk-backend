import {
    User,
    PlinkkSettings,
    BackgroundColor,
    NeonColor,
    Label,
    SocialIcon,
    PlinkkStatusbar,
    Link,
    Category,
} from "@plinkk/prisma";

export interface PlinkkSnapshot {
    plinkk?: Partial<User>;
    settings?: Partial<PlinkkSettings>;
    background?: BackgroundColor[];
    neonColors?: NeonColor[];
    labels?: Label[];
    socialIcon?: SocialIcon[];
    statusbar?: PlinkkStatusbar | null;
    links?: Link[];
    categories?: Category[];
    meta?: { changes?: unknown[] };
}
