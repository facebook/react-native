---
title: Easy upgrades, relying on Git
author: Nicolas Cuillery
authorTitle: JavaScript consultant and trainer at Zenika
authorURL: https://twitter.com/ncuillery
authorImage: https://fr.gravatar.com/userimage/78328995/184460def705a160fd8edadc04f60eaf.jpg?size=128
authorTwitter: ncuillery
category: announcements
---

Each release of React Native may come with changes inside the iOS and Android sub-projects that you have to report in your project. This synchronisation has always been a major pain point because of the poor changes detection within your source files. Today, I'm proud to announce a new upgrading process relying on the most popular version control system: Git.

The key concept in this operation is the generation of a Git patch that contains all the changes required by React Native from your current version to the requested one.

To obtain this patch, we need to generate the iOS and Android apps from the templates embedded in the `react-native` package inside your `node_modules` directory, exactly like the `init` and `upgrade` commands do. Then, after the native apps have been computed from the templates in both current version and requested versions, Git is be able to produce a patch that is completely adapted to your project (i.e. with your app name):

```
[...]

diff --git a/ios/MyAwesomeApp/Info.plist b/ios/MyAwesomeApp/Info.plist
index e98ebb0..2fb6a11 100644
--- a/ios/MyAwesomeApp/Info.plist
+++ b/ios/MyAwesomeApp/Info.plist
@@ -45,7 +45,7 @@
 		<dict>
 			<key>localhost</key>
 			<dict>
-				<key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
+				<key>NSExceptionAllowsInsecureHTTPLoads</key>
 				<true/>
 			</dict>
 		</dict>
 		
[...]
```

All we need now is to apply this patch on your current source files. While the old process would have prompted you for any difference (even from a single character), Git is able to merge most of the changes automatically, fallback on a 3-way merge and eventually leave familiar conflict delimiters:

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

These conflicts are generally easy to reason about. The delimiter **ours** actually stands for "your team" whereas **their** could be seen as "the React Native team".

## Usage

As I mentioned in the [Upgrading guide](http://facebook.github.io/react-native/releases/next/docs/upgrading.html), the most important change concerns the automatic installation of the new `react-native` package.

> You should **not** install the new `react-native` package by yourself, the upgrading process needs to be initiated on your current version of React Native. Otherwise, the current and requested versions would be the same, Git would produce an empty patch and the upgrade would be ineffective.

Install the `react-native-git-upgrade` package globally:

```shell
$ npm install -g react-native-git-upgrade
```

Then, run the `react-native-git-upgrade` command with an optional version (latest if not specified) inside your project directory:

![](/react-native/blog/img/git-upgrade-output.png)

> Git needs to be available in the `PATH`.

Note that this new upgrade method aims at preserving your changes in your native files, so you don't need to run `react-native link` after an upgrade.

I have designed the implementation to be as less intrusive as possible. It is entirely based on a local Git repository created on-the-fly in the system temporary directory. It won't interfere with your project repository (no matter the VCS you use: Git, SVN, Mercurial, ... or none). Your sources are restored in case of unexpected errors.

## Why a separated package ?

React Native comes with a global CLI (the [react-native-cli](https://www.npmjs.com/package/react-native-cli) package) which delegates the command to the local CLI embedded in the `node_modules/react-native/local-cli` directory.

As I mentioned above, the process has to be started upon your current React Native version. If we had embedded the implementation in the local-cli, you wouldn't have been able to enjoy this feature until the upcoming React Native release was in use on your project.

This Git upgrading feature is a huge improvement in developer experience and I really wanted it to be available for any users including those who are stuck in old versions of React Native (who said 0.28 ?) because of the painful upgrading process. That's why we came with the [react-native-git-upgrade](https://www.npmjs.com/package/react-native-git-upgrade) package, installed globally, no matter the version of React Native being used.

An other reason is the recent [Yeoman wipeout](https://twitter.com/martinkonicek/status/800730190141857793) by Martin Konicek. We didn't want to get these Yeoman dependencies back into the `react-native` package !

## About the future

The standalone package is a temporary situation for a few months, it would probably never see the _1.0.0_ release: when most users will have migrated their projects to the _post-Yeoman era_ using this package, it will replace the actual `react-native upgrade` and the global package `react-native-git-upgrade` will be deprecated.

As a conclusion, I would say, enjoy the feature and feel free [to suggest improvements, report issues and send pull requests](https://github.com/facebook/react-native/issues). Each user has its own runtime environment, each React Native project is different, so we need you to make this process completely reliable and universal !
