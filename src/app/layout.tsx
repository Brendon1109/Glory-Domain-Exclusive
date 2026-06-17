import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://glory-domain-exclusive.vercel.app";
const DESCRIPTION =
  "Glory Domain is the online home of Pastor Sethwatchman's ministry — live Bible teachings and prayer calls, an embedded KJV, World English and Shona Bible with a daily verse and daily word, and curated praise & worship.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Glory Domain — Bible teachings, prayer & worship",
    template: "%s · Glory Domain",
  },
  description: DESCRIPTION,
  applicationName: "Glory Domain",
  keywords: [
    "Glory Domain",
    "Pastor Sethwatchman",
    "online church",
    "Bible teachings",
    "Bible study online",
    "prayer group",
    "Shona Bible",
    "Zimbabwe church",
    "daily Bible verse",
    "daily devotional",
    "praise and worship",
    "Christian app",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Glory Domain",
    statusBarStyle: "default",
  },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "Glory Domain",
    title: "Glory Domain — Bible teachings, prayer & worship",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glory Domain — Bible teachings, prayer & worship",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1a17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Church",
      "@id": `${SITE_URL}/#church`,
      name: "Glory Domain",
      description: DESCRIPTION,
      url: SITE_URL,
      founder: { "@type": "Person", name: "Pastor Sethwatchman" },
      areaServed: "Zimbabwe",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Glory Domain",
      url: SITE_URL,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#church` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
