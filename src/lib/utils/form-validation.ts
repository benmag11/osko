/**
 * Type-safe FormData extraction utilities
 */

export interface AuthFormData {
  email: string
  password: string
}

/**
 * Safely extract and validate auth form data
 * @throws {Error} if required fields are missing or invalid
 */
export function extractAuthFormData(formData: FormData): AuthFormData {
  const email = formData.get('email')
  const password = formData.get('password')
  
  // Validate email field
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string')
  }
  
  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address')
  }
  
  // Validate password field
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string')
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  return {
    email: email.trim(),
    password
  }
}

/**
 * Safely extract a string field from FormData
 */
export function getFormField(formData: FormData, fieldName: string): string | null {
  const value = formData.get(fieldName)
  
  if (value === null || value === undefined) {
    return null
  }
  
  if (typeof value !== 'string') {
    console.warn(`FormData field ${fieldName} is not a string:`, value)
    return null
  }
  
  return value.trim()
}

/**
 * Safely extract a required string field from FormData
 * @throws {Error} if field is missing or invalid
 */
export function getRequiredFormField(formData: FormData, fieldName: string): string {
  const value = getFormField(formData, fieldName)
  
  if (!value) {
    throw new Error(`${fieldName} is required`)
  }
  
  return value
}