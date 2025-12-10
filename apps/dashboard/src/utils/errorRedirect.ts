import { FastifyReply } from "fastify";

export function redirectWithError(
  reply: FastifyReply,
  path: string,
  error: string,
  params: Record<string, string> = {}
): void {
  const query = new URLSearchParams({
    error: error,
    ...params,
  });
  reply.redirect(`${path}?${query}`);
}

export function redirectWithErrorToLogin(
  reply: FastifyReply,
  error: string,
  email?: string,
  username?: string,
  isSignup: boolean = false
): void {
  const params: Record<string, string> = {};
  if (email) params.email = email;
  if (username) params.username = username;
  
  const hash = isSignup ? "#signup" : "";
  const query = new URLSearchParams({
    error,
    ...params,
  });
  
  reply.redirect(`/login?${query}${hash}`);
}
