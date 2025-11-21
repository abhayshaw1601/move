// Feature: ai-provenance-pro, Property 6: Visual Diff Color Coding

import { renderDiffHtml } from "../src/diff";

// For any two versions being compared, added lines should use the
// "added" class and removed lines should use the "removed" class.

describe("Property 6: Visual Diff Color Coding", () => {
  it("marks added and removed lines with appropriate CSS classes", () => {
    const oldText = ["line 1", "line 2", "line 3"].join("\n");
    const newText = ["line 1", "line 2 modified", "line 3", "line 4"].join("\n");

    const html = renderDiffHtml(oldText, newText, "file.txt");

    // Added line 4 should be marked as added
    expect(html).toContain("class=\"added\"");

    // The modified line should appear once as removed and once as added
    expect(html).toContain("class=\"removed\"");
  });
});
