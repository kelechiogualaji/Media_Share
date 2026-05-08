// POST /api/auth/login
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { login } from '@/lib/services/authService';
import { validateLogin } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/helpers';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();

    const { isValid, errors } = validateLogin(body);
    if (!isValid) return errorResponse('Validation failed', 400, errors);

    const result = await login({
      email: body.email,
      password: body.password,
    });

    return successResponse(result, 'Login successful');
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
