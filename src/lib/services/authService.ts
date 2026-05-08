// ─── Authentication Service ─────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { getContainer } from '../config/database';
import { generateId, now } from '../helpers';
import type { User, SafeUser, AuthPayload } from '../types';

const SALT_ROUNDS = 12;

export async function signup(params: {
  email: string;
  password: string;
  displayName: string;
  role: 'creator' | 'consumer';
}): Promise<{ user: SafeUser; token: string }> {
  const container = getContainer('users');

  // Check duplicate email
  const { resources: existing } = await container.items
    .query({
      query: 'SELECT c.id FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: params.email.toLowerCase() }],
    })
    .fetchAll();

  if (existing.length > 0) {
    const error = new Error('An account with this email already exists') as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);

  const user: User = {
    id: generateId(),
    email: params.email.toLowerCase(),
    passwordHash,
    displayName: params.displayName.trim(),
    role: params.role,
    profileImageUrl: null,
    createdAt: now(),
  };

  await container.items.create(user);

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<{ user: SafeUser; token: string }> {
  const container = getContainer('users');

  const { resources: users } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: params.email.toLowerCase() }],
    })
    .fetchAll();

  if (users.length === 0) {
    const error = new Error('Invalid email or password') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const user = users[0] as User;
  const isValid = await bcrypt.compare(params.password, user.passwordHash);

  if (!isValid) {
    const error = new Error('Invalid email or password') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

function generateToken(user: User): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
