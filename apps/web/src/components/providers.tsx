"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import NextTopLoader from "nextjs-toploader";

import { queryClient } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			disableTransitionOnChange
			enableSystem
		>
			<QueryClientProvider client={queryClient}>
				<NextTopLoader
					color='var(--primary)'
					easing='ease'
					showSpinner={false}
				/>
				{children}
				<ReactQueryDevtools />
			</QueryClientProvider>
			<Toaster
				position='top-center'
				richColors
			/>
		</ThemeProvider>
	);
}
