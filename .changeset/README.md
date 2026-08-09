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
