"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { EnvelopeSimple, Phone, Wallet } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { onboardingScreenOne } from "@/lib/svg"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const router = useRouter()
  const { login, ready, authenticated } = usePrivy()
  const { isAuthenticated, isLoading, user, nextStep } = useAuth()

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (nextStep === 'quiz' || !user?.hasCompletedQuiz) {
        router.push("/quiz")
      } else {
        router.push("/home")
      }
    }
  }, [isLoading, isAuthenticated, nextStep, user, router])

  const handleSignIn = () => {
    login()
  }

  // Show loading while checking auth
  if (!ready || isLoading) {
    return (
      <ScreenWrapper spaced>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kiota-purple"></div>
        </div>
      </ScreenWrapper>
    )
  }

  // If already authenticated, show loading (redirect will happen)
  if (authenticated) {
    return (
      <ScreenWrapper spaced>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kiota-purple"></div>
          <p className="text-sm text-kiota-text-secondary">Setting up your account...</p>
        </div>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper spaced>
      <Image
        src={onboardingScreenOne}
        alt="Onboarding illustration"
        width={377}
        height={261}
        className="w-full mt-20 sm:mt-0"
        priority
      />

      <h1 className="text-2xl font-bold">Kiota helps you save & invest</h1>

      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Track your tokenized assets, DeFi yields and Bitcoin across all wallets.
        </p>
        <p className="text-sm">
          Set investing goals, automate strategies and build wealth 100% non-custodial.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Button
          buttonColor="primary"
          onClick={handleSignIn}
          className="w-full"
        >
          Get Started
        </Button>
      </div>

      <p className="text-kiota-text-secondary text-xs text-center">
        By clicking &quot;Get Started&quot;, you acknowledge that you have read
        and understood, and agree to Kiota&apos;s Terms & Conditions and Privacy Policy
      </p>
    </ScreenWrapper>
  )
}
