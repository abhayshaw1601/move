// Feature: ai-provenance-pro, Property 14: Trust Score Color Coding

import fc from "fast-check";
import { colorTrustScore } from "../src/storefront";

describe("Property 14: Trust Score Color Coding", () => {
  it("uses green for scores >= 50 and red for scores < 50", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (score) => {
        const colored = colorTrustScore(score);
        const green = "\x1b[32m";
        const red = "\x1b[31m";
        if (score >= 50) {
          expect(colored.startsWith(green)).toBe(true);
        } else {
          expect(colored.startsWith(red)).toBe(true);
        }
      }),
    );
  });
});
