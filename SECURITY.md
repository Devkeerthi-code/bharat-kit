# Security policy

## Supported versions

Fixes go into the latest published version. bharat-kit has no runtime dependencies, so there is no dependency tree to patch.

## Reporting a problem

Please report security issues privately through GitHub's **Report a vulnerability** button on the repository's Security tab, not in a public issue.

Examples of what counts:

- A function that writes its input to the console, the network or any storage.
- An Aadhaar error message, or any other error message, that repeats part of the number it was given.
- A validator that accepts input it should reject in a way that could be abused, such as a `upi://pay` link builder that lets a caller inject extra parameters.
- A regular expression that can be made to run for a very long time (ReDoS).

Do not include real personal data in a report. Describe the problem with invented values.

You can expect a first reply within a week. Once a fix is released, the changelog will credit you if you want it to.

## What bharat-kit does not do

bharat-kit checks formats and checksums. It cannot tell you that a GSTIN, PAN, Aadhaar number or bank account exists or belongs to someone. Do not use a passing check as proof of identity.
