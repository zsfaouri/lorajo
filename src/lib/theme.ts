import type { ThemeTokens } from "@/types/cms";
import type { CSSProperties } from "react";

export const defaultThemeTokens: ThemeTokens = {
  colors: {
    softWhite: "#f2faf6",
    black: "#0a0a0a",
    heritageGreen: "#01963c",
    lightNeutral: "#f0f0f0",
    stone: "#c4b9a3",
    parchment: "#f7f3eb",
    terracotta: "#b8704a",
    olive: "#6b7c4e",
    jasmine: "#f5f0d0",
    stoneLight: "#ede8df",
  },
  typography: {
    fontSans: "Avenir-lt-w01_35-light1475496, Avenir, Avenir Next, Inter, sans-serif",
    headingWeight: "300",
    bodyWeight: "300",
    uppercaseTracking: "0.16em",
  },
  spacing: {
    sectionSmall: "4rem",
    sectionMedium: "7rem",
    sectionLarge: "10rem",
    pageX: "clamp(1rem, 4vw, 4rem)",
  },
  radii: {
    card: "0.375rem",
    media: "0.25rem",
    button: "999px",
  },
};

const cssTokenNames: Record<string, string> = {
  softWhite: "--color-soft-white",
  black: "--color-black",
  heritageGreen: "--color-heritage-green",
  lightNeutral: "--color-light-neutral",
  stone: "--color-stone",
  parchment: "--color-parchment",
  terracotta: "--color-terracotta",
  olive: "--color-olive",
  jasmine: "--color-jasmine",
  stoneLight: "--color-stone-light",
  fontSans: "--font-lora-sans",
  headingWeight: "--font-heading-weight",
  bodyWeight: "--font-body-weight",
  uppercaseTracking: "--tracking-uppercase",
  sectionSmall: "--space-section-small",
  sectionMedium: "--space-section-medium",
  sectionLarge: "--space-section-large",
  pageX: "--space-page-x",
  card: "--radius-card",
  media: "--radius-media",
  button: "--radius-button",
};

export function themeToStyle(tokens: ThemeTokens): CSSProperties {
  const style: Record<string, string> = {};

  for (const group of Object.values(tokens)) {
    for (const [key, value] of Object.entries(group)) {
      const cssName = cssTokenNames[key];
      if (cssName) style[cssName] = value;
    }
  }

  return style as CSSProperties;
}
