import { RegisterForm } from "@/components/auth/register-form-enhanced"
import { Logo } from "@/components/auth/logo"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <>
      <div className="flex flex-col items-center space-y-4 text-center">
        <Logo />
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to create your account</p>
      </div>
      <Card className="mt-6 border-none bg-card/50 shadow-lg">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Enter your email and create a password</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/20 p-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  )
}
