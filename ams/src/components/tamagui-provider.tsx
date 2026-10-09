"use client";

import { TamaguiProvider } from "tamagui";
import config from "../../tamagui.config";

export function Provider({ children }: { children: React.ReactNode }) {
  return <TamaguiProvider config={config}>{children}</TamaguiProvider>;
}
