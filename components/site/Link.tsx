"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

export function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink suppressHydrationWarning {...props} />;
}

export function A(props: ComponentProps<"a">) {
  return <a suppressHydrationWarning {...props} />;
}
