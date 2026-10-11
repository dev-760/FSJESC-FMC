import { afterEach, describe, expect, it } from "vitest";
import {
  amsUrl,
  isSimulatorSameOrigin,
  landingUrl,
  safeCallbackUrl,
  simulatorUrl,
} from "@fsjesc/config/app-urls";

describe("app URLs", () => {
  const originalSimulator = process.env.NEXT_PUBLIC_SIMULATOR_URL;
  const originalApp = process.env.NEXT_PUBLIC_APP_URL;
  const originalAms = process.env.NEXT_PUBLIC_AMS_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SIMULATOR_URL = originalSimulator;
    process.env.NEXT_PUBLIC_APP_URL = originalApp;
    process.env.NEXT_PUBLIC_AMS_URL = originalAms;
    if (originalSimulator === undefined) delete process.env.NEXT_PUBLIC_SIMULATOR_URL;
    if (originalApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    if (originalAms === undefined) delete process.env.NEXT_PUBLIC_AMS_URL;
  });

  describe("simulatorUrl", () => {
    it("defaults to the local development port when unset", () => {
      delete process.env.NEXT_PUBLIC_SIMULATOR_URL;
      expect(simulatorUrl("market")).toBe("http://localhost:3002/market");
      expect(simulatorUrl()).toBe("http://localhost:3002");
    });

    it("tolerates a missing or duplicated slash", () => {
      process.env.NEXT_PUBLIC_SIMULATOR_URL = "https://sim.fsjes.ma/";
      expect(simulatorUrl("/market")).toBe("https://sim.fsjes.ma/market");
      expect(simulatorUrl("")).toBe("https://sim.fsjes.ma");
      expect(simulatorUrl("/")).toBe("https://sim.fsjes.ma");
    });

    it("stays relative when the simulator shares this origin", () => {
      // A reverse-proxy deployment sets no URL: the apps are one origin and
      // relative links keep client-side navigation working.
      delete process.env.NEXT_PUBLIC_SIMULATOR_URL;
      expect(isSimulatorSameOrigin()).toBe(false); // safe default

      process.env.NEXT_PUBLIC_SIMULATOR_URL = "";
      expect(isSimulatorSameOrigin()).toBe(false);

      // An explicit absolute origin is the split-origin (dev) case.
      process.env.NEXT_PUBLIC_SIMULATOR_URL = "http://localhost:3002";
      expect(isSimulatorSameOrigin()).toBe(false);
      expect(simulatorUrl("market")).toBe("http://localhost:3002/market");
    });
  });

  describe("landingUrl", () => {
    it("defaults to the local development port when unset", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(landingUrl("education")).toBe("http://localhost:3000/education");
      expect(landingUrl()).toBe("http://localhost:3000");
    });

    it("honours a configured deployment origin", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://fsjesc-fmc.vercel.app/";
      expect(landingUrl("/team")).toBe("https://fsjesc-fmc.vercel.app/team");
    });
  });

  describe("amsUrl", () => {
    it("defaults to the local administration port", () => {
      delete process.env.NEXT_PUBLIC_AMS_URL;
      expect(amsUrl()).toBe("http://localhost:3001");
      expect(amsUrl("/users")).toBe("http://localhost:3001/users");
    });
  });

  describe("safeCallbackUrl", () => {
    it("allows relative paths and known app origins", () => {
      expect(safeCallbackUrl("/dashboard", "/")).toBe("/dashboard");
      expect(safeCallbackUrl("http://localhost:3001", "/")).toBe("http://localhost:3001/");
      expect(safeCallbackUrl("http://localhost:3002/market", "/")).toBe(
        "http://localhost:3002/market",
      );
    });

    it("rejects open redirects", () => {
      expect(safeCallbackUrl("https://evil.example/phish", "/simulator")).toBe("/simulator");
      expect(safeCallbackUrl("//evil.example", "/simulator")).toBe("/simulator");
    });
  });
});