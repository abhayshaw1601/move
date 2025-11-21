// Feature: ai-provenance-pro, Property 5: Log Filtering Accuracy

import fc from "fast-check";
import { renderLog, type CommitView } from "../src/log";

// For any repository name filter, all commits in the rendered output
// should belong to repositories matching that name.

describe("Property 5: Log Filtering Accuracy", () => {
  it("only includes commits with matching repoName when filter is set", async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record<CommitView>({
            versionId: fc.hexaString({ minLength: 4, maxLength: 16 }),
            author: fc.hexaString({ minLength: 4, maxLength: 16 }),
            timestampMs: fc.integer({ min: 0, max: 2 ** 31 - 1 }),
            message: fc.string({ minLength: 1, maxLength: 40 }),
            repoName: fc.string({ minLength: 1, maxLength: 10 }),
            walrusRootBlobId: fc.string({ minLength: 1, maxLength: 40 }),
            metrics: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
            shardCount: fc.integer({ min: 0, max: 10 }),
            totalSizeBytes: fc.integer({ min: 0, max: 10_000_000 }),
            dependencies: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        fc.string({ minLength: 1, maxLength: 10 }),
        (commits, filterName) => {
          const output = renderLog(commits, filterName);
          for (const c of commits) {
            if (c.repoName === filterName) {
              expect(output).toContain(c.versionId);
            } else {
              if (output.includes(c.versionId)) {
                // If a non-matching commit ID appears, it's a failure.
                throw new Error("Non-matching commit appeared in filtered output");
              }
            }
          }
        },
      ),
    );
  });
});
