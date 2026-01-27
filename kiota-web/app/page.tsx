import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-screen kiota-background w-screen bg-no-repeat bg-cover p-5">
      <div className="font-dm text-white">
        <h3 className="text-2xl font-bold">Kiota helps you save & invest</h3>
        <h4 className="text-sm">Track your tokenized assets, DeFi yields and Bitcoin across all wallets.</h4>
        <h4 className="text-sm">Set investing goals, automate strategies and build wealth 100% non-custodial.</h4>
      </div>
      <Button leftIcon={<Image src={ } alt="" />} >Sign in with Google</Button>
    </div>
  );
}
