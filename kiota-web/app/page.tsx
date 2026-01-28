"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { GoogleLogoIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { onboardingScreenOne } from "@/lib/svg"

export default function Home() {
  const router = useRouter()

  const handleSignIn = () => {
    // TODO: Add actual Google sign-in logic
    router.push("/quiz")
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

      <Button
        buttonColor="secondary"
        leftIcon={<GoogleLogoIcon color="black" size={24} />}
        onClick={handleSignIn}
      >
        Sign in with Google
      </Button>

      <p className="text-kiota-text-secondary text-xs">
        By clicking &quot;Continue with Google&quot;, you acknowledge that you have read
        and understood, and agree to Kiota&apos;s Terms & Conditions and Privacy Policy
      </p>
    </ScreenWrapper>
  )
}
