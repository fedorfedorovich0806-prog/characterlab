"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const THEMES: Record<string, string> = {
  "": "221 83% 53%",
  emerald: "160 84% 39%",
  violet: "263 70% 58%",
  rose: "346 77% 50%",
  amber: "38 92% 50%",
  cyan: "192 91% 36%",
  pink: "330 81% 60%",
  lime: "85 78% 40%",
};

function ThemeApplier() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });
  React.useEffect(() => {
    const theme = data?.user?.theme || "";
    const primary = THEMES[theme] || THEMES[""];
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--ring", primary);
  }, [data?.user?.theme]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={qc}>
        <ThemeApplier />
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
