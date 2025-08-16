import { GalleryVerticalEnd } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ConfirmPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Exam Papers
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We've sent you a confirmation email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email inbox and click the confirmation link to activate your account.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive an email? Check your spam folder or{" "}
              <a href="/auth/signup" className="underline underline-offset-4 hover:text-primary">
                try signing up again
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}