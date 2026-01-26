/** @vitest-environment jsdom */
/**
 * [SNAPSHOT] Logo Component
 * 
 * Purpose:
 * - Detect unintended visual changes in the main logo.
 * - This is a stable component, perfect for snapshots.
 */

import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Logo from "../components/Logo";

describe("[SNAPSHOT] Logo Component", () => {
  it("should match current snapshot", () => {
    const { asFragment } = render(<Logo />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("should match snapshot with custom className", () => {
    const { asFragment } = render(<Logo className="custom-test-logo" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
