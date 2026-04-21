'use client'

import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowRight, Home, Building2 } from 'lucide-react'
import { RegistrationFormData } from '@/utils/validation'


interface RoleSelectionStepProps {
  form: UseFormReturn<RegistrationFormData>
  onNext: () => void
}

export function RoleSelectionStep({ form, onNext }: RoleSelectionStepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-base font-semibold text-center block text-gray-700">
          I&apos;m a
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="radio"
              id="homeowner"
              value="homeowner"
              {...form.register('user_role')}
              className="sr-only peer"
            />
            <Label
              htmlFor="homeowner"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-6 hover:bg-gray-50 hover:border-gray-300 peer-checked:border-orange-500 peer-checked:bg-orange-50 cursor-pointer transition-all duration-200 hover:shadow-md group h-full"
            >
              <div className="mb-3 p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Home className="h-8 w-8 text-gray-900" />
              </div>
              <div className="space-y-2 text-center flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-semibold leading-none text-gray-900">Homeowner</h3>
                <p className="text-sm text-gray-600 max-w-xs">
                  Find and hire contractors
                </p>
                <div className="pt-2 text-xs text-gray-500">
                  ✓ Post projects ✓ Get quotes ✓ Manage
                </div>
              </div>
            </Label>
          </div>
          
          <div>
            <input
              type="radio"
              id="contractor"
              value="contractor"
              {...form.register('user_role')}
              className="sr-only peer"
            />
            <Label
              htmlFor="contractor"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-6 hover:bg-gray-50 hover:border-gray-300 peer-checked:border-orange-500 peer-checked:bg-orange-50 cursor-pointer transition-all duration-200 hover:shadow-md group h-full"
            >
              <div className="mb-3 p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Building2 className="h-8 w-8 text-gray-900" />
              </div>
              <div className="space-y-2 text-center flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-semibold leading-none text-gray-900">Contractor</h3>
                <p className="text-sm text-gray-600 max-w-xs">
                  Grow your business
                </p>
                <div className="pt-2 text-xs text-gray-500">
                  ✓ Get notifications ✓ Showcase ✓ Build
                </div>
              </div>
            </Label>
          </div>
        </div>
        {form.formState.errors.user_role && (
          <p className="text-red-600 text-sm text-center">{form.formState.errors.user_role.message}</p>
        )}
      </div>

      <div className="pt-4">
        <Button 
          type="button" 
          onClick={onNext}
          className="w-full h-11 text-base font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={!form.watch('user_role')}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
