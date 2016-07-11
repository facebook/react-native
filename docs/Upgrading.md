---
id: upgrading
title: Upgrading
layout: docs
category: Guides
permalink: docs/upgrading.html
next: platform-specific-code
---

Upgrading to new versions of React Native will give you access to more APIs, views, developer tools
and other goodies. Because React Native projects are essentially made up of an Android project, an
iOS project and a JavaScript project, all combined under an npm package, upgrading can be rather
tricky. But we try to make it easy for you. Here's what you need to do to upgrade from an older
version of React Native:

## 1. Upgrade the `react-native` dependency

Note the latest version of the `react-native` npm package from here (or use `npm info react-native` to check):

* https://www.npmjs.com/package/react-native

Now install that version of `react-native` in your project with `npm install --save`. For example, to upgrade to the version `0.26`, in a terminal run:

```sh
$ npm install --save react-native@0.26
```

## 2. Upgrade your project templates

The new npm package will likely contain updates to the files that are normally generated when you
run `react-native init`, like the iOS and the Android sub-projects. To get these latest changes,
run this in a terminal:

```sh
$ react-native upgrade
```

This will check your files against the latest template and perform the following:

* If there is a new file in the template, it is simply created.
* If a file in the template is identical to your file, it is skipped.
* If a file is different in your project than the template, you will be prompted; you have options
  to view a diff between your file and the template file, keep your file or overwrite it with the
  template version. If you are unsure, press `h` to get a list of possible commands.


# Manual Upgrades

Xcode project format is pretty complex and sometimes it's tricky to upgrade and merge new changes.

### From 0.13 to 0.14

The major change in this version happened to the CLI ([see changelog](https://github.com/facebook/react-native/releases/tag/v0.14.0-rc)) and static images ([see docs](docs/images.html)). To use the new asset system in existing Xcode project, do the following:

Add new "Run Script" step to your project's build phases:

![](https://cloud.githubusercontent.com/assets/192222/11050044/871bf926-86f7-11e5-8908-736106457bcb.png)

Set the script to
```sh
../node_modules/react-native/packager/react-native-xcode.sh
```

![](https://cloud.githubusercontent.com/assets/192222/11050052/8f098252-86f7-11e5-994a-364aabbaa7d1.png)

Move main.jsbundle to Trash (it will be generated automatically by Xcode using the script above)

![](https://cloud.githubusercontent.com/assets/192222/11050104/f3d025e2-86f7-11e5-9101-a4622236338d.png)

If you installed Node via nvm, you might experience "react-native: command not found". See [issues/3974](https://github.com/facebook/react-native/issues/3974) for workaround and [pull/4015](https://github.com/facebook/react-native/pull/4015) for the fix.
