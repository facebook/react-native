---
id: upgrading
title: Upgrading
layout: docs
category: Guides
permalink: docs/upgrading.html
banner: ejected
next: native-modules-ios
previous: understanding-cli
---

Upgrading to new versions of React Native will give you access to more APIs, views, developer tools
and other goodies. Because React Native projects are essentially made up of an Android project, an
iOS project and a JavaScript project, all combined under an npm package, upgrading can be rather
tricky. But we try to make it easy for you. Here's what you need to do to upgrade from an older
version of React Native:

## Upgrade based on Git

**IMPORTANT:** You don't have to install the new version of React Native, it will be installed automatically.

The module `react-native-git-upgrade` provides a one-step operation to upgrade the source files with
a minimum of conflicts. Under the hood, it consists in 2 phases:

* First, it computes a Git patch between both old and new template files,
* Then, the patch is applied on the user's sources.

### 1. Install Git
Your project doesn't have to be handled by the Git versioning system (could be Mercurial, SVN or none)
but Git has to be installed and available in the `PATH`. You can download Git here:
https://git-scm.com/downloads

### 2. Install the `react-native-git-upgrade` module

It's a CLI tool and must be installed globally:

```sh
$ npm install -g react-native-git-upgrade
```

### 3. Run the command

Run the command to start the process:

```sh
$ react-native-git-upgrade
# Upgrade React Native to the latest version

# Or:

$ react-native-git-upgrade X.Y.Z
# Upgrade React Native to the X.Y.Z version
```

The templates are upgraded in a optimized way. You still may encounter conflicts but only where the Git
3-way merge have failed, depending on the version and how you modified your sources.

### 4. Resolve the conflicts

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

## Alternative

Use this only in case the above didn't work.

### 1. Upgrade the `react-native` dependency

Note the latest version of the `react-native` npm package from here (or use `npm info react-native` to check):

* https://www.npmjs.com/package/react-native

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

### 2. Upgrade your project templates

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
* If a file is different in your project than the template, you will be prompted; you have options
  to keep your file or overwrite it with the template version.


# Manual Upgrades

Some upgrades require manual steps, e.g. 0.13 to 0.14, or 0.28 to 0.29. Be sure to check the [release notes](https://github.com/facebook/react-native/releases) when upgrading so that you can identify any manual changes your particular project may require.
