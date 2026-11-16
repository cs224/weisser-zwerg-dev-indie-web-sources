# Push guard

Enable once per clone, from the repository root:

```sh
git config --local core.hooksPath .githooks
```

The hook allows `master` → `master`, tags, and remote branch deletions.
Other branch pushes are blocked, including working branches pushed to `master`.
For an intentional exception, use `git push --no-verify ...`.
