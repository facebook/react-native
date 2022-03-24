# Android Patches for react-native internal deployment

This folder contains the patches applied during CI flow to this codebase, when generating the Office "flavour" of `react-native`.

This is how it happens:

* `.ado/publish.yml` has a job called `RNGithubOfficePublish`
* That uses as template `templates/android-build-office.yml`
* That when used invokes `.ado/templates/apple-droid-node-patching.yml` passing the parameter `apply_office_patches` as `true`
* This last file is the one that *actually* triggers the patching script

## Patching tool

We use the tool [`patcher-rnmacos`](https://github.com/microsoft/rnx-kit/tree/main/incubator/patcher-rnmacos) that is hosted in the `rnx-kit` repo, via `npx`. Please refer to the README of the package for details on how it works.
