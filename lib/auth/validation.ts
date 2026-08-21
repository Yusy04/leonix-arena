export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(input: { name?: string; email?: string; password?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name || !input.name.trim()) errors.name = "Name is required.";
  if (!input.email || !EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password || input.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export function validateLogin(input: { email?: string; password?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email || !EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Password is required.";
  return errors;
}

const HANDLE_RE = /^[a-z0-9]{2,30}$/;

export function validateProfile(input: { name?: string; email?: string; handle?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name || !input.name.trim()) errors.name = "Name is required.";
  if (!input.email || !EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address.";
  if (!input.handle || !HANDLE_RE.test(input.handle)) errors.handle = "Handle must be 2–30 lowercase letters or digits.";
  return errors;
}

export function validatePasswordChange(input: { currentPassword?: string; newPassword?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.currentPassword) errors.currentPassword = "Enter your current password.";
  if (!input.newPassword || input.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
  return errors;
}
