'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { onboardingScreenOne } from "@/lib/svg";
import { GoogleLogoIcon } from "@phosphor-icons/react";

export default function Home() {
  return (
    <div className="flex flex-col justify-around h-screen kiota-background w-screen bg-no-repeat bg-cover bg-right p-5 font-dm text-white">
      <Image
        src={onboardingScreenOne}
        alt="Onboarding screen"
        width={377}
        height={261}
        className="w-full mt-37 sm:mt-0"
        priority
      />
      <h3 className="text-2xl font-bold">Kiota helps you save & invest</h3>
      <div className="flex flex-col justify-around gap-3">
        <h4 className="text-sm">Track your tokenized assets, DeFi yields and Bitcoin across all wallets.</h4>
        <h4 className="text-sm">Set investing goals, automate strategies and build wealth 100% non-custodial.</h4>
      </div>
      <Button buttonColor={"secondary"} leftIcon={<GoogleLogoIcon color="black" size={32} />} >Sign in with Google</Button>
      <h5 className="text-[#858699] text-xs">By clicking “Continue with Google”, you acknowledge that you have read and understood, and agree to Kiota’s Terms & Conditions and Privacy Policy</h5>
    </div>
  );
}
