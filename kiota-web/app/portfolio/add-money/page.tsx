'use client'

import { useRouter } from 'next/navigation'
import { CaretDownIcon } from "@phosphor-icons/react"
import Image from 'next/image'
import { LightingSvg } from '@/lib/svg'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/custom/page-header"
import { AmountChip } from "@/components/custom/amount-chip"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const AddMoneyPage = () => {
  const router = useRouter()

  const handleBack = () => {
    router.push('/portfolio')
  }

  const handleSkip = () => {
    router.push('/home')
  }

  const handlePreviewOrder = () => {
    router.push('/portfolio/review-deposit')
  }

  return (
    <ScreenWrapper centered className="py-6 gap-y-6">
      <PageHeader
        title="Add Money"
        onBack={handleBack}
        rightAction={
          <button
            type="button"
            className="text-kiota-text-secondary text-sm p-2"
            onClick={handleSkip}
          >
            Skip
          </button>
        }
      />

      <button className="flex justify-between items-center border border-white rounded-full p-2">
        <Image src={LightingSvg} alt="" width={0} height={0} className="w-5 h-5" />
        <h4>Instant Buy</h4>
        <CaretDownIcon size={24} />
      </button>

      <Input
        type="text"
        placeholder="$0.00"
        className="text-3xl font-semibold text-center bg-transparent border-none shadow-none focus-visible:ring-0 text-white placeholder:text-white/50"
      />
      <p className="text-sm text-kiota-text-secondary">Equivalent of 1290.00 KES</p>

      <Drawer>
        <DrawerTrigger asChild>
          <button className="flex items-center justify-between w-full p-4 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
            <div className="flex flex-col items-start">
              <span className="text-xs text-kiota-text-secondary">Pay With</span>
              <span className="text-sm font-medium">Mpesa Number ••8812</span>
            </div>
            <CaretDownIcon size={20} className="text-kiota-text-secondary" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-[#14141C] border-kiota-border font-dm">
          <DrawerHeader>
            <DrawerTitle className="text-white">Select Payment Method</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            <button className="flex items-center gap-3 w-full p-4 rounded-lg bg-[#0D0D12] hover:bg-white/15 transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">Mpesa Number ••8812</span>
                <span className="text-xs text-kiota-text-secondary">Mobile Money</span>
              </div>
            </button>
            <button className="flex items-center gap-3 w-full p-4 rounded-lg bg-[#0D0D12] hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">Add New Payment Method</span>
                <span className="text-xs text-kiota-text-secondary">Card, Bank, or Mobile Money</span>
              </div>
            </button>
            <Button buttonColor="primary" className="w-full mt-1">
              Apply
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Button buttonColor="primary" className="w-full mt-1" onClick={handlePreviewOrder}>
        Preview Order
      </Button>

      <div className="flex justify-between w-full">
        <AmountChip amount={20} />
        <AmountChip amount={50} />
        <AmountChip amount={100} />
        <AmountChip amount={250} />
      </div>
    </ScreenWrapper>
  )
}

export default AddMoneyPage