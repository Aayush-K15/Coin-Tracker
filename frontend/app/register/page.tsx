"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TrendingUp } from "lucide-react"
import { CryptoSelectionStep } from "@/components/crypto-selection-step"

const userFormSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
    dob: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [userData, setUserData] = useState<z.infer<typeof userFormSchema> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      dob: "",
    },
  })

  async function onSubmitUserData(values: z.infer<typeof userFormSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          dob: values.dob || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register")
      }

      setUserData(values)
      setIsCodeSent(true)
    } catch (err) {
      console.error("Signup error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function verifyEmailCode() {
    try {
      const response = await fetch("http://localhost:5001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData?.email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid code")
      }

      setIsCodeVerified(true)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code")
    }
  }

  async function onCompleteRegistration(selectedCryptos: string[]) {
    if (!userData) return

    setIsLoading(true)
    setError(null)

    try {
      const loginResponse = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      })

      if (!loginResponse.ok) {
        throw new Error("Failed to log in after registration")
      }

      const { token } = await loginResponse.json()
      localStorage.setItem("token", token)

      await fetch("http://localhost:5001/api/crypto/watchlist/add-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_ids: selectedCryptos,
        }),
      })

      router.push("/dashboard")
    } catch (err) {
      console.error("Registration error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 md:left-8 md:top-8">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">CryptoTracker</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your information to create an account"
              : "Select cryptocurrencies to add to your watchlist"}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUserData)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            disabled={isCodeSent}
                          />
                          {!isCodeSent && (
                            <Button
                              type="button"
                              onClick={() => form.handleSubmit(onSubmitUserData)()}
                              disabled={!form.getValues("email")}
                            >
                              Send Code
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCodeSent && !isCodeVerified && (
                  <div className="space-y-2">
                    <FormLabel>Enter verification code</FormLabel>
                    <Input
                      placeholder="6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={verifyEmailCode}
                      disabled={verificationCode.length !== 6}
                    >
                      Verify Code
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>This helps us personalize your experience</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>Must be at least 6 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/login">I already have an account</Link>
                </Button>
                <Button type="submit" disabled={!isCodeVerified}>
                  Continue
                </Button>
              </CardFooter>
            </form>
          </Form>
        ) : (
          <CryptoSelectionStep onComplete={onCompleteRegistration} isLoading={isLoading} />
        )}

        {error && <div className="px-6 pb-4 text-center text-sm text-red-500">{error}</div>}
      </Card>
    </div>
  )
}
