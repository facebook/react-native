# Android Patches for react-native internal deployment

This folder contains the patches applied during CI flow to this codebase, when generating the Office "flavour" of `react-native`.

This is how it happens:

* `.ado/publish.yml` has a job called `RNGithubOfficePublish`
* That uses as template `templates/android-build-office.yml`
* That when used invokes `.ado/templates/apple-droid-node-patching.yml` passing the parameter `apply_office_patches` as `true`
* This last file is the one that *actually* triggers the patching script, in the formula as follows:

```sh
node $(System.DefaultWorkingDirectory)/android-patches/bundle/bundle.js patch $(System.DefaultWorkingDirectory) Build OfficeRNHost V8 Focus MAC ImageColor --patch-store $(System.DefaultWorkingDirectory)/android-patches/patches --log-folder $(System.DefaultWorkingDirectory)/android-patches/logs --confirm ${{ parameters.apply_office_patches }}
```

Splitting this up clarifies how the patching command works:

* `node ./android-patches/bundle/bundle.js`
  * The command is invoked via node directly using the bundled version
* `patch .`
  * The patch command, invoked targeting the root of the fork
* `Build OfficeRNHost V8 Focus MAC ImageColor`
  * Passing the name of each patch's folder.
* `--patch-store ./android-patches/patches`
  * Passing the folder that contains the subfolders listed above
* `--log-folder ./android-patches/logs`
  * Folder for logs
* `--confirm true`
  * Flag stating that yes, I want to run it

## The patching tool

As you can see from above, we use the tool directly via a generated `bundle.js`. This is because the tool itself was a fork of [`patch-package`](https://github.com/ds300/patch-package) that underwent a series of changes ([more details here](https://github.com/microsoft/react-native-macos/pull/254#issuecomment-592594790)).

You can find more details about this tool in `./patching-tool/README.md`.

## How to create a new patch

*To Be Added*