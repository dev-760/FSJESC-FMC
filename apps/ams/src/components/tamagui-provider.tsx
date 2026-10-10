"use client";

import { TamaguiProvider, type TamaguiProviderProps } from "tamagui";
import config from "../../tamagui.config";

/**
 * Tamagui provider.
 *
 * `defaultTheme` is pinned explicitly rather than inherited: without it the
 * provider falls back to `light`, which produced a white administration shell
 * around dark components.
 */
export function Provider({ children, ...rest }: Omit<TamaguiProviderProps, "config">) {
  return (
    <TamaguiProvider config={config} defaultTheme="dark" {...rest}>
      {children}
    </TamaguiProvider>
  );
}