# Changesets

Every pull request that changes what users get from the package adds a changeset:

```sh
npx changeset
```

Pick patch, minor or major and describe the change in one or two sentences, written for people who use the library. When the pull request is merged, the release workflow opens a "Version Packages" pull request that bumps the version and updates `CHANGELOG.md`. Merging that pull request publishes to npm with provenance.
