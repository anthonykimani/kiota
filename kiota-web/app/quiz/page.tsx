"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeftIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScreenWrapper } from "@/components/custom/screen-wrapper"
import { investmentToleranceQuiz } from "@/lib/quiz"

const QuizPage = () => {
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

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const goNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))
  }

  const handleSubmit = () => {
    localStorage.setItem('quiz-answers', JSON.stringify(answers))
    router.push('/result')
  }

  return (
    <ScreenWrapper>
      <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={goBack}
            className="disabled:opacity-40"
            disabled={stepIndex === 0}
          >
            <CaretLeftIcon size={32} />
          </button>
          <Progress value={progressValue} className="w-64" />
          <button
            type="button"
            className="text-white"
            onClick={() => setStepIndex(totalSteps - 1)}
          >
            Skip
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold">{currentStep.title}</h3>
          <h4 className="text-xl text-[#858699]">{currentStep.prompt}</h4>
        </div>

        <div className="space-y-4">
          <div
            className="space-y-3"
            role={isMulti ? "group" : "radiogroup"}
            aria-label={currentStep.prompt}
          >
            {currentStep.options.map((option) => {
              const isSelected = selectedValues.includes(option.value)

              return (
                <button
                  key={option.value}
                  type="button"
                  role={!isMulti ? "radio" : undefined}
                  aria-checked={!isMulti ? isSelected : undefined}
                  aria-pressed={isMulti ? isSelected : undefined}
                  onClick={() => toggleValue(option.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition cursor-pointer ${isSelected
                      ? "border-white/80 bg-white/10"
                      : "border-white/10 bg-[#101017]"
                    }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-4 items-center justify-center rounded-full border transition ${isSelected
                        ? "border-[#7A5AF8] bg-[#7A5AF8]"
                        : "border-white/30"
                      }`}
                  >
                    <span
                      className={`block size-2 rounded-full bg-white transition ${isSelected ? "opacity-100" : "opacity-0"
                        }`}
                    />
                  </span>
                  <div className="space-y-1">
                    <span className="text-white">{option.label}</span>
                    {option.helper && (
                      <p className="text-xs text-[#858699]">{option.helper}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            {stepIndex < totalSteps - 1 ? (
              <Button
                type="button"
                buttonColor="primary"
                className="w-full"
                onClick={goNext}
                disabled={!isAnswered}
              >
                {isMulti
                  ? "Pick at least 1 option to continue"
                  : "Pick 1 option to continue"}
              </Button>
            ) : (
              <Button
                type="button"
                buttonColor="primary"
                className="w-full"
                disabled={!isAnswered}
                onClick={handleSubmit}
              >
                Finish quiz
              </Button>
            )}
          </div>
        </div>
    </ScreenWrapper>
  )
}

export default QuizPage
