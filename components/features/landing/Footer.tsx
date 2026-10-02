import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-[#050505] text-gray-900 dark:text-white py-12 sm:py-16 lg:py-20 border-t border-gray-200 dark:border-white/5 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-16 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/images/brand/favicon_structra.png"
                alt="Structra Icon"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Structra</h3>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-500 mb-8 max-w-md font-medium leading-relaxed">
              The definitive ecosystem for high-fidelity construction partnerships. Bridging visionary project owners with elite master contractors.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-black mb-6 text-gray-900 dark:text-white uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="/projects" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Project Management</Link></li>
              <li><Link href="/contractors" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Contractor Network</Link></li>
              <li><Link href="/proposals" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Proposal System</Link></li>
              <li><Link href="/analytics" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Project Analytics</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-black mb-6 text-gray-900 dark:text-white uppercase tracking-[0.2em]">Professional</h4>
            <ul className="space-y-4">
              <li><Link href="/login" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Sign In</Link></li>
              <li><Link href="/register" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Create Account</Link></li>
              <li><Link href="/contact" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Contact Support</Link></li>
              <li><Link href="/enterprise" className="text-base text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors font-medium">Enterprise Solutions</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 flex flex-col gap-4 md:flex-row justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none text-center md:text-left">
            &copy; 2025 <span className="text-orange-600">Structra</span>. The Standard for High-Fidelity Construction.
          </p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Network Stable</span>
             </div>
             <Link href="/privacy" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
             <Link href="/terms" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
