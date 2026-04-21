'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, FileText } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            Please read these terms carefully before using BuildReady
          </p>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link href="/register">
            <Button variant="outline" className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign Up
            </Button>
          </Link>
        </div>

        {/* Terms Content */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-semibold text-gray-800">
              <FileText className="h-6 w-6 mr-3" />
              Terms of Service
            </CardTitle>
            <CardDescription>
              Last updated: January 2024
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using BuildReady, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h3>
              <p className="text-gray-600 leading-relaxed">
                BuildReady is a platform that connects homeowners with contractors for construction and renovation projects. 
                We provide tools for project management, communication, and payment processing.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h3>
              <div className="text-gray-600 leading-relaxed space-y-2">
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
                <p>You are responsible for safeguarding the password and for all activities that occur under your account.</p>
                <p>You agree not to disclose your password to any third party.</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4. User Responsibilities</h3>
              <div className="text-gray-600 leading-relaxed">
                <p className="mb-2">As a user of BuildReady, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the confidentiality of your account</li>
                  <li>Use the service in compliance with all applicable laws</li>
                  <li>Respect other users and maintain professional conduct</li>
                  <li>Not engage in fraudulent or misleading activities</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5. Payment Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                Payment processing is handled through secure third-party providers. BuildReady may charge service fees 
                for certain transactions. All fees will be clearly disclosed before any transaction is completed.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6. Privacy Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy, 
                which is incorporated into these Terms by reference.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7. Limitation of Liability</h3>
              <p className="text-gray-600 leading-relaxed">
                BuildReady shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8. Termination</h3>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
                including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10. Contact Information</h3>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
                <br />
                Email: {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                <br />
                Phone: {process.env.NEXT_PUBLIC_SUPPORT_PHONE}
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <Link href="/register">
            <Button className="bg-gray-900 hover:bg-black text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              I Agree to Terms - Continue to Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}