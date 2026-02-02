import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface ActionCardProps {
    sectionTitle: string
    image: string
    title: string
    subtitle: string
    buttonText: string
    onButtonClick?: () => void
}

export function ActionCard({
    sectionTitle,
    image,
    title,
    subtitle,
    buttonText,
    onButtonClick
}: ActionCardProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">{sectionTitle}</h2>
            <div className="flex flex-col gap-5 bg-kiota-card p-4 rounded-xl w-full">
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
        </div>
    )
}
