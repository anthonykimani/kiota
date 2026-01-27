export type QuizOption = {
  value: string
  label: string
  helper?: string
}

export type QuizQuestion = {
  id: string
  title: string
  prompt: string
  multi?: boolean
  options: QuizOption[]
}

export const investmentToleranceQuiz: QuizQuestion[] = [
  {
    id: "age",
    title: "Before jumping in, let’s explore why you’re here, James!",
    prompt: "How old are you?",
    multi: false,
    options: [
      { value: "18-25", label: "18-25" },
      { value: "26-35", label: "26-35" },
      { value: "36-50", label: "36-50" },
      { value: "51+", label: "51+" },
    ],
  },
  {
    id: "horizon",
    title: "Let’s calibrate your time horizon.",
    prompt: "When do you expect to need most of this money?",
    multi: false,
    options: [
      { value: "<1y", label: "Within 12 months" },
      { value: "1-3y", label: "1-3 years" },
      { value: "3-7y", label: "3-7 years" },
      { value: "7+y", label: "7+ years" },
    ],
  },
  {
    id: "volatility",
    title: "Market swings can be intense.",
    prompt: "If your portfolio dropped 20% in a month, what would you do?",
    multi: false,
    options: [
      { value: "sell", label: "Sell to avoid more losses" },
      { value: "hold", label: "Hold and wait for recovery" },
      { value: "buy", label: "Buy more at lower prices" },
    ],
  },
  {
    id: "experience",
    title: "Tell us about your investing background.",
    prompt: "How would you describe your investing experience?",
    multi: true,
    options: [
      { value: "new", label: "I’m new to investing" },
      { value: "some", label: "I’ve invested a bit" },
      { value: "confident", label: "I’m comfortable with markets" },
      { value: "advanced", label: "I actively manage strategies" },
    ],
  },
  {
    id: "income",
    title: "Let’s understand your cash flow comfort.",
    prompt: "How stable is your monthly income?",
    multi: false,
    options: [
      { value: "variable", label: "Very variable" },
      { value: "somewhat", label: "Somewhat stable" },
      { value: "stable", label: "Stable and predictable" },
    ],
  },
]
