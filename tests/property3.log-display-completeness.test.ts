// Feature: ai-provenance-pro, Property 3: Log Display Completeness

import fc from "fast-check";
import { renderLog, type CommitView } from "../src/log";

// Property 3: For any commit, the log output should contain the
// commit ID, author, timestamp, message, and all stored metrics.

describe("Property 3: Log Display Completeness", () => {
  it("includes all key fields for each commit", async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record<CommitView>({
            versionId: fc.hexaString({ minLength: 4, maxLength: 16 }),
            author: fc.hexaString({ minLength: 4, maxLength: 16 }),
            timestampMs: fc.integer({ min: 0, max: 2 ** 31 - 1 }),
            message: fc.string({ minLength: 1, maxLength: 40 }),
            repoName: fc.string({ minLength: 1, maxLength: 20 }),
            walrusRootBlobId: fc.string({ minLength: 1, maxLength: 40 }),
            metrics: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
            shardCount: fc.integer({ min: 0, max: 10 }),
            totalSizeBytes: fc.integer({ min: 0, max: 10_000_000 }),
            dependencies: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
          }),
          { minLength: 1, maxLength: 3 },
        ),
        (commits) => {
          const output = renderLog(commits);
          for (const c of commits) {
            expect(output).toContain(c.versionId);
            expect(output).toContain(c.author);
            expect(output).toContain(c.message);
            for (const [k, v] of Object.entries(c.metrics)) {
              expect(output).toContain(k);
              expect(output).toContain(v);
            }
          }
        },
      ),
    );
  });
});
