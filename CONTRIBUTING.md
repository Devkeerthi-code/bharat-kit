# Contributing to bharat-kit

Thanks for helping. bharat-kit is small on purpose, so most contributions are a fix to an existing rule, a missing state code, or a new identifier format with a public source.

## Set up

```sh
nvm use          # Node 22, from .nvmrc
npm install
npm test
```

`npm run docs:dev` starts the docs site. It imports the library source directly, so your change shows up in the playgrounds as you save.

## What a change needs

1. **A source.** Every rule (a length, a character class, a check digit, a code table) needs a link to where it comes from. Put the link in the module's docs page and in the README's Sources table.
2. **Tests.** Coverage is enforced at 100% of lines, branches, functions and statements. Anything that computes (a checksum, a split, an amount) also needs a fast-check property.
3. **Error reasons.** Add a stable `reason` code to the module's error union and a plain-English `message`. A message should say what to fix, not only that something is wrong.
4. **A size budget.** A new entry point needs a line in `.size-limit.json`. If an existing budget has to grow, say why in the pull request.
5. **A changeset.** Run `npx changeset` and describe the change the way a user would read it in the changelog.

Before opening a pull request, run:

```sh
npm run ci
```

It runs lint, typecheck, tests with coverage, the build, a smoke test of the built package, size limits and publint, which is the same set CI runs.

## Adding a new identifier

- Add `src/<name>.ts` with `normalize…`, `validate…`, `isValid…` and, where the format has parts, `parse…`.
- Export it from `src/index.ts`, and add the entry to `tsup.config.ts`, the `exports` map in `package.json`, `scripts/measure-sizes.mjs` and `.size-limit.json`.
- Add a docs page under `docs/`, an entry in `docs/.vitepress/theme/data/modules.ts` and a playground in `playgrounds.ts`.

## Demo data only

Use invented values in tests, docs, issues and pull requests. Never paste a real Aadhaar, PAN, GSTIN, phone number or bank detail, even your own. A value that happens to pass a checksum is still demo data, and is labelled as such.

## Commit messages

Use conventional commits: `feat(pan): …`, `fix(gstin): …`, `docs: …`, `test: …`, `chore: …`, `ci: …`.
