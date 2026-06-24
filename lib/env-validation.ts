/**
 * Validate required environment variables
 * @returns Object containing validation results
 */
export function validateEnvironmentVariables() {
  const requiredVars = [
    "RESEND_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]

  const missing: string[] = []
  const present: string[] = []

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName)
    } else {
      present.push(varName)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    present,
  }
}

/**
 * Check if a specific environment variable is set
 * @param varName Name of the environment variable
 * @returns Boolean indicating if the variable is set
 */
export function isEnvVarSet(varName: string): boolean {
  return !!process.env[varName]
}

/**
 * Get a required environment variable
 * @param varName Name of the environment variable
 * @param fallback Optional fallback value
 * @returns The environment variable value or fallback
 * @throws Error if the variable is not set and no fallback is provided
 */
export function getRequiredEnvVar(varName: string, fallback?: string): string {
  const value = process.env[varName]
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`Environment variable ${varName} not set, using fallback`)
      return fallback
    }
    throw new Error(`Required environment variable ${varName} is not set`)
  }
  return value
}
