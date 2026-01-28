"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TermsDialogProps {
  children: React.ReactNode;
}

export function TermsDialog({ children }: TermsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read and accept our terms of service to continue with your registration.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-6 text-sm text-gray-700">
            <section>
              <h3 className="font-semibold text-base mb-3">1. Acceptance of Terms</h3>
              <p>
                By accessing and using Structra (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">2. Description of Service</h3>
              <p>
                Structra is a platform that connects homeowners with qualified contractors for construction and home improvement projects. We facilitate project management, communication, and payment processing between users.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">3. User Accounts</h3>
              <p>
                To access certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">4. User Responsibilities</h3>
              <p>
                Users are responsible for providing accurate information, maintaining the security of their accounts, and complying with all applicable laws and regulations. Contractors must maintain proper licensing and insurance as required by their jurisdiction.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">5. Project Management</h3>
              <p>
                Structra facilitates connections between users but is not responsible for the quality of work performed by contractors. All project agreements are between the homeowner and contractor directly. We provide tools for project management but do not guarantee project outcomes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">6. Payment Processing</h3>
              <p>
                We may facilitate payment processing for projects, but all payment disputes must be resolved between the parties involved. Structra is not responsible for payment issues or disputes between users.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">7. Prohibited Uses</h3>
              <p>
                You may not use our Service for any unlawful purpose or to solicit others to perform unlawful acts. You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">8. Content and Intellectual Property</h3>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Structra and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">9. Privacy Policy</h3>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">10. Termination</h3>
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">11. Disclaimer of Warranties</h3>
              <p>
                The information on this Service is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, Structra excludes all representations, warranties, conditions and terms relating to our Service and the use of this Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">12. Limitation of Liability</h3>
              <p>
                In no event shall Structra, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">13. Governing Law</h3>
              <p>
                These Terms shall be interpreted and governed by the laws of Canada, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">14. Changes to Terms</h3>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">15. Contact Information</h3>
              <p>
                If you have any questions about these Terms of Service, please contact us at support@structra.ca or through our contact form on the website.
              </p>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
