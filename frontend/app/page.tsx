import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, Shield, LineChart, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CryptoTracker</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:underline underline-offset-4">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Track Your Crypto Portfolio in Real-Time
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Monitor prices, create watchlists, and track your investments all in one place. Get started for free
                    today.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-1.5">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full opacity-70 blur-3xl" />
                  <div className="relative h-full w-full rounded-xl bg-muted p-4 md:p-8">
                    <div className="h-full w-full rounded-lg bg-background p-4 shadow-lg">
                      <div className="space-y-4">
                        <div className="h-24 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 p-4">
                          <div className="text-lg font-bold">Portfolio Value</div>
                          <div className="text-2xl font-bold">$12,345.67</div>
                          <div className="text-sm text-green-600">+5.23% today</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-20 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 p-3">
                            <div className="text-sm font-medium">Bitcoin</div>
                            <div className="text-lg font-bold">$42,567</div>
                          </div>
                          <div className="h-20 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 p-3">
                            <div className="text-sm font-medium">Ethereum</div>
                            <div className="text-lg font-bold">$2,345</div>
                          </div>
                        </div>
                        <div className="h-32 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 p-4">
                          <div className="text-sm font-medium">Performance Chart</div>
                          <div className="mt-2 h-16 w-full">
                            <div className="h-full w-full rounded-md bg-background/50 relative overflow-hidden">
                              <div className="absolute bottom-0 left-0 h-full w-full">
                                <svg viewBox="0 0 100 20" className="h-full w-full">
                                  <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    className="text-primary"
                                    d="M0,10 Q30,5 50,10 T100,10"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything You Need to Track Your Crypto
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides all the tools you need to monitor your cryptocurrency investments and make
                  informed decisions.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Tracking</h3>
                <p className="text-center text-muted-foreground">
                  Monitor cryptocurrency prices in real-time with accurate data from trusted sources.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Portfolio</h3>
                <p className="text-center text-muted-foreground">
                  Keep track of your investments securely with our encrypted portfolio management system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Watchlists</h3>
                <p className="text-center text-muted-foreground">
                  Create custom watchlists to monitor your favorite cryptocurrencies and potential investments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">CryptoTracker</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CryptoTracker. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

