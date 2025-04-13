"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
    setUserData(values)
    setStep(2)
  }

  async function onCompleteRegistration(selectedCryptos: string[]) {
    if (!userData) return

    setIsLoading(true)
    setError(null)

    try {
      // Register the user
      const userResponse = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          dob: userData.dob || undefined,
        }),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || "Failed to register user")
      }

      // Login the user to get token
      const loginResponse = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      
      // Add selected cryptos to watchlist
      console.log("Selected cryptos:", selectedCryptos)
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

      // Redirect to dashboard
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
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <Button type="submit">Continue</Button>
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