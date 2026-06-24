import { Resend } from "resend"
import { validateEnvironmentVariables } from "./env-validation"

/**
 * Initialize Resend client with comprehensive error handling
 * @returns Initialized Resend client
 */
export const getResendClient = () => {
  // Validate environment variables first
  const envValidation = validateEnvironmentVariables()
  if (!envValidation.isValid) {
    const missingVars = envValidation.missing.join(", ")
    console.error(`Missing required environment variables: ${missingVars}`)
    throw new Error(`Missing required environment variables: ${missingVars}`)
  }

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable is not set")
    throw new Error("Missing RESEND_API_KEY environment variable")
  }

  return new Resend(resendApiKey)
}
