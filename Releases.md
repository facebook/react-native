# Releases Guide

This document serves as guide for release coordinators. You can find a list of releases and their release notes at https://github.com/facebook/react-native/releases

## Release schedule

React Native follows a monthly release train. Every month, a new branch created off master enters the Release Candidate phase, and the previous Release Candidate branch is released and considered stable.


| Version | RC release          | Stable release   |
| ------- | ------------------- | ---------------- |
| 0.38.0  | week of November 7  | November 21      |
| 0.39.0  | week of November 21 | December 2       |
| 0.40.0  | 1st of December     | 1st of January   |
| 0.41.0  | 1st of January      | 1st of February  |
| 0.42.0  | 1st of February     | 1st of March     |
|  ...    |       ...           |      ...         |
| 0.56.0  | 1st of June         | 1st of July      |
| 0.57.0  | 1st of July         | 1st of August    |
| 0.58.0  | 1st of August       | 1st of September |
| ...     | ...                 | ...              |

-------------------

## How to cut a new release branch

### Prerequisites

The following are required for the local test suite to run:

- macOS with [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md)
- [react-native-cli](https://www.npmjs.com/package/react-native-cli) installed globally (v0.2.0 or newer)

### Step 1: Check everything works

Before cutting a release branch, make sure [Circle](https://circleci.com/gh/facebook/react-native) CI system is green.

Before executing the following script, make sure you have:

- An Android emulator / Genymotion device running
- No packager running in any of the projects

```bash
./scripts/test-manual-e2e.sh
```

This script bundles a react-native package locally and passes it to the `react-native` cli that creates a test project inside `/tmp` folder using that version.

After `npm install` completes, the script prints a set of manual checks you have to do to ensure the release you are preparing is working as expected on both platforms.

### Step 2: Cut a release branch and push to GitHub

Run:

```bash
git checkout -b <version_you_are_releasing>-stable
# e.g. git checkout -b 0.57-stable

./scripts/bump-oss-version.js <exact_version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.57.0-rc.0
#  or  ./scripts/bump-oss-version.js 0.58.0
```

Circle CI will automatically run the tests and publish to npm with the version you have specified (e.g `0.57.0-rc.0`) and tag `next` meaning that this version will not be installed for users by default.

### Step 3: Write the release notes

Write the release notes, or post in [React Native Core Contributors](https://www.facebook.com/groups/reactnativeoss/) that the RC is ready to find a volunteer. You can also use [react-native-release-notes](https://github.com/knowbody/react-native-release-notes) to generate a draft of release notes.

To go through all the commits that went into a release, one way is to use the GitHub compare view:

```
https://github.com/facebook/react-native/compare/0.49-stable...0.50-stable
```

**Note**: This only shows **250** commits, if there are more use git.

When making a list of changes, ignore docs, showcase updates and minor typos.

Sometimes commit messages might be really short / confusing - try rewording them where it makes sense. Below are few examples:

- `Fix logging reported by RUN_JS_BUNDLE` -> `Fix systrace logging of RUN_JS_BUNDLE event`
- `Fixes hot code reloading issue` -> `Fix an edge case in hot module reloading`

Open a pull request against CHANGELOG.md at https://github.com/react-native-community/react-native-releases and ask for feedback.

Once everything is ready, create a new release at https://github.com/facebook/react-native/releases and link to the release notes.

**Important**: For release candidate releases, make sure to check "This is a pre-release".

### Step 4: Update `Breaking Changes` document

Once the release is cut, go to the [page](https://github.com/facebook/react-native/wiki/Breaking-Changes) where all breaking changes are listed and create section for the release. Don't forget to move all breaking changes from `master` that are now part of the release.

When finished and there are breaking changes, include them in the release notes you just created.

### Step 5: Tweet about the RC release

Tweet about it! Link to release notes and say "please report issues" and link to the master issue to track bugs you created.

### Step 6: IMPORTANT: Track bug reports from the community during the following month, ping owners to get them fixed

Now that the release is out in the open, go ahead and create a GitHub issue titled "[[0.XX-RC] Commits to cherry-pick](https://github.com/facebook/react-native/issues/14713)" where 0.XX matches the release version. Use this issue to track bugs that have been reported for this particular release, including commits that should be cherry-picked in cases that a fix cannot wait until the next release.

-------------------

## How to release an RC update (e.g. 0.57.0-rc.1, 0.57.0-rc.2)

The release is now in the open, people are finding bugs, and fixes have landed in master. People have been nominating fixes in the issue you created above. Use your best judgment to decide which commits merit an RC update. It's a good idea to do a new RC release when several small and non-risky bugs have been fixed. Having a few RC releases can also help people bisect in case we cherry-pick a bad commit by mistake.

**Only cherry-pick small and non-risky bug fixes**. **Don't pick new features into the release** as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for a month and fix the most serious bugs.


### Step 1: Check out the release branch

Follow these steps to check out the release branch:

```bash
git checkout <version_you_are_patching>-stable
# e.g. git checkout 0.57-stable

git pull origin <version_you_are_patching>-stable
# e.g. git pull origin 0.57-stable
```

> If you don't have a local checkout of the release branch, you can run the following instead:
> `git checkout -b <version_you_are_patching>-stable -t origin/<version_you_are_patching>-stable`

### Step 2: Cherry-pick commits

Now, cherry-pick those commits:

```
git cherry-pick commitHash1
```

### Step 3: IMPORTANT: Test everything again (Chrome debugging, Reload JS, Hot Module Reloading)

Go through the same process as earlier to test the release:

```
./scripts/test-manual-e2e.sh
```

### Step 4: Bump the version number

If everything worked, run the following to bump the version number:

```bash
./scripts/bump-oss-version.js <exact_version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.57.0-rc.1
```

Again, Circle CI will automatically run the tests and publish to npm with the version you have specified (e.g `0.57.0-rc.1`).

### Step 5: Update the release notes

Go to https://github.com/facebook/react-native/releases and find the release notes for this release candidate. Edit them so that they now point to the tag that you've just created. We want single release notes per version. For example, if there is v0.57.0-rc and you just released v0.57.0-rc.1, the release notes should live on the v0.57.0-rc.1 tag at https://github.com/facebook/react-native/tags

-------------------

## How to do the final stable release (e.g. 0.57.0, 0.57.1)

A stable release is promoted roughly a month after the release branch is cut (refer to the schedule above). The release may be delayed for several reasons, including major issues in the release candidate. Make sure that all bug fixes that have been nominated in your tracking issue have been addressed as needed. Avoid cherry-picking commits that have not been vetted in the release candidate phase at this point.

Once you are sure that the release is solid, perform the following steps. Note that they're similar to the steps you may have followed earlier when patching the release candidate, but we're not cherry-picking any additional commits at this point.

### Step 1: Check out the release branch

```bash
git checkout <version_you_are_patching>-stable
# e.g. git checkout 0.57-stable

git pull origin <version_you_are_patching>-stable
# e.g. git pull origin 0.57-stable
```

> If you don't have a local checkout of the release branch, you can run the following instead:
> `git checkout -b <version_you_are_patching>-stable -t origin/<version_you_are_patching>-stable`

### Step 2: IMPORTANT: Test everything again (Chrome debugging, Reload JS, Hot Module Reloading)

It's **important** to test everything again: you don't want to cut a release with a major blocking issue!

```
./scripts/test-manual-e2e.sh
```

### Step 3: Bump the version number

If everything worked:

```bash
./scripts/bump-oss-version.js <exact_version_you_are_releasing>
# e.g. ./scripts/bump-oss-version.js 0.57.0
```

As with the release candidate, Circle CI will automatically run the tests and publish to npm with the version you have specified (e.g `0.57.0`).

Go to [Circle CI](https://circleci.com/gh/facebook/react-native) and look for the build triggered by your push (e.g. _0.57-stable, [0.57.0] Bump version numbers_), then scroll down to the npm publish step to verify the package was published successfully (the build will be red if not).

This will now become the latest release, and will be installed by users by default. At this point, the website will be updated and the docs for this release will be displayed by default.

### Step 4: Update the release notes

Go to https://github.com/facebook/react-native/releases and find the release notes for this release candidate. Edit them so that they now point to the tag that you've just created. We want single release notes per version. For example, if there is v0.57.0 and you just released v0.57.1, the release notes should live on the v0.57.1 tag at https://github.com/facebook/react-native/tags

For non-RC releases: Uncheck the box "This is a pre-release" and publish the notes.

### Supporting the release

Sometimes things don't go well and a major issue is missed during the release candidate phase. If a fix cannot wait until the next release is cut, it may be necessary to cherry-pick it into the current stable release. Go back to your `[0.XX-RC] Commits to cherry-pick` issue and rename it to `[0.XX] Commits to cherry-pick`, then add a comment stating that any cherry-pick requests from then on will be applied to the stable release.

**The same guidelines for RC cherry-picks apply here. If anything, the bar for cherry-picking into a stable release is higher.** Stick to commits that fix blocking issues. Examples may be RedBoxes on newly generated projects, broken upgrade flows with no workaround, or bugs affecting the compiling and/or building of projects.
