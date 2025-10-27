import type { Metadata } from "next";
import "../index.css";

import Header from "@/components/header";
import Providers from "@/components/providers";
import { geistMono, geistSans } from "@/fonts";

export const metadata: Metadata = {
	title: "smart-apps",
	description: "smart-apps"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers>
					<div className='grid h-svh grid-rows-[auto_1fr]'>
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
