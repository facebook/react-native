The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

## Release schedule

| Version | RC release          | Stable release |
| ------- | ------------------- | -------------- |
| 0.38.0  | week of November 7  | November 21    |
| 0.39.0  | week of November 21 | December 2     |
| 0.40.0  | 1st of December     | 1st of January |
| 0.41.0  | 1st of January      | 1st of February|
| ...     | ...                 | ...            |

-------------------
## How to cut a new release branch

#### Prerequisites

The following are required for the local test suite to run:
- Mac OS X with [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md)
- At least 0.2.0 [react-native-cli](https://www.npmjs.com/package/react-native-cli) installed globally

#### Check everything works

Before cutting a release branch, make sure CI systems [Travis](https://travis-ci.org/facebook/react-native) and [Circle](https://circleci.com/gh/facebook/react-native) are green.

Before executing the following script, make sure you have:
- An Android emulator / Genymotion device running
- No packager running in any of the projects

```bash
./scripts/test-manual-e2e.sh
```

This script bundles a react-native package locally and passes it to the `react-native` cli that creates a test project inside `/tmp` folder using that version.

After `npm install` completes, the script prints a set of manual checks you have to do to ensure the release you are preparing is working as expected on both platforms.

#### Cut a release branch and push to github

Run:

```bash
git checkout -b <version_you_are_releasing>-stable
# e.g. git checkout -b 0.22-stable

./scripts/bump-oss-version.js <exact-version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.22.0-rc
# You can use the --remote option to specify a Git remote other than the default "origin"
```

Circle CI will automatically run the tests and publish to npm with the version you have specified (e.g `0.22.0-rc`) and tag `next` meaning that this version will not be installed for users by default.

Go to [Circle CI](https://circleci.com/gh/facebook/react-native), look for your branch on the left side and look the npm publish step.

#### Make sure we have release notes

Write the release notes, or post in [React Native Core Contributors](https://www.facebook.com/groups/reactnativeoss/) that the RC is ready to find a voluteer. You can also use [react-native-release-notes](https://github.com/knowbody/react-native-release-notes) to generate a draft of release notes.

To go through all the commits that went into a release, one way is to use the GitHub compare view:
```
https://github.com/facebook/react-native/compare/0.21-stable...0.22-stable
```

**Note**: This only shows **250** commits, if there are more use git.

When making a list of changes, ignore docs, showcase updates and minor typos.

Sometimes commit messages might be really short / confusing - try rewording them where it makes sense. Below are few examples:
- `Fix logging reported by RUN_JS_BUNDLE` -> `Fix systrace logging of RUN_JS_BUNDLE event`
- `Fixes hot code reloading issue` -> `Fix an edge case in hot module reloading`

Before posting the list of changes, consider asking one of contributors for their opinion. Once everything is ready, post the release notes: https://github.com/facebook/react-native/releases

**Important**: For release candiate releases, make sure to check "This is a pre-release"

#### Update `Breaking Changes` document

Once the release is cut, go to the [page](https://github.com/facebook/react-native/wiki/Breaking-Changes) where all breaking changes are listed and create section for the release. Don't forget to move all breaking changes from `master` that are now part of the release.

When finished and there are breaking changes, include them in the release notes you just created.

#### Tweet about the rc release

Tweet about it! Link to release notes and say "please report issues" and link to the master issue to track bugs you created.

## IMPORTANT: Track bug reports from the community during the following month, ping owners to get them fixed

A good way to do this is to create a github issue and post about it so people can report bugs. Examples: [#6087](https://github.com/facebook/react-native/issues/6087), [#5201](https://github.com/facebook/react-native/issues/5201)

**Only cherry-pick small and non-risky bug fixes**. **Don't pick new features into the release** as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for a month and fix the most serious bugs.

-------------------

## How to release an RC update (e.g. 0.28.0-rc.1, 0.28.0-rc.2)

After cherry-picking 1-2 bug fixes, it is a good idea to do a new RC release so that people can test again. Having a few RC releases can also help people bisect in case we cherry-pick a bad commit by mistake.

```bash
git checkout 0.version_you_are_releasing-stable
# e.g. git checkout 0.22-stable

git pull origin 0.version_you_are_releasing-stable
# e.g. git pull origin 0.22-stable

# Cherry-pick those commits
git cherry-pick commitHash1

# IMPORTANT: Test everything again (Chrome debugging, Reload JS, Hot Module Reloading)
./scripts/test-manual-e2e.sh
```

If everything worked:

```bash
./scripts/bump-oss-version.js <exact_version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.28.0-rc.1
````

-------------------

## How to do the final release (e.g. 0.22.0, 0.22.1)

Roughly a month after the branch cut (see the release schedule above) it's time to promote the last RC to a real release.

Once all bugfixes have been cherry-picked and you're sure the release is solid (example: [#6087](https://github.com/facebook/react-native/issues/6087)), do the release:

```bash
git checkout 0.version_you_are_releasing-stable
# e.g. git checkout 0.22-stable

git pull origin 0.version_you_are_releasing-stable
# e.g. git pull origin 0.22-stable

# Cherry-pick those commits, if any
git cherry-pick commitHash1

# IMPORTANT: If you cherry-picked any commits, test everything again (Chrome debugging, Reload JS, Hot Module Reloading)
./scripts/test-manual-e2e.sh
```

If everything worked:

```bash
./scripts/bump-oss-version.js <exact_version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.22.0
```

#### Update the release notes

Once you see the version in the top left corner of the website has been updated:
Move the release notes to the tag you've just created. We want single release notes per version,
for example if there is v0.22.0-rc and later we release v0.22.0, the release notes should live on v0.22.0:
https://github.com/facebook/react-native/tags

For non-RC releases: Uncheck the box "This is a pre-release" and publish the notes.

#### Tweet about it

Tweet about it! :) ([example tweet](https://twitter.com/grabbou/status/701510554758856704))
