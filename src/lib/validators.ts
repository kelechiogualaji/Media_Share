// ─── Validation Schemas ─────────────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSignup(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const email = data.email as string;
  const password = data.password as string;
  const displayName = data.displayName as string;
  const role = data.role as string;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('A valid email address is required');
  if (!password || password.length < 6)
    errors.push('Password must be at least 6 characters');
  if (!displayName || displayName.trim().length < 2)
    errors.push('Display name must be at least 2 characters');
  if (!['creator', 'consumer'].includes(role))
    errors.push('Role must be either "creator" or "consumer"');

  return { isValid: errors.length === 0, errors };
}

export function validateLogin(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string))
    errors.push('A valid email address is required');
  if (!data.password)
    errors.push('Password is required');
  return { isValid: errors.length === 0, errors };
}

export function validatePost(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const caption = data.caption as string;
  if (!caption || caption.trim().length === 0)
    errors.push('Caption is required');
  if (caption && caption.length > 2000)
    errors.push('Caption must be under 2000 characters');
  const location = data.location as string;
  if (location && location.length > 200)
    errors.push('Location must be under 200 characters');
  return { isValid: errors.length === 0, errors };
}

export function validateComment(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  if (!data.postId) errors.push('Post ID is required');
  const text = data.text as string;
  if (!text || text.trim().length === 0) errors.push('Comment text is required');
  if (text && text.length > 1000) errors.push('Comment must be under 1000 characters');
  return { isValid: errors.length === 0, errors };
}

export function validateRating(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  if (!data.postId) errors.push('Post ID is required');
  const score = data.score as number;
  if (!score || score < 1 || score > 5 || !Number.isInteger(score))
    errors.push('Score must be an integer between 1 and 5');
  return { isValid: errors.length === 0, errors };
}
