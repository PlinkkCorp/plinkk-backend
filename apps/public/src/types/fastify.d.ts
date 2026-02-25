import { FastifyRequest } from "fastify";
import { UserWithInclude } from "@plinkk/shared";

declare module "fastify" {
    interface FastifyRequest {
        userId: string | null;
        currentUser: UserWithInclude | null;
        publicPath: string | null;
    }
}
