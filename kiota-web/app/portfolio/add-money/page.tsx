'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CaretDownIcon, CopySimple, Check, Wallet } from "@phosphor-icons/react"
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
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
  DrawerClose,
} from "@/components/ui/drawer"
import { useAuth } from '@/context/auth-context'
import { depositApi } from '@/lib/api/client'

type DepositMethod = 'mpesa' | 'card' | 'crypto'

interface DepositMethodOption {
  id: DepositMethod
  title: string
  subtitle: string
  icon?: React.ReactNode
}

const depositMethods: DepositMethodOption[] = [
  {
    id: 'mpesa',
    title: 'Mpesa Number ••8812',
    subtitle: 'Mobile Money',
  },
  {
    id: 'crypto',
    title: 'Crypto Deposit',
    subtitle: 'USDC on Base Network',
    icon: <Wallet size={20} className="text-kiota-text-secondary" />,
  },
  {
    id: 'card',
    title: 'Add New Payment Method',
    subtitle: 'Card, Bank, or Mobile Money',
  },
]

type DepositStatus = 'idle' | 'awaiting' | 'received' | 'confirmed'

const AddMoneyPage = () => {
  const router = useRouter()
  const { wallet } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>('mpesa')
  const [copied, setCopied] = useState(false)
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [depositSessionId, setDepositSessionId] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('idle')

  const selectedMethodData = depositMethods.find(m => m.id === selectedMethod)

  // Fetch deposit address when crypto is selected
  useEffect(() => {
    if (selectedMethod === 'crypto' && !depositAddress) {
      fetchDepositAddress()
    }
  }, [selectedMethod])

  // Poll for deposit confirmation when crypto is selected and we have a session
  useEffect(() => {
    if (selectedMethod !== 'crypto' || !depositSessionId) return

    let isActive = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const pollForDeposit = async () => {
      try {
        const response = await depositApi.confirmDeposit(depositSessionId)
        const status = response.data?.status

        if (!isActive) return

        if (status === 'CONFIRMED') {
          setDepositStatus('confirmed')
          if (intervalId) clearInterval(intervalId)
          // Navigate to review page
          router.push('/portfolio/review-deposit')
          return
        }

        if (status === 'RECEIVED') {
          setDepositStatus('received')
          // Keep polling until confirmed
          return
        }

        setDepositStatus('awaiting')
      } catch (err) {
        // Silently continue polling on error
        console.error('Deposit poll error:', err)
      }
    }

    // Start polling
    pollForDeposit()
    intervalId = setInterval(pollForDeposit, 5000) // Poll every 5 seconds

    return () => {
      isActive = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [selectedMethod, depositSessionId, router])

  const fetchDepositAddress = async () => {
    setIsLoadingAddress(true)
    try {
      const response = await depositApi.createIntent(undefined, 'USDC', 'base')
      if (response.data) {
        setDepositAddress(response.data.depositAddress)
        setDepositSessionId(response.data.depositSessionId)
        setDepositStatus('awaiting')
        if (typeof window !== 'undefined') {
          localStorage.setItem('kiota_deposit_session_id', response.data.depositSessionId)
        }
      }
    } catch (error) {
      console.error('Failed to get deposit address:', error)
      // Fallback to wallet address if available
      if (wallet?.address) {
        setDepositAddress(wallet.address)
      }
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const handleBack = () => {
    router.push('/portfolio')
  }

  const handleSkip = () => {
    router.push('/home')
  }

  const handlePreviewOrder = () => {
    if (selectedMethod === 'crypto') {
      handleCopyAddress()
      return
    }

    router.push('/portfolio/review-deposit')
  }

  const handleSelectMethod = (method: DepositMethod) => {
    setSelectedMethod(method)
  }

  const handleCopyAddress = async () => {
    if (!depositAddress) return
    
    try {
      await navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
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
              <span className="text-sm font-medium">{selectedMethodData?.title}</span>
            </div>
            <CaretDownIcon size={20} className="text-kiota-text-secondary" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-[#14141C] border-kiota-border font-dm">
          <DrawerHeader>
            <DrawerTitle className="text-white">Select Deposit Method</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            {depositMethods.map((method) => (
              <DrawerClose asChild key={method.id}>
                <button 
                  className={`flex items-center gap-3 w-full p-4 rounded-lg transition-colors ${
                    selectedMethod === method.id 
                      ? 'bg-blue-500/20 border border-blue-500/50' 
                      : 'bg-[#0D0D12] hover:bg-white/10'
                  }`}
                  onClick={() => handleSelectMethod(method.id)}
                >
                  {method.icon && (
                    <div className="flex-shrink-0">
                      {method.icon}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-white">{method.title}</span>
                    <span className="text-xs text-kiota-text-secondary">{method.subtitle}</span>
                  </div>
                  {selectedMethod === method.id && (
                    <Check size={20} className="ml-auto text-blue-500" />
                  )}
                </button>
              </DrawerClose>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {selectedMethod === 'crypto' && (
        <div className="flex flex-col items-center gap-4 w-full rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">Base Network</span>
            <span className="text-xs text-kiota-text-secondary">• USDC</span>
          </div>

          <div className="bg-white p-3 rounded-2xl">
            {isLoadingAddress ? (
              <div className="w-40 h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : depositAddress ? (
              <QRCodeSVG
                value={depositAddress}
                size={160}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-gray-500">
                No address available
              </div>
            )}
          </div>

          <div className="w-full space-y-2">
            <p className="text-xs text-kiota-text-secondary text-center">Deposit Address</p>
            <button
              onClick={handleCopyAddress}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              <span className="text-sm font-mono">
                {depositAddress ? truncateAddress(depositAddress) : 'Loading...'}
              </span>
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <CopySimple size={18} className="text-kiota-text-secondary" />
              )}
            </button>
          </div>

          {depositAddress && (
            <div className="w-full p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-kiota-text-secondary mb-1">Full Address</p>
              <p className="text-xs font-mono break-all text-white/80">{depositAddress}</p>
            </div>
          )}

          <div className="w-full p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-500">
              Only send USDC on the Base network to this address. Sending other tokens or using a different network may result in permanent loss of funds.
            </p>
          </div>

          {/* Deposit Status Indicator */}
          {depositStatus === 'awaiting' && (
            <div className="w-full p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              <p className="text-xs text-blue-400">
                Waiting for deposit... Send USDC to the address above.
              </p>
            </div>
          )}

          {depositStatus === 'received' && (
            <div className="w-full p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
              <div className="animate-pulse rounded-full h-4 w-4 bg-green-500" />
              <p className="text-xs text-green-400">
                Deposit detected! Waiting for network confirmations...
              </p>
            </div>
          )}
        </div>
      )}

      <Button buttonColor="primary" className="w-full mt-1" onClick={handlePreviewOrder}>
        {selectedMethod === 'crypto' ? (copied ? 'Copied!' : 'Copy Address') : 'Preview Order'}
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
