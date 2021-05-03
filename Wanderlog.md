# Wanderlog-specific readme

This is our fork of React Native, to integrate various bugfixes that require 
re-building all the native components.

## How tos

### 1. Integrate upstream patch into our fork

Let's say we're on React Native 0.62.2, and encounter a React Native issue 
that has been fixed in 0.64. We have two options:

1. Upgrade to 0.64, or
2. Backport the patch

Upgrading a version often takes half a day, so if it's a small patch, it's 
often easier to just release.

1. Checkout `master`
2. Download the patch by:
   - Getting the link to the commit on GitHub (e.g., https://github.com/facebook/react-native/commit/123423c2a9258c9af25ca9bffe1f10c42a176bf3)
   - Adding `.patch` to it (e.g., https://github.com/facebook/react-native/commit/123423c2a9258c9af25ca9bffe1f10c42a176bf3.patch)
3. Apply the patch
   ```sh
   cd react-native
   git apply 1234.patch
   git commit -m 'Same message as upstream, preferably'
   ```
4. Adding a line to WanderlogPatches.md about where we got the patch from 
   and the commit that references it, and then commit that.
   
### 2. Make a fix ourselves

See https://gitlab.com/travelchime/itineraries/-/blob/master/mobile/PATCHING_REACT_NATIVE.md

### 3. Publishing a new version and using it in our app

See https://gitlab.com/travelchime/itineraries/-/blob/master/mobile/PATCHING_REACT_NATIVE.md

### 4. Rebasing on master

- Check `WanderlogPatches.md`:
  - Run:
    ```sh
    git checkout master
    git pull
    git remote add upstream git@github.com:facebook/react-native.git
    git fetch upstream master
    git rebase -i upstream/master
    ```
  - For patches that have Pull Requests that have now been merged into 
    upstream, you can omit/DROP them
  - Otherwise, try to resolve any merge conflicts
- Clean up `WanderlogPatches.md` by removing any patches/commits that you 
  omitted/DROPped
- Commit any changes to `WanderlogPatches.md` you made
