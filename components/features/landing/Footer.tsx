import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="md:col-span-2 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center md:items-end mb-4 sm:mb-4 justify-center md:justify-start">
              <Image
                src="/images/brand/app-icon.png"
                alt="BuildReady Icon"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-0 sm:mr-3"
              />
              <h3 className="text-xl sm:text-2xl font-bold text-orange-400 leading-none">BuildReady</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-400 mb-4 max-w-md mx-auto md:mx-0">
              The premier platform connecting homeowners with verified contractors for 
              successful project partnerships and exceptional construction outcomes.
            </p>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Platform Solutions</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/projects" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Project Management</Link></li>
              <li><Link href="/contractors" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Contractor Network</Link></li>
              <li><Link href="/proposals" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Proposal System</Link></li>
              <li><Link href="/analytics" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Project Analytics</Link></li>
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Professional Access</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/login" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Create Account</Link></li>
              <li><Link href="/contact" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Contact Support</Link></li>
              <li><Link href="/enterprise" className="text-sm sm:text-base text-gray-400 hover:text-gray-200 transition-colors">Enterprise Solutions</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; 2024 <span className="text-orange-400">BuildReady</span>. All rights reserved. | Professional Construction Partnership Platform</p>
        </div>
      </div>
    </footer>
  );
}
