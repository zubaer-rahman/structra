"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { USER_ROLES, UserRole } from '@/utils/constants'
import { LoadingSpinner } from '@/components/shared'
import { Building2, Home } from 'lucide-react'

// Homeowner onboarding schema
const homeownerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.union([
    z.string().min(5, 'Please enter your address'),
    z.object({
      address: z.string().min(5, 'Please enter your address'),
      city: z.string().nullable().optional(),
      province: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
      country: z.string().optional(),
    })
  ]),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
})

// Contractor onboarding schema
const contractorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  gstHstNumber: z.string().optional(),
  serviceAreas: z.array(z.string()).min(1, 'Please select at least one service area'),
  specialties: z.array(z.string()).min(1, 'Please select at least one specialty'),
})

type HomeownerFormData = z.infer<typeof homeownerSchema>
type ContractorFormData = z.infer<typeof contractorSchema>

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'
]

const serviceAreas = [
  'Residential', 'Commercial', 'Industrial', 'Renovation', 'New Construction',
  'Kitchen & Bath', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Landscaping'
]

const specialties = [
  'General Contractor', 'Plumber', 'Electrician', 'HVAC Technician',
  'Carpenter', 'Painter', 'Roofer', 'Landscaper', 'Interior Designer',
  'Architect', 'Engineer', 'Handyman'
]

export function OnboardingForm() {
  const [userType, setUserType] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, createUserProfile, fetchUserProfile } = useAuth()

  const homeownerForm = useForm<HomeownerFormData>({
    resolver: zodResolver(homeownerSchema),
  })

  const contractorForm = useForm<ContractorFormData>({
    resolver: zodResolver(contractorSchema),
  })

  const onSubmitHomeowner = async (data: HomeownerFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
              const result = await createUserProfile(user.id, USER_ROLES.HOMEOWNER, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      await fetchUserProfile()
      toast.success('Profile created successfully!')
      router.push('/dashboard/homeowner')
    } catch (error: unknown) {
      console.error('Error creating homeowner profile:', error)
      toast.error((error as Error).message || 'Failed to create profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitContractor = async (data: ContractorFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
              const result = await createUserProfile(user.id, USER_ROLES.CONTRACTOR, data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      await fetchUserProfile()
      toast.success('Profile created successfully!')
      router.push('/dashboard/contractor')
    } catch (error: unknown) {
      console.error('Error creating contractor profile:', error)
      toast.error((error as Error).message || 'Failed to create profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us about yourself to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                                  userType === USER_ROLES.HOMEOWNER ? 'ring-2 ring-orange-500 bg-orange-50' : ''
              }`}
              onClick={() => setUserType(USER_ROLES.HOMEOWNER)}
              >
                <CardContent className="p-6 text-center">
                  <Home className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                  <h3 className="text-xl font-semibold mb-2">I&apos;m a Homeowner</h3>
                  <p className="text-gray-600">
                    I need help with home improvement projects and want to find qualified contractors.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                                  userType === USER_ROLES.CONTRACTOR ? 'ring-2 ring-orange-500 bg-orange-50' : ''
              }`}
              onClick={() => setUserType(USER_ROLES.CONTRACTOR)}
              >
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-900" />
                  <h3 className="text-xl font-semibold mb-2">I&apos;m a Contractor</h3>
                  <p className="text-gray-600">
                    I provide construction and renovation services and want to find new clients.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {userType === USER_ROLES.HOMEOWNER ? 'Homeowner Profile' : 'Contractor Profile'}
          </CardTitle>
          <CardDescription>
            Complete your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userType === USER_ROLES.HOMEOWNER ? (
            <form onSubmit={homeownerForm.handleSubmit(onSubmitHomeowner)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    {...homeownerForm.register('firstName')}
                    className={homeownerForm.formState.errors.firstName ? 'border-red-500' : ''}
                  />
                  {homeownerForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{homeownerForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    {...homeownerForm.register('lastName')}
                    className={homeownerForm.formState.errors.lastName ? 'border-red-500' : ''}
                  />
                  {homeownerForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{homeownerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  {...homeownerForm.register('phone')}
                  className={homeownerForm.formState.errors.phone ? 'border-red-500' : ''}
                />
                {homeownerForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">{homeownerForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address *
                </label>
                <Input
                  id="address"
                  placeholder="Enter your address"
                  {...homeownerForm.register('address')}
                  className={homeownerForm.formState.errors.address ? 'border-red-500' : ''}
                />
                {homeownerForm.formState.errors.address && (
                  <p className="text-sm text-red-500">{homeownerForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <Input
                    id="city"
                    placeholder="Enter your city (optional)"
                    {...homeownerForm.register('city')}
                    className={homeownerForm.formState.errors.city ? 'border-red-500' : ''}
                  />
                  {homeownerForm.formState.errors.city && (
                    <p className="text-sm text-red-500">{homeownerForm.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="province" className="text-sm font-medium">
                    Province
                  </label>
                  <select
                    id="province"
                    {...homeownerForm.register('province')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select province (optional)</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {homeownerForm.formState.errors.province && (
                    <p className="text-sm text-red-500">{homeownerForm.formState.errors.province.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code
                  </label>
                  <Input
                    id="postalCode"
                    placeholder="A1A 1A1 (optional)"
                    {...homeownerForm.register('postalCode')}
                    className={homeownerForm.formState.errors.postalCode ? 'border-red-500' : ''}
                  />
                  {homeownerForm.formState.errors.postalCode && (
                    <p className="text-sm text-red-500">{homeownerForm.formState.errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserType(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner 
                      inline 
                      size="sm" 
                      variant="white" 
                      text="Creating Profile..." 
                    />
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={contractorForm.handleSubmit(onSubmitContractor)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">
                  Business Name *
                </label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  {...contractorForm.register('businessName')}
                  className={contractorForm.formState.errors.businessName ? 'border-red-500' : ''}
                />
                {contractorForm.formState.errors.businessName && (
                  <p className="text-sm text-red-500">{contractorForm.formState.errors.businessName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="contactPerson" className="text-sm font-medium">
                    Contact Person *
                  </label>
                  <Input
                    id="contactPerson"
                    placeholder="Enter contact person name"
                    {...contractorForm.register('contactPerson')}
                    className={contractorForm.formState.errors.contactPerson ? 'border-red-500' : ''}
                  />
                  {contractorForm.formState.errors.contactPerson && (
                    <p className="text-sm text-red-500">{contractorForm.formState.errors.contactPerson.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(123) 456-7890"
                    {...contractorForm.register('phone')}
                    className={contractorForm.formState.errors.phone ? 'border-red-500' : ''}
                  />
                  {contractorForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">{contractorForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Business Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    {...contractorForm.register('email')}
                    className={contractorForm.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {contractorForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{contractorForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="gstHstNumber" className="text-sm font-medium">
                    GST/HST Number
                  </label>
                  <Input
                    id="gstHstNumber"
                    placeholder="Optional"
                    {...contractorForm.register('gstHstNumber')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Service Areas *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {serviceAreas.map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={area}
                        {...contractorForm.register('serviceAreas')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
                {contractorForm.formState.errors.serviceAreas && (
                  <p className="text-sm text-red-500">{contractorForm.formState.errors.serviceAreas.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Specialties *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specialties.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={specialty}
                        {...contractorForm.register('specialties')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
                {contractorForm.formState.errors.specialties && (
                  <p className="text-sm text-red-500">{contractorForm.formState.errors.specialties.message}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserType(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner 
                      inline 
                      size="sm" 
                      variant="white" 
                      text="Creating Profile..." 
                    />
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}