import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@carbon/styles/css/styles.css";
import "./globals.css";
import "./theme.css";
import { AppProvider } from "@/components/AppProvider";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "DRISHTI",
  description: "DRISHTI — offset-well intelligence beside eRTMAC (prototype, representative data)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="cds--g100" suppressHydrationWarning>
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
