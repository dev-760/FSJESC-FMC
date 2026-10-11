"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Paragraph, Text, YStack } from "tamagui";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";

/**
 * Gates the AMS shell behind an ADMINISTRATOR session on the landing app.
 *
 * The check hits `/api/admin/users` (proxied to landing). A 401/403 means the
 * visitor must sign in on the public site; once the shared session cookie is
 * present, the gate opens.
 */

type GateState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

function landingSignInUrl(): string {
  const landing = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ams = process.env.NEXT_PUBLIC_AMS_URL ?? "http://localhost:3001";
  const callback = encodeURIComponent(ams);
  return `${landing.replace(/\/$/, "")}/sign-in?callbackUrl=${callback}`;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function verify() {
      try {
        await api.users(controller.signal);
        if (!cancelled) setState({ status: "ready" });
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setState({ status: "unauthenticated" });
            return;
          }
          if (error.status === 403) {
            setState({ status: "forbidden" });
            return;
          }
          setState({ status: "error", message: error.message });
          return;
        }
        setState({
          status: "error",
          message: "Could not verify administrator access.",
        });
      }
    }

    void verify();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  if (state.status === "ready") {
    return <>{children}</>;
  }

  return (
    <YStack
      minHeight="100dvh"
      alignItems="center"
      justifyContent="center"
      padding="$6"
      backgroundColor="$canvas"
      gap="$4"
    >
      <YStack maxWidth={420} gap="$3" alignItems="flex-start" width="100%">
        <Text fontSize="$7" fontWeight="600" color="$foreground">
          Administration console
        </Text>
        {state.status === "loading" ? (
          <Paragraph color="$foregroundSecondary" size="$3">
            Checking administrator session…
          </Paragraph>
        ) : null}
        {state.status === "unauthenticated" ? (
          <>
            <Paragraph color="$foregroundSecondary" size="$3">
              Sign in with an administrator account on the public site, then return here. The
              session cookie is shared across the club apps.
            </Paragraph>
            <ButtonLink
              tag="a"
              href={landingSignInUrl()}
              variant="primary"
              style={{ textDecoration: "none" }}
            >
              Sign in as administrator
            </ButtonLink>
          </>
        ) : null}
        {state.status === "forbidden" ? (
          <Paragraph color="$foregroundSecondary" size="$3">
            This console requires the ADMINISTRATOR role. Your account is signed in but does not
            have that privilege.
          </Paragraph>
        ) : null}
        {state.status === "error" ? (
          <>
            <Paragraph color="$foregroundSecondary" size="$3">
              {state.message}
            </Paragraph>
            <Button variant="secondary" onPress={retry}>
              Retry
            </Button>
          </>
        ) : null}
      </YStack>
    </YStack>
  );
}
