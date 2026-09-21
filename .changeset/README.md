# Changesets

Run `pnpm changeset` alongside any change that alters a published package, and pick the bump.
`pnpm version:packages` then applies every pending changeset to the versions and the changelogs,
and `pnpm release` builds and publishes what is left.

The playground is private, so changesets never asks about it.
