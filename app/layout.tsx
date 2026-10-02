import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { ToastProvider } from "@/components/providers/toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Structra - Contractor & Homeowner Platform",
  description: "Connect with trusted contractors and homeowners for your construction projects",
  icons: {
    icon: "/images/brand/favicon_structra.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          id="structra-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'theme';
                  var theme = localStorage.getItem(storageKey);
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || ((!theme || theme === 'system') && supportDarkMode);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}

                try {
                  var originalError = console.error;
                  console.error = function() {
                    var args = Array.prototype.slice.call(arguments);
                    for (var i = 0; i < args.length; i++) {
                      if (typeof args[i] === 'string' && (args[i].indexOf('bis_skin_checked') !== -1 || args[i].indexOf('cz-shortcut-listen') !== -1)) {
                        return;
                      }
                    }
                    return originalError.apply(console, args);
                  };

                  var extAttrs = ['bis_skin_checked', 'cz-shortcut-listen', 'data-gr-ext-installed', 'data-new-gr-c-s-check-loaded'];
                  function cleanNode(node) {
                    if (node && node.removeAttribute) {
                      for (var i = 0; i < extAttrs.length; i++) {
                        if (node.hasAttribute(extAttrs[i])) {
                          node.removeAttribute(extAttrs[i]);
                        }
                      }
                    }
                  }
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        cleanNode(m.target);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n.nodeType === 1) {
                            cleanNode(n);
                            if (n.querySelectorAll) {
                              var nested = n.querySelectorAll('[bis_skin_checked], [cz-shortcut-listen]');
                              for (var k = 0; k < nested.length; k++) {
                                cleanNode(nested[k]);
                              }
                            }
                          }
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: extAttrs
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            <AuthProvider>
              {children}
              <ToastProvider />
            </AuthProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
