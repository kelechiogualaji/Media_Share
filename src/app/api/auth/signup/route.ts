// POST /api/auth/signup
import { NextRequest } from 'next/server';
import { ensureInitialized } from '@/lib/init';
import { signup } from '@/lib/services/authService';
import { validateSignup } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/helpers';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();

    const { isValid, errors } = validateSignup(body);
    if (!isValid) return errorResponse('Validation failed', 400, errors);

    const result = await signup({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      role: body.role,
    });

    return successResponse(result, 'Account created successfully');
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    return errorResponse(err.message, err.statusCode || 500);
  }
}
