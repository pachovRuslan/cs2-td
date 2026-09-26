"use client";

import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "@/src/store";

/**
 * Обёртка Redux для Next.js App Router.
 *
 * В Next.js 16 App Router серверные компоненты не могут
 * создавать store напрямую (нет сериллизуемости).
 * Поэтому оборачиваем в client component.
 */

export default function ReduxProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <Provider store={store}>{children}</Provider>;
}