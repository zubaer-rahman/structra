'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { 
  RoleSelectionStep, 
  AccountDetailsStep, 
  ProgressSteps 
} from './registration'
import { USER_ROLES, UserRole } from '@/utils/constants'
import { registrationSchema, type RegistrationFormData } from '@/utils/validation'

interface RegistrationFormProps {
  onSubmit: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    user_role: UserRole
    user_agreed_to_terms: boolean
  }) => Promise<void>
  isLoading?: boolean
  error?: string
  defaultRole?: UserRole
}

export function RegistrationForm({ onSubmit, isLoading = false, error, defaultRole }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: {
      user_role: defaultRole || USER_ROLES.HOMEOWNER,
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      user_agreed_to_terms: false,
    },
  })

  // Reset form when defaultRole changes
  useEffect(() => {
    if (defaultRole) {
      form.reset({
        user_role: defaultRole,
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        user_agreed_to_terms: false,
      })
    }
  }, [defaultRole, form])

  const handleNext = async () => {
    const isValid = await form.trigger(['user_role'])
    if (isValid) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async (data: RegistrationFormData) => {
    try {
      console.log('Form data received:', data)
      console.log('Form validation state:', form.formState)
      
      // Transform data to include only essential fields
      const transformedData = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        user_role: data.user_role,
        user_agreed_to_terms: data.user_agreed_to_terms,
      }
      
      console.log('Transformed data:', transformedData)
      
      await onSubmit(transformedData)
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  const steps = [
    { id: 1, title: 'Role', description: 'Select role' },
    { id: 2, title: 'Details', description: 'Complete profile' }
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Steps */}
      <ProgressSteps currentStep={currentStep} steps={steps} />

      <Card className="w-full">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            {currentStep === 1 ? 'Choose Role' : 'Complete Profile'}
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            {currentStep === 1 ? 'Select your role' : 'Complete your profile'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <RoleSelectionStep form={form} onNext={handleNext} />
            )}

            {/* Step 2: Account Details */}
            {currentStep === 2 && (
              <AccountDetailsStep 
                form={form} 
                onBack={handleBack} 
                isLoading={isLoading} 
              />
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}