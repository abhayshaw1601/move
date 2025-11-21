// Feature: ai-provenance-pro, Property 4: Percentage Formatting

import fc from "fast-check";
import { formatMetricValue } from "../src/log";

// For any metric value representing a percentage, the display should
// append a "%" suffix.

describe("Property 4: Percentage Formatting", () => {
  it("adds % for accuracy-like metrics when missing", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const formatted = formatMetricValue("Accuracy", value);
        if (value.trim().endsWith("%")) {
          expect(formatted).toBe(value);
        } else {
          expect(formatted.endsWith("%")).toBe(true);
        }
      }),
    );
  });
});
