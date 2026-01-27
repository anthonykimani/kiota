'use client';

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress';
import { CaretLeftIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import React from 'react'

const QuizPage = () => {
  return (
        <div className="flex flex-col justify-around h-screen kiota-background w-screen bg-no-repeat bg-cover bg-right p-2 font-dm text-white">
            <div className='flex justify-around items-center'>
                <CaretLeftIcon size={32} />
                <Progress value={33} />
                <h4 className="text-white">Skip</h4>
            </div>
          <h3 className="text-2xl font-semibold">Before jumping in, let’s explore why you’re here, James!</h3>
          <h4 className='text-xl text-[#858699]'>How old are you?</h4>

          <div>
            
          </div>
          <Button buttonColor={"primary"}>Pick 1 option to continue</Button>
        </div>
  )
}

export default QuizPage