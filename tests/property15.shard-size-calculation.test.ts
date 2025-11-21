// Feature: ai-provenance-pro, Property 15: Shard Size Calculation

import fc from "fast-check";
import { sumShardSizes } from "../src/storefront";

describe("Property 15: Shard Size Calculation", () => {
  it("sums individual shard sizes to the total size", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 10_000_000 })), (sizes) => {
        const expected = sizes.reduce((a, b) => a + b, 0);
        const got = sumShardSizes(sizes);
        expect(got).toBe(expected);
      }),
    );
  });
});
