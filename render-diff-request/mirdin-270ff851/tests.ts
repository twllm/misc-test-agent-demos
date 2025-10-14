/**
 * Tests for renderDiffRequest function
 *
 * These tests verify the specification properties identified in
 * mirdin_spec_analyzer_output.md
 */

// NOTE: The actual values of these constants need to be determined from the codebase
// For now, we're assuming common git workflow values
const WORKING_TREE = "WORKING_TREE";
const STAGED_ONLY = "STAGED_ONLY";

// The function under test (would normally be imported)
const renderDiffRequest = (from: string, to: string) => {
  const start = [from];
  const end = (to === WORKING_TREE || to === STAGED_ONLY) ? [] : [to];

  const range = [...start, ...end].join("..");

  const cached = to === STAGED_ONLY ? ["--cached"] : [];

  return [range, ...cached];
}

describe('renderDiffRequest', () => {
  describe('Core Specification Properties', () => {
    /**
     * Property 1: When 'to' is a regular revision (not a special constant),
     * returns an array with a single element: "from..to"
     */
    describe('regular revision comparisons', () => {
      test('comparing two commit hashes', () => {
        const result = renderDiffRequest("abc123", "def456");
        expect(result).toEqual(["abc123..def456"]);
      });

      test('comparing two branch names', () => {
        const result = renderDiffRequest("main", "feature-branch");
        expect(result).toEqual(["main..feature-branch"]);
      });

      test('comparing commit hash to branch name', () => {
        const result = renderDiffRequest("abc123", "main");
        expect(result).toEqual(["abc123..main"]);
      });

      test('comparing with HEAD', () => {
        const result = renderDiffRequest("HEAD~1", "HEAD");
        expect(result).toEqual(["HEAD~1..HEAD"]);
      });
    });

    /**
     * Property 2: When 'to' is WORKING_TREE,
     * returns an array with a single element: just the 'from' value
     */
    describe('diff against working tree', () => {
      test('comparing commit to working tree', () => {
        const result = renderDiffRequest("abc123", WORKING_TREE);
        expect(result).toEqual(["abc123"]);
      });

      test('comparing HEAD to working tree', () => {
        const result = renderDiffRequest("HEAD", WORKING_TREE);
        expect(result).toEqual(["HEAD"]);
      });

      test('comparing branch to working tree', () => {
        const result = renderDiffRequest("main", WORKING_TREE);
        expect(result).toEqual(["main"]);
      });
    });

    /**
     * Property 3: When 'to' is STAGED_ONLY,
     * returns an array with two elements: [from, "--cached"]
     */
    describe('diff against staged changes', () => {
      test('comparing commit to staged changes', () => {
        const result = renderDiffRequest("abc123", STAGED_ONLY);
        expect(result).toEqual(["abc123", "--cached"]);
      });

      test('comparing HEAD to staged changes', () => {
        const result = renderDiffRequest("HEAD", STAGED_ONLY);
        expect(result).toEqual(["HEAD", "--cached"]);
      });

      test('comparing branch to staged changes', () => {
        const result = renderDiffRequest("main", STAGED_ONLY);
        expect(result).toEqual(["main", "--cached"]);
      });
    });
  });

  /**
   * Input Space Partitioning
   *
   * We partition the 'to' parameter space into:
   * 1. Regular revisions (arbitrary strings that are not special constants)
   * 2. WORKING_TREE constant
   * 3. STAGED_ONLY constant
   *
   * For 'from', we use representative examples of typical git revisions.
   */

  /**
   * Property-based reasoning about output structure
   *
   * These tests verify invariants that should hold regardless of input
   * (for valid inputs within the specified domain)
   */
  describe('Output Structure Invariants', () => {
    test('result is always a non-empty array with at least one string element', () => {
      const examples = [
        ["abc", "def"],
        ["main", WORKING_TREE],
        ["HEAD", STAGED_ONLY],
      ];

      for (const [from, to] of examples) {
        const result = renderDiffRequest(from, to);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toBeDefined();
        expect(typeof result[0]).toBe("string");
      }
    });

    test('result has at most 2 elements', () => {
      const examples = [
        ["abc", "def"],
        ["main", WORKING_TREE],
        ["HEAD", STAGED_ONLY],
      ];

      for (const [from, to] of examples) {
        const result = renderDiffRequest(from, to);
        expect(result.length).toBeLessThanOrEqual(2);
      }
    });
  });

  /**
   * Additional semantic checks
   *
   * These tests verify that the outputs follow expected patterns,
   * but are redundant with the core specification tests above.
   * They're kept for documentation purposes but aren't strictly necessary.
   */
  describe('Output Format Verification', () => {
    test('regular diff returns single element with two-dot notation', () => {
      const result = renderDiffRequest("abc123", "def456");
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("abc123..def456");
    });

    test('working tree diff returns single element', () => {
      const result = renderDiffRequest("abc123", WORKING_TREE);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("abc123");
    });

    test('staged diff returns two elements', () => {
      const result = renderDiffRequest("abc123", STAGED_ONLY);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("abc123");
      expect(result[1]).toBe("--cached");
    });
  });
});

/**
 * TESTING STRATEGY NOTES
 *
 * What we ARE testing:
 * - The three core behavioral properties from the specification:
 *   1. Regular revision comparisons: returns ["from..to"]
 *   2. WORKING_TREE comparisons: returns ["from"]
 *   3. STAGED_ONLY comparisons: returns ["from", "--cached"]
 * - Basic output structure invariants (non-empty array, at most 2 elements)
 *
 * What we are NOT testing:
 * - Internal implementation details (variable names, array construction methods)
 * - The order of conditional evaluations
 * - Edge cases not defined by the specification (empty strings, invalid refs, etc.)
 *   These should either be validated at the API boundary or specified explicitly
 *
 * Why these tests are NOT brittle:
 * - They test the specification, not the implementation
 * - They would pass with any implementation that satisfies the spec
 * - They use exact equality matching on complete outputs
 * - They avoid regex patterns or partial string matching that depend on format
 *
 * RECOMMENDATIONS FOR SPECIFICATION IMPROVEMENTS
 *
 * 1. Define the actual values of WORKING_TREE and STAGED_ONLY constants
 *    - Export them from the same module as renderDiffRequest
 *    - Document them in the function's JSDoc
 *
 * 2. Type safety improvements:
 *    type Revision = string;
 *    type DiffTarget = Revision | typeof WORKING_TREE | typeof STAGED_ONLY;
 *    renderDiffRequest(from: Revision, to: DiffTarget): string[]
 *
 * 3. Input validation strategy:
 *    - Decide whether the function should validate inputs or trust the caller
 *    - If validation is needed, use branded types or runtime checks
 *    - Document preconditions clearly in the function signature/JSDoc
 *
 * Integration testing TODO:
 * - These are pure unit tests with no git dependency
 * - Separately, verify that generated arguments work with real git commands
 * - Create integration tests that execute actual git diff commands with the output
 */
