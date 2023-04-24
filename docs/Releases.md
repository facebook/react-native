# Releases Guide

React Native macOS has 3 types of builds it can publish, similar to React Native.

1. **Dry Runs** : Only used by CI to test a PR won't break our publish flow
2. **Nightlies / Canaries** : Published off our main branch on every commit
3. **Stable Releases** : Published off `*-stable` branches, with a new patch release for every commit

We use Azure Pipelines for our publish pipeline. The pipeline is defined in `.ado/publish.yml`, and is set to run on pushes to `main` and `*-stable` branches. The pipeline steps differ between stable branches, with the latest as of time of writing (`0.71-stable`) attempting to re-use some of the scripts used by the upstream repo in their CircleCI pipelines. 

## Relevant Scripts from React Native Core

There are various scripts that React Native core uses to manage their releases. These have been refactored over time, so I'll be brief and mention the relevant scripts for React Native macOS. For more info on upstream releases, you can take a look at [the documentation](https://reactnative.dev/contributing/release-branch-cut-and-rc0).

- `set-rn-version.js` : This will locally modify file version numbers. Most other scripts below call this script. Depending on the repo and branch, this script was modified to do a lot more, including:
  - (React Native 0.71 and lower) Delete the "private" and "workspace" keys from the root package.json to make it suitable for publishing. In React Native macOS, we commented this out.
  - (React Native macOS 0.68 and lower) Commit and tag the version bump to git
- `bump-oss-version.js`: This is an interactive script used by Open Source maintainers to push React Native releases. It will walk you through the steps of triggering a new release, ending on triggering a CircleCI job to kickoff the release process.
- `prepare-package-for-release.js`: This is used by CircleCI. It will call `set-rn-version`, update RNTester's `podfile.lock` file, and appropriately `git tag` the release with the version and/or the "latest" tag. It will also `git push` the version bump and tags back to Github. 
- `publish-npm.js`: This is used by CircleCI, and is generally triggered by a new git tag. This script takes care of the actual `npm publish`, along with creating and publishing pre-build artifacts (for both iOS and Android). 
  - For nightlies and dry-runs, it will call `set-rn-version` to bump versions in the repo.
  - For releases (pre-release and stable), it is expected that CircleCI already ran `prepare-package-for-release.js` in an earlier job to bump versions.

## How the React Native macOS Publish pipeline works

### 0.68 and lower

Our publish pipeline was mostly separate from React Native Core. At this point in time, we only re-used `set-rn-version.js`, with heavy modifications to:
1. Add extra arguments to do the following:
    - `rnmpublish` : git commit and tag the version bump
    - `nightly` : Create a nightly build to be published off our main branch
    - `autogenerate-version-number` : Autogenerate the next version number. Unlike React Native, we publish a new patch release on every commit via automation
    - `skip-update-ruby` : This used to cause publish failures, so we added an arg to skip it. 
2. Not destructively delete `private` / `workspace` keys from the package.json file (we had separate steps to delete and restore those keys in our pipeline)
3. Make it more similar to `bump-oss-version.js` (the intention was to make it the one script to call that is more CI friendly)
4. .. but also skip some of those modifications with the extra `rnmpublish` flag because we do `git tag` and `git push` separately

The Publish flow does the following:

1. Set tags for NPM based on the branch
2. Conditional based on branch:
    - If we're on the *main* branch
      - Call `set-rn-version` with the extra nightly / rnm-publish args
    - If we're on a *stable* branch
      - Call our own script `bumpFileVersions` to auto-bump versions in files, which itself called `set-rn-version`
4. Remove `workspace` / `private` keys from `package.json`
5. Publish to NPM
6. Restore `workspace` / `private` keys from `package.json`
7. `gitTagRelease.js` to push the tags and new version bump back to git.

### 0.71 and higher

An attempt was made to simplify the steps above and re-use more of the scripts that React Native Core uses. Namely:
- Use more of the RN scripts to handle preparing the build. The intention is to leverage new features that have been added to those scripts, like the ability to build nightlies and dry runs, along with increased safety via checks on the version number. 
- Don't bother with manually removing and restoring workspace config. We don't need the `private` field set anyway since we don't have beachball auto-publishing or anything. 
- Extract all the steps to a template `apple-job-publish` with a parameter to switch between nightlies, dry runs, and releases. This was done so that we can now add a new "NPM Publish Dry Run" step to our PR checks.

We don't however use the scripts from upstream to publish to NPM or Github: we still keep that as separate steps in Azure Pipelines. In the future, we can look into removing these steps and just using the scripts directly. 

The Publish flow does the following:

1. Call the template `apple-job-publish` with either nightly or release as the build type based on branch name. 
2. The template will do the following steps based on build type:
    - If we're a *nightly* or *dry run*
      - Just call `publish-npm.js`, as this will take care of bumping versions, and publishing and no pushing back to Github is needed
    - If we're a *release*:
      1. Autogenerate the next version number and set to an environment variable (this logic was extracted from `bumpFileVersions` in 0.68)
      2. Set the `latest` tag to an environment variable. This will be passed to..
      3. Call `prepare-package-for-release` to bump versions, tag the commit, and push to git
      4. Call `publish-npm` to publish to NPM the version that was just tagged. 
4. Generate the correct NPM `dist-tag` and publish to NPM
5. Commit all changed files and push back to Github 

