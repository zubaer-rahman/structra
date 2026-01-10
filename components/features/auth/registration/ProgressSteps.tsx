'use client'

import { CheckCircle } from 'lucide-react'

interface ProgressStepsProps {
  currentStep: number
  steps: Array<{
    id: number
    title: string
    description: string
  }>
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200
              ${currentStep >= step.id 
                ? "border-orange-500 bg-orange-500 text-white" 
                : "border-gray-300 text-gray-500"
              }
            `}>
              {currentStep > step.id ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{step.id}</span>
              )}
            </div>
            <div className="ml-2 text-left">
              <h3 className={`
                text-sm font-medium transition-colors
                ${currentStep >= step.id ? "text-gray-900" : "text-gray-500"}
              `}>
                {step.title}
              </h3>
              <p className={`
                text-xs transition-colors
                ${currentStep >= step.id ? "text-gray-600" : "text-gray-400"}
              `}>
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-3 transition-colors
                ${currentStep > step.id ? "bg-orange-500" : "bg-gray-200"}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
