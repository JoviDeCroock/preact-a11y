# Changesets

Add a changeset for every user-visible change:

```sh
pnpm changeset
```

Merging the generated **Version Packages** pull request updates the package version and changelog. The release workflow then builds and stages the package in npm's trusted-publishing environment. A maintainer must inspect and explicitly approve the npm stage before it becomes public:

```sh
npm stage approve <stage-id>
```

The placeholder version `0.0.0` is never staged.

## First publication

npm staged publishing only works after the package already exists. Bootstrap the initial
release as a separate, explicitly approved operation; do not add an automatic direct-publish
fallback to the staging workflow. Provenance must be generated on a supported hosted CI
runner, and npm does not generate provenance for a public package while its source repository
is private. After the package exists, configure npm trusted publishing for
`JoviDeCroock/preact-a11y`, workflow `.github/workflows/main.yml`, environment `npm`, with
stage-publish permission. All later versions must use the Version Packages pull request and
staged approval flow above.
