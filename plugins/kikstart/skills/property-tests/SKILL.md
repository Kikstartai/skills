---
name: property-tests
description: Read a source file and write the property tests it deserves (round trip, canonical form, idempotence, invariants, equivalence, monotonicity) with fast-check, then act on every counterexample. Use when asked to "add property tests", "fuzz this file", "write fast-check tests for X", "find edge cases in X", or to harden a parser, codec, normalizer or validator.
metadata:
  argument-hint: <file>
---

# Property tests

Given a file, find its properties, build generators for its real input domain, write one test per property, run them, and act on what they find.

An example test checks only the inputs its author thought of. A property test states a rule that holds for every input in a domain and lets a library generate the inputs, so the edge cases do not share the code's blind spots. The rule needs no expected output, only a relationship that must hold.

Use fast-check for TypeScript (Hypothesis for Python, proptest for Rust). Add it as a dev dependency of the package under test only, pinned to an exact version, so the published package gains no runtime dependency.

## 1. Read the file and its callers

List the exports, then grep the repo for how each one is called. Keep a candidate when it is:

- pure and in memory: no I/O, DOM, clock or randomness it does not take as an argument;
- fed input nobody chose by hand: a URL, a request body, stored JSON, a file, user text;
- one half of a pair: encode and decode, parse and print, `to*` and `from*`;
- a transformation that must keep something: normalize, sort, merge, plan, filter.

Drop code that renders, queries a database or waits; say so in the report and leave it to example or end-to-end tests.

## 2. Choose properties from how the code is used

For each candidate, find what its callers rely on. Do not fill a list: a rule no caller depends on is not worth a test.

| Kind           | Rule                                                       | Signal in the code                                                                          |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Round trip     | `decode(encode(x))` equals `x`                             | an encode/decode, parse/format or `to*`/`from*` pair                                        |
| Canonical form | `x` equals `y` exactly when `encode(x)` equals `encode(y)` | callers compare encoded strings, use them as cache or memo keys, or skip work when equal    |
| Idempotence    | `f(f(x))` equals `f(x)`                                    | a `normalize*`, a migration, a retry, or a result written back where it is read again       |
| Invariant      | `check(f(x))` is always true                               | a cap, a bound, an allow-list, "never throws", "every output key is a known key"            |
| Equivalence    | `fast(x)` equals `naive(x)`                                | two implementations of one thing: an index and a scan, a cache and a recompute, two sources |
| Monotonicity   | a bigger input never gives a smaller output                | counts, limits, filters that only narrow                                                    |

Write each property as one sentence naming the caller that depends on it, before any code. Example, for a URL codec: "url-sync compares encoded strings to skip writes, so equal queries must encode identically and different ones differently."

## 3. Build the generators

A property holds only over the right inputs. Over every value of a type almost any round trip fails; over what the code can actually receive it should not.

- **Valid inputs.** Build them from the same definitions the code validates against (schemas, field lists, enums, limits, constants), never from free strings. Inside each test, assert the input passes the code's own validator and is unchanged by its normalizer, so the generator cannot drift from what valid means.
- **Hostile inputs.** For anything that takes untrusted data, add a second generator for raw input: real keys mixed with junk, empty values, the format's own separators and markers, unicode, repeats, shuffled order. Use it for "never throws" and idempotence.
- **Edges.** Bias toward empty, one, the cap, the cap plus one, duplicates and the format's special characters.
- **Coverage.** Sample each generator once (about 2000 values) and confirm every branch you care about appears in a fair share. Fix the generator if a branch is rare or absent.

## 4. Write the tests

Put them in `<file>.test.ts` beside the source, one test per property, named after its rule. Follow the repo's test runner and house style.

```ts
const RUNS = Number(process.env.FC_RUNS ?? 100);

test("a valid query survives encode and decode", () => {
  fc.assert(
    fc.property(arbitraryQuery, (query) => {
      expect(decode(encode(query))).toEqual(query);
    }),
    { numRuns: RUNS },
  );
});
```

Default runs stay low so the file runs with every change; `FC_RUNS` raises them for a deep run. Raise the test timeout when `FC_RUNS` is set.

## 5. Run and classify every counterexample

Run the file at default runs, then once with `FC_RUNS=10000`. For each shrunk counterexample, decide which it is:

1. **A valid input the code gets wrong.** A real bug. Add a plain example test pinning the counterexample, fix the code minimally and backward compatibly, and keep the generator wide.
2. **An input the code's validation already rejects.** The generator is too wide. Tighten the generator, never the rule.
3. **A valid input the code cannot handle by design.** Steer the generator around it, record why where the generator is defined, and report whether the validator should reject it instead.

Never weaken a property to make it pass.

## 6. Verify and report

Run the repo's typecheck, lint and test commands and format the files you touched. Do not commit.

Report:

- the candidates kept and dropped, with the reason;
- each property as its one-sentence rule and the caller behind it;
- run time per property at default runs and at `FC_RUNS=10000`;
- every counterexample with its class and what you did;
- the verify results, with any failure pasted verbatim.
