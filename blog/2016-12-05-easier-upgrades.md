---
title: Easier Upgrades Thanks to Git
author: Nicolas Cuillery
authorTitle: JavaScript consultant and trainer at Zenika
authorURL: https://twitter.com/ncuillery
authorImage: https://fr.gravatar.com/userimage/78328995/184460def705a160fd8edadc04f60eaf.jpg?size=128
authorTwitter: ncuillery
category: announcements
---

Upgrading to new versions of React Native has been difficult. You might have seen something like this before:

![](/react-native/blog/img/git-upgrade-conflict.png)

None of those options is ideal. By overwriting the file we lose our local changes. By not overwriting we don't get the latest updates.

Today I am proud to introduce a new tool that helps solve this problem. The tool is called `react-native-git-upgrade` and uses Git behind the scenes to resolve conflicts automatically whenever possible.

## Usage

> **Requirement**: Git has to be available in the `PATH`. Your project doesn't have to be managed by Git.

Install `react-native-git-upgrade` globally:

```shell
$ npm install -g react-native-git-upgrade
```
or, using [Yarn](https://yarnpkg.com/):

```shell
$ yarn global add react-native-git-upgrade
```

Then, run it inside your project directory:

```shell
$ cd MyProject
$ react-native-git-upgrade 0.38.0
```

> Note: Do **not** run 'npm install' to install a new version of `react-native`. The tool needs to be able to compare the old and new project template to work correctly. Simply run it inside your app folder as shown above, while still on the old version.

Example output:

![](/react-native/blog/img/git-upgrade-output.png)

You can also run `react-native-git-upgrade` with no arguments to upgrade to the latest version of React Native.

We try to preserve your changes in iOS and Android build files, so you don't need to run `react-native link` after an upgrade.

We have designed the implementation to be as little intrusive as possible. It is entirely based on a local Git repository created on-the-fly in a temporary directory. It won't interfere with your project repository (no matter what VCS you use: Git, SVN, Mercurial, ... or none). Your sources are restored in case of unexpected errors.

## How does it work?

The key step is generating a Git patch. The patch contains all the changes made in the React Native templates between the version your app is using and the new version.

To obtain this patch, we need to generate an app from the templates embedded in the `react-native` package inside your `node_modules` directory (these are the same templates the `react-native init` commands uses). Then, after the native apps have been generated from the templates in both the current version and the new version, Git is able to produce a patch that is adapted to your project (i.e. containing your app name):

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

All we need now is to apply this patch to your source files. While the old `react-native upgrade` process would have prompted you for any small difference, Git is able to merge most of the changes automatically using its 3-way merge algorithm and eventually leave us with familiar conflict delimiters:

```
		13B07F951A680F5B00A75B9A /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CURRENT_PROJECT_VERSION = 1;
				HEADER_SEARCH_PATHS = (
					"$(inherited)",
					/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include,
					"$(SRCROOT)/../node_modules/react-native/React/**",
					"$(SRCROOT)/../node_modules/react-native-code-push/ios/CodePush/**",
				);
```

These conflicts are generally easy to reason about. The delimiter **ours** stands for "your team" whereas **theirs** could be seen as "the React Native team".

## Why introduce a new global package?

React Native comes with a global CLI (the [react-native-cli](https://www.npmjs.com/package/react-native-cli) package) which delegates commands to the local CLI embedded in the `node_modules/react-native/local-cli` directory.

As we mentioned above, the process has to be started from your current React Native version. If we had embedded the implementation in the local-cli, you wouldn't be able to enjoy this feature when using old versions of React Native. For example, you wouldn't be able to upgrade from 0.29.2 to 0.38.0 if this new upgrade code was only released in 0.38.0.

Upgrading based on Git is a big improvement in developer experience and it is important to make it available to everyone. By using a separate package [react-native-git-upgrade](https://www.npmjs.com/package/react-native-git-upgrade) installed globally you can use this new code today no matter what version of React Native your project is using.

One more reason is the recent [Yeoman wipeout](https://twitter.com/martinkonicek/status/800730190141857793) by Martin Konicek. We didn't want to get these Yeoman dependencies back into the `react-native` package to be able to evaluate the old template in order to create the patch.

## Try it out and provide feedback

As a conclusion, I would say, enjoy the feature and feel free [to suggest improvements, report issues](https://github.com/facebook/react-native/issues) and especially [send pull requests](https://github.com/facebook/react-native/pulls). Each environment is a bit different and each React Native project is different, and we need your feedback to make this work well for everyone.

### Thank you!

I would like to thank the awesome companies [Zenika](http://www.zenika.com) and [M6 Web](http://www.groupem6.fr/le-groupe_en/activites/diversifications/m6-web.html) without whom none of this would have been possible!
