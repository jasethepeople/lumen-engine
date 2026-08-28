/**
 * Auth + authorization helpers.
 *
 * Caller identity comes from the user's JWT (Authorization: Bearer ...).
 * Role checks hit project_members / projects per SCHEMA.md:
 *   project_members(project_id, user_id, role in ('owner','editor','viewer'))
 *   projects(id, owner_id, ...)
 */

import type { SupabaseClient, User } from 'jsr:@supabase/supabase-js@2';
import { anonClient, serviceClient } from './supabase.ts';

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Extract the bearer JWT, or throw 401. */
export function bearerToken(req: Request): string {
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AuthError(401, 'Missing Authorization bearer token');
  return match[1].trim();
}

/** Resolve the caller as a Supabase user from their JWT. */
export async function getUser(jwt: string): Promise<User> {
  const client = anonClient(jwt);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) throw new AuthError(401, 'Invalid or expired JWT');
  return data.user;
}

/**
 * Require the user to hold one of `roles` on the project. The project owner
 * (projects.owner_id) is always treated as 'owner' even if no membership row
 * exists. Uses the service client so behavior is identical regardless of RLS
 * policy drift; authorization is enforced here, explicitly.
 */
export async function requireRole(
  projectId: string,
  userId: string,
  roles: readonly ProjectRole[],
): Promise<ProjectRole> {
  const db = serviceClient();

  const { data: project, error: projErr } = await db
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .maybeSingle();
  if (projErr) throw new AuthError(500, `projects lookup failed: ${projErr.message}`);
  if (!project) throw new AuthError(404, 'Project not found');

  let role: ProjectRole | null = null;
  if (project.owner_id === userId) {
    role = 'owner';
  } else {
    const { data: member, error: memErr } = await db
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    if (memErr) throw new AuthError(500, `project_members lookup failed: ${memErr.message}`);
    role = (member?.role as ProjectRole | undefined) ?? null;
  }

  if (!role || !roles.includes(role)) {
    throw new AuthError(403, `Requires role: ${roles.join(' or ')}`);
  }
  return role;
}
