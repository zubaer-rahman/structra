'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'

export default function SessionPersistenceTest() {
  const { user, loading } = useAuth()
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)

  const testSessionPersistence = async () => {
    setTesting(true)
    setTestResult('Testing session persistence...')
    const supabase = createClient()
    
    try {
      // Test 1: Check current session
      const { data: { session }, error } = await supabase.auth.getSession()
      setTestResult(prev => prev + `\n✓ Session check: ${session ? 'ACTIVE' : 'NONE'}`)
      
      if (error) {
        setTestResult(prev => prev + `\n❌ Session error: ${error.message}`)
      }
      
      // Test 2: Check user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      setTestResult(prev => prev + `\n✓ User check: ${user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED'}`)
      
      if (userError) {
        setTestResult(prev => prev + `\n❌ User error: ${userError.message}`)
      }
      
      setTestResult(prev => prev + '\n\n🎉 Session test completed!')
      
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Test failed: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  const handleClearSession = async () => {
    setTesting(true)
    setTestResult('Clearing session...')
    const supabase = createClient()
    
    try {
      // Clear localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Sign out
      await supabase.auth.signOut()
      setTestResult('Session cleared successfully! You should be redirected to sign in.')
      // Force page reload to trigger redirect
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setTestResult(`Error clearing session: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">Loading session test...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Session Persistence Test</CardTitle>
        <CardDescription>
          Test the session persistence improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Current Status:</strong>
          <div className="mt-1 p-2 bg-gray-100 rounded">
            User: {user ? '✓ Logged in' : '✗ Not logged in'}<br/>
            Session: {user ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testSessionPersistence}
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Session Persistence'}
          </Button>
          
          <Button 
            onClick={handleClearSession}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            Clear Session (Test Recovery)
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            disabled={testing}
            variant="secondary"
            className="w-full"
          >
            Refresh Page (Test Persistence)
          </Button>
        </div>
        
        {testResult && (
          <div className="text-xs bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p><strong>How to test:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Sign in to your account</li>
            <li>Click &quot;Test Session Persistence&quot;</li>
            <li>Try &quot;Refresh Page&quot; - you should stay logged in</li>
            <li>Use &quot;Clear Session&quot; to test recovery</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}