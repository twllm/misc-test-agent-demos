// Constants
const WORKING_TREE = "WORKING_TREE";
const STAGED_ONLY = "STAGED_ONLY";

// Function to test
const renderDiffRequest = (from: string, to: string) => {
  const start = [from];
  const end = (to === WORKING_TREE || to === STAGED_ONLY) ? [] : [to];
  const range = [...start, ...end].join("..");
  const cached = to === STAGED_ONLY ? ["--cached"] : [];
  return [range, ...cached];
}

describe("renderDiffRequest", () => {
  describe("commit-to-commit diffs", () => {
    test("should create range between two regular commits", () => {
      const result = renderDiffRequest("abc123", "def456");
      expect(result).toEqual(["abc123..def456"]);
    });

    test("should create range with HEAD reference", () => {
      const result = renderDiffRequest("HEAD~1", "HEAD");
      expect(result).toEqual(["HEAD~1..HEAD"]);
    });

    test("should create range with branch references", () => {
      const result = renderDiffRequest("origin/main", "feature-branch");
      expect(result).toEqual(["origin/main..feature-branch"]);
    });
  });

  describe("diff to working tree", () => {
    test("should omit end commit and exclude --cached flag", () => {
      const result = renderDiffRequest("abc123", WORKING_TREE);
      expect(result).toEqual(["abc123.."]);
    });

    test("should work with symbolic refs", () => {
      const result = renderDiffRequest("HEAD", WORKING_TREE);
      expect(result).toEqual(["HEAD.."]);
    });
  });

  describe("diff to staged changes", () => {
    test("should omit end commit and include --cached flag", () => {
      const result = renderDiffRequest("abc123", STAGED_ONLY);
      expect(result).toEqual(["abc123..", "--cached"]);
    });

    test("should work with symbolic refs", () => {
      const result = renderDiffRequest("HEAD", STAGED_ONLY);
      expect(result).toEqual(["HEAD..", "--cached"]);
    });
  });

  describe("edge cases", () => {
    test("should handle empty string as from parameter", () => {
      const result = renderDiffRequest("", "abc123");
      expect(result).toEqual(["..abc123"]);
    });

    test("should handle empty string as to parameter", () => {
      const result = renderDiffRequest("abc123", "");
      expect(result).toEqual(["abc123.."]);
    });

    test("should handle empty strings for both parameters", () => {
      const result = renderDiffRequest("", "");
      expect(result).toEqual([".."]);
    });

    test("should include --cached flag when from is empty and to is STAGED_ONLY", () => {
      const result = renderDiffRequest("", STAGED_ONLY);
      expect(result).toEqual(["..", "--cached"]);
    });
  });

  describe("conditional logic verification", () => {
    test("should verify all three branches of conditional logic", () => {
      // Branch 1: to === WORKING_TREE (empty end, no --cached)
      const workingTreeResult = renderDiffRequest("abc123", WORKING_TREE);
      expect(workingTreeResult).toEqual(["abc123.."]);
      expect(workingTreeResult.length).toBe(1);

      // Branch 2: to === STAGED_ONLY (empty end, with --cached)
      const stagedResult = renderDiffRequest("abc123", STAGED_ONLY);
      expect(stagedResult).toEqual(["abc123..", "--cached"]);
      expect(stagedResult.length).toBe(2);

      // Branch 3: regular commit (includes end, no --cached)
      const commitResult = renderDiffRequest("abc123", "def456");
      expect(commitResult).toEqual(["abc123..def456"]);
      expect(commitResult.length).toBe(1);
    });
  });
});
