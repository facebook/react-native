# React Native Git Upgrade

This tool makes upgrading your apps to a new version of React Native easier than the stock `react-native upgrade` command.

It uses Git under the hood to automatically resolve merge conflicts in project templates (native iOS and Android files, `.flowconfig` etc.). These conflicts happen when a new React Native version introduces changes to those files and you have local changes in those files too, which is quite common.

## Usage

See the [Upgrading docs](http://facebook.github.io/react-native/releases/next/docs/upgrading.html) on the React Native website.

Basic usage:

```
$ npm install -g react-native-git-upgrade
$ cd MyReactNativeApp
$ react-native-git-upgrade
```
