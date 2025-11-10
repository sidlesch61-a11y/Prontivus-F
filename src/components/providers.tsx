"use client";

import React from "react";
import { AuthProvider, ThemeProvider } from "@/contexts";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlags";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<FeatureFlagsProvider>
				<AuthProvider>
					{children}
					<Toaster position="top-right" richColors />
				</AuthProvider>
			</FeatureFlagsProvider>
		</ThemeProvider>
	);
}


