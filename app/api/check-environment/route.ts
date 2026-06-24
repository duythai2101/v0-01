import { NextResponse } from "next/server"
import { validateEnvironmentVariables } from "@/lib/env-validation"

export async function GET() {
  try {
    const envValidation = validateEnvironmentVariables()

    return NextResponse.json({
      isValid: envValidation.isValid,
      missing: envValidation.missing,
      present: envValidation.present,
    })
  } catch (error: any) {
    console.error("[API] Error checking environment:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal Server Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
