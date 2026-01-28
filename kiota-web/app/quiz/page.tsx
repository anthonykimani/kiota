"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeftIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { QuizOption } from "@/components/ui/quiz-option"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { investmentToleranceQuiz } from "@/lib/quiz"

export default function QuizPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string[]>>(() =>
    investmentToleranceQuiz.reduce<Record<string, string[]>>((acc, question) => {
      acc[question.id] = []
      return acc
    }, {})
  )

  const totalSteps = investmentToleranceQuiz.length
  const currentStep = investmentToleranceQuiz[stepIndex]
  const progressValue = Math.round(((stepIndex + 1) / totalSteps) * 100)

  const selectedValues = answers[currentStep.id] ?? []
  const isAnswered = selectedValues.length > 0
  const isMulti = Boolean(currentStep.multi)
  const isLastStep = stepIndex === totalSteps - 1

  const toggleValue = (value: string) => {
    setAnswers((prev) => {
      const current = prev[currentStep.id] ?? []

      if (!isMulti) {
        return { ...prev, [currentStep.id]: [value] }
      }

      if (current.includes(value)) {
        return { ...prev, [currentStep.id]: current.filter((v) => v !== value) }
      }

      return { ...prev, [currentStep.id]: [...current, value] }
    })
  }

  const goBack = () => setStepIndex((prev) => Math.max(prev - 1, 0))
  const goNext = () => setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))
  const skipToEnd = () => setStepIndex(totalSteps - 1)

  const handleSubmit = () => {
    localStorage.setItem("quiz-answers", JSON.stringify(answers))
    router.push("/result")
  }

  return (
    <ScreenWrapper spaced>
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="disabled:opacity-40 p-2"
          disabled={stepIndex === 0}
          aria-label="Go back"
        >
          <CaretLeftIcon size={24} />
        </button>
        <Progress value={progressValue} className="w-48" />
        <button
          type="button"
          className="text-kiota-text-secondary text-sm p-2"
          onClick={skipToEnd}
        >
          Skip
        </button>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{currentStep.title}</h1>
        <p className="text-xl text-kiota-text-secondary">{currentStep.prompt}</p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div
          className="space-y-3"
          role={isMulti ? "group" : "radiogroup"}
          aria-label={currentStep.prompt}
        >
          {currentStep.options.map((option) => (
            <QuizOption
              key={option.value}
              label={option.label}
              helper={option.helper}
              isSelected={selectedValues.includes(option.value)}
              isMulti={isMulti}
              onClick={() => toggleValue(option.value)}
            />
          ))}
        </div>

        {/* Action button */}
        <Button
          type="button"
          buttonColor="primary"
          className="w-full"
          onClick={isLastStep ? handleSubmit : goNext}
          disabled={!isAnswered}
        >
          {isLastStep
            ? "Finish quiz"
            : isMulti
              ? "Pick at least 1 option to continue"
              : "Pick 1 option to continue"}
        </Button>
      </div>
    </ScreenWrapper>
  )
}
