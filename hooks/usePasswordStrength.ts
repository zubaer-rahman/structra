import { useMemo } from 'react'

export interface PasswordRequirement {
  key: string
  label: string
  test: (password: string) => boolean
  met: boolean
}

export interface PasswordStrength {
  requirements: PasswordRequirement[]
  completedCount: number
  totalCount: number
  strengthMessage: string
  strengthLevel: 'weak' | 'medium' | 'strong' | 'very-strong'
}

export function usePasswordStrength(password: string): PasswordStrength {
  const requirements = useMemo((): PasswordRequirement[] => [
    {
      key: 'length',
      label: '8+ characters',
      test: (pwd: string) => pwd.length >= 8,
      met: false
    },
    {
      key: 'lowercase',
      label: 'Lowercase letter (a-z)',
      test: (pwd: string) => /[a-z]/.test(pwd),
      met: false
    },
    {
      key: 'uppercase',
      label: 'Uppercase letter (A-Z)',
      test: (pwd: string) => /[A-Z]/.test(pwd),
      met: false
    },
    {
      key: 'number',
      label: 'Number (0-9)',
      test: (pwd: string) => /\d/.test(pwd),
      met: false
    },
    {
      key: 'special',
      label: 'Special character (@$!%*?&)',
      test: (pwd: string) => /[@$!%*?&]/.test(pwd),
      met: false
    }
  ], [])

  const strengthData = useMemo((): PasswordStrength => {
    // Update requirement status
    const updatedRequirements = requirements.map(req => ({
      ...req,
      met: req.test(password)
    }))

    const completedCount = updatedRequirements.filter(req => req.met).length
    const totalCount = requirements.length

    // Determine strength level
    let strengthLevel: PasswordStrength['strengthLevel'] = 'weak'
    if (completedCount >= 5) strengthLevel = 'very-strong'
    else if (completedCount >= 4) strengthLevel = 'strong'
    else if (completedCount >= 3) strengthLevel = 'medium'

    // Generate strength message
    let strengthMessage = 'Create a strong password'
    if (completedCount === 0) strengthMessage = 'Create a strong password'
    else if (completedCount <= 2) strengthMessage = 'Keep going! Add more requirements'
    else if (completedCount <= 4) strengthMessage = 'Almost there! Just a bit more'
    else if (completedCount === 5) strengthMessage = 'Perfect! Strong password'

    return {
      requirements: updatedRequirements,
      completedCount,
      totalCount,
      strengthMessage,
      strengthLevel
    }
  }, [password, requirements])

  return strengthData
}
