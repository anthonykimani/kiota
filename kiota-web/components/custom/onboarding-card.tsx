import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface OnboardingCardProps {
    image: string
    title: string
    subtitle: string
    buttonText: string
    onButtonClick?: () => void
}

export function OnboardingCard({
    image,
    title,
    subtitle,
    buttonText,
    onButtonClick
}: OnboardingCardProps) {
    return (
        <div className="flex flex-col gap-y-8">
            <Image
                src={image}
                alt=""
                width={320}
                height={180}
                className='w-full h-auto rounded-lg'
            />
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-kiota-text-secondary">{subtitle}</p>
            <Button buttonColor="primary" className="w-full mt-1" onClick={onButtonClick}>
                {buttonText}
            </Button>
        </div>
    )
}
