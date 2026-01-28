'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScreenWrapper } from "@/components/custom/screen-wrapper";
import { onboardingScreenOne } from "@/lib/svg";
import { GoogleLogoIcon } from "@phosphor-icons/react";

export default function Home() {
  const router = useRouter();

  const handleSignIn = () => {
    // TODO: Add actual Google sign-in logic
    router.push('/quiz');
  };

  return (
    <ScreenWrapper>
      <Image
        src={onboardingScreenOne}
        alt="Onboarding screen"
        width={377}
        height={261}
        className="w-full mt-20 sm:mt-0"
        priority
      />
      <h3 className="text-2xl font-bold">Kiota helps you save & invest</h3>
      <div className="flex flex-col justify-around gap-3">
        <h4 className="text-sm">Track your tokenized assets, DeFi yields and Bitcoin across all wallets.</h4>
        <h4 className="text-sm">Set investing goals, automate strategies and build wealth 100% non-custodial.</h4>
      </div>
      <Button buttonColor={"secondary"} leftIcon={<GoogleLogoIcon color="black" size={32} />} onClick={handleSignIn}>Sign in with Google</Button>
      <h5 className="text-[#858699] text-xs">By clicking "Continue with Google", you acknowledge that you have read and understood, and agree to Kiota's Terms & Conditions and Privacy Policy</h5>
    </ScreenWrapper>
  );
}
