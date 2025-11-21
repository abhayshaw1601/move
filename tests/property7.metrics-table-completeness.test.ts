// Feature: ai-provenance-pro, Property 7: Metrics Table Completeness

import fc from "fast-check";
import { renderAuditReportHtml, type AuditReportInput } from "../src/audit";

describe("Property 7: Metrics Table Completeness", () => {
  it("includes all metrics for all versions in the HTML table", async () => {
    await fc.assert(
      fc.property(
        fc.record<AuditReportInput>({
          repoName: fc.string({ minLength: 1, maxLength: 20 }),
          trustScore: fc.integer({ min: 0, max: 1000 }),
          versions: fc.array(
            fc.record({
              versionId: fc.string({ minLength: 1, maxLength: 10 }),
              timestampMs: fc.integer({ min: 0, max: 2 ** 31 - 1 }),
              message: fc.string({ minLength: 1, maxLength: 30 }),
              metrics: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 8 }),
                fc.string({ minLength: 1, maxLength: 20 }),
              ),
              shardCount: fc.integer({ min: 0, max: 10 }),
              totalSizeBytes: fc.integer({ min: 0, max: 10_000_000 }),
              fileName: fc.string({ minLength: 1, maxLength: 20 }),
              oldText: fc.string(),
              newText: fc.string(),
            }),
            { minLength: 1, maxLength: 5 },
          ),
        }),
        (input) => {
          const html = renderAuditReportHtml(input);
          for (const v of input.versions) {
            expect(html).toContain(v.versionId);
            for (const [k, val] of Object.entries(v.metrics)) {
              expect(html).toContain(k);
              expect(html).toContain(val);
            }
          }
        },
      ),
    );
  });
});
