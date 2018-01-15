---
title: Introducing Button, Faster Installs with Yarn, and a Public Roadmap
author: Héctor Ramos
authorTitle: Developer Advocate at Facebook
authorURL: https://twitter.com/hectorramos
authorImage: https://s.gravatar.com/avatar/f2223874e66e884c99087e452501f2da?s=128
authorTwitter: hectorramos
category: announcements
---

We have heard from many people that there is so much work happening with React Native, it can be tough to keep track of what's going on. To help communicate what work is in progress, we are now publishing a [roadmap for React Native](https://github.com/facebook/react-native/wiki/Roadmap). At a high level, this work can be broken down into three priorities:

- **Core Libraries**. Adding more functionality to the most useful components and APIs.
- **Stability**. Improve the underlying infrastructure to reduce bugs and improve code quality.
- **Developer Experience**. Help React Native developers move faster

If you have suggestions for features that you think would be valuable on the roadmap, check out [Canny](https://react-native.canny.io/feature-requests), where you can suggest new features and discuss existing proposals.

## What's new in React Native

[Version 0.37 of React Native](https://github.com/facebook/react-native/releases/tag/v0.37.0), released today, introduces a new core component to make it really easy to add a touchable Button to any app. We're also introducing support for the new [Yarn](https://yarnpkg.com/) package manager, which should speed up the whole process of updating your app's dependencies.

## Introducing Button

Today we're introducing a basic `<Button />` component that looks great on every platform. This addresses one of the most common pieces of feedback we get: React Native is one of the only mobile development toolkits without a button ready to use out of the box.

![Simple Button on Android, iOS](/react-native/blog/img/button-android-ios.png)

```
<Button
  onPress={onPressMe}
  title="Press Me"
  accessibilityLabel="Learn more about this Simple Button"
/>
```

Experienced React Native developers know how to make a button: use TouchableOpacity for the default look on iOS, TouchableNativeFeedback for the ripple effect on Android, then apply a few styles. Custom buttons aren't particularly hard to build or install, but we aim to make React Native radically easy to learn. With the addition of a basic button into core, newcomers will be able to develop something awesome in their first day, rather than spending that time formatting a Button and learning about Touchable nuances.

Button is meant to work great and look native on every platform, so it won't support all the bells and whistles that custom buttons do. It is a great starting point, but is not meant to replace all your existing buttons. To learn more, check out the [new Button documentation](http://facebook.github.io/react-native/docs/button.html), complete with a runnable example!


## Speed up `react-native init` using Yarn

You can now use [Yarn](https://yarnpkg.com/), the new package manager for JavaScript, to speed up `react-native init` significantly. To see the speedup please [install yarn](https://yarnpkg.com/en/docs/install) and upgrade your `react-native-cli` to 1.2.0:

```
$ npm install -g react-native-cli
```

You should now see “Using yarn” when setting up new apps:

![Using yarn](/react-native/blog/img/yarn-rncli.png)

In simple local testing `react-native init` finished in **about 1 minute on a good network** (vs around 3 minutes when using npm 3.10.8). Installing yarn is optional but highly recommended.

## Thank you!

We'd like to thank everyone who contributed to this release. The full [release notes](https://github.com/facebook/react-native/releases/tag/v0.37.0) are now available on GitHub. With over two dozen bug fixes and new features, React Native just keeps getting better thanks to you.
