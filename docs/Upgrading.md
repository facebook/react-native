---
id: upgrading
title: Upgrading to new React Native versions
layout: docs
category: Guides
permalink: docs/upgrading.html
next: native-modules-ios
previous: running-on-device
---

Upgrading to new versions of React Native will give you access to more APIs, views, developer tools and other goodies. Upgrading requires a small amount of effort, but we try to make it easy for you. The instructions are a bit different depending on whether you used `create-react-native-app` or `react-native init` to create your project.

## Create React Native App projects

Upgrading your Create React Native App project to a new version of React Native requires updating the `react-native`, `react`, and `expo` package versions in your `package.json` file. Please refer to [this document](https://github.com/react-community/create-react-native-app/blob/master/VERSIONS.md) to find out what versions are supported. You will also need to set the correct `sdkVersion` in your `app.json` file.

See the [CRNA user guide](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#updating-to-new-releases) for up-to-date information about upgrading your project.

## Projects built with native code

<div class="banner-crna-ejected">
  <h3>Projects with Native Code Only</h3>
  <p>
    This section only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.
  </p>
</div>

Because React Native projects built with native code are essentially made up of an Android project, an iOS project, and a JavaScript project, upgrading can be rather tricky. Here's what you need to do to upgrade from an older version of React Native.

### Upgrade based on Git

The module `react-native-git-upgrade` provides a one-step operation to upgrade the source files with a minimum of conflicts. Under the hood, it consists in 2 phases:

* First, it computes a Git patch between both old and new template files,
* Then, the patch is applied on the user's sources.

> **IMPORTANT:** You don't have to install the new version of the `react-native` package, it will be installed automatically.

#### 1. Install Git

While your project does not have to be handled by the Git versioning system -- you can use Mercurial, SVN, or nothing -- you will still need to [install Git](https://git-scm.com/downloads) on your system in order to use `react-native-git-upgrade`. Git will also need to be available in the `PATH`.

#### 2. Install the `react-native-git-upgrade` module

The `react-native-git-upgrade` module provides a CLI and must be installed globally:

```sh
$ npm install -g react-native-git-upgrade
```

#### 3. Run the command

Run the following command to start the process of upgrading to the latest version:

```sh
$ react-native-git-upgrade
```

> You may specify a React Native version by passing an argument: `react-native-git-upgrade X.Y`

The templates are upgraded in a optimized way. You still may encounter conflicts but only where the Git 3-way merge have failed, depending on the version and how you modified your sources.

#### 4. Resolve the conflicts

Conflicted files include delimiters which make very clear where the changes come from. For example:

```
13B07F951A680F5B00A75B9A /* Release */ = {
  isa = XCBuildConfiguration;
  buildSettings = {
    ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
<<<<<<< ours
    CODE_SIGN_IDENTITY = "iPhone Developer";
    FRAMEWORK_SEARCH_PATHS = (
      "$(inherited)",
      "$(PROJECT_DIR)/HockeySDK.embeddedframework",
      "$(PROJECT_DIR)/HockeySDK-iOS/HockeySDK.embeddedframework",
    );
=======
    CURRENT_PROJECT_VERSION = 1;
>>>>>>> theirs
    HEADER_SEARCH_PATHS = (
      "$(inherited)",
      /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include,
      "$(SRCROOT)/../node_modules/react-native/React/**",
      "$(SRCROOT)/../node_modules/react-native-code-push/ios/CodePush/**",
    );
```

You can think of "ours" as "your team" and "theirs" as "the React Native dev team".

### Alternative

Use this only in case the above didn't work.

#### 1. Upgrade the `react-native` dependency

Note the latest version of the `react-native` npm package [from here](https://www.npmjs.com/package/react-native) (or use `npm info react-native` to check).

Now install that version of `react-native` in your project with `npm install --save`:

```sh
$ npm install --save react-native@X.Y
# where X.Y is the semantic version you are upgrading to
npm WARN peerDependencies The peer dependency react@~R included from react-native...
```

If you saw a warning about the peerDependency, also upgrade `react` by running:
```sh
$ npm install --save react@R
# where R is the new version of react from the peerDependency warning you saw
```

#### 2. Upgrade your project templates

The new npm package may contain updates to the files that are normally generated when you
run `react-native init`, like the iOS and the Android sub-projects.

You may consult [rn-diff](https://github.com/ncuillery/rn-diff) to see if there were changes in the project template files.
In case there weren't any, simply rebuild the project and continue developing. In case of minor changes, you may update your project manually and rebuild.

If there were major changes, run this in a terminal to get these:

```sh
$ react-native upgrade
```

This will check your files against the latest template and perform the following:

* If there is a new file in the template, it is simply created.
* If a file in the template is identical to your file, it is skipped.
* If a file is different in your project than the template, you will be prompted; you have options to keep your file or overwrite it with the template version.

##  Manual Upgrades

Some upgrades require manual steps, e.g. 0.13 to 0.14, or 0.28 to 0.29. Be sure to check the [release notes](https://github.com/facebook/react-native/releases) when upgrading so that you can identify any manual changes your particular project may require.
