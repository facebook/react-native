---
title: React Native Monthly #6
author: Tomislav Tenodi
authorTitle: Founder at Speck
authorURL: https://twitter.com/TomislavTenodi
authorImage: https://pbs.twimg.com/profile_images/877237660225609729/bKFDwfAq.jpg
authorTwitter: TomislavTenodi
category: engineering
---

The React Native monthly meeting is still going strong! Make sure to check a note on the bottom of this post for the next sessions.

### Expo

- Congratulations to [Devin Abbott](https://github.com/dabbott) and [Houssein Djirdeh](https://twitter.com/hdjirdeh) on their pre-release of the "Full Stack React Native" book! It walks you through learning React Native by building several small apps. You can try those apps out on https://www.fullstackreact.com/react-native/ before buying the book.
- Released a first (experimental) version of [reason-react-native-scripts](https://github.com/react-community/reason-react-native-scripts) to help people to easily try out [ReasonML](https://reasonml.github.io/).
- Expo SDK 24 is [released](https://blog.expo.io/expo-sdk-v24-0-0-is-now-available-bfcac3b50d51)! It uses [React Native 0.51](https://github.com/facebook/react-native/releases/tag/v0.51.0) and includes a bunch of new features and improvements: bundling images in standalone apps (no need to cache on first load!), image manipulation API (crop, resize, rotate, flip), face detection API, new release channel features (set the active release for a given channel and rollback), web dashboard to track standalone app builds, and a fix longstanding bug with OpenGL Android implementation and the Android multi-tasker, just to name a few things.
- We are allocating more resources to React Navigation starting this January. We strongly believe that it is both possible and desirable to build React Native navigation with just React components and primitives like Animated and `react-native-gesture-handler` and we’re really excited about some of the improvements we have planned. 
If you're looking to contribute to the community, check out [react-native-maps](https://github.com/react-community/react-native-maps) and [react-native-svg](https://github.com/react-native-community/react-native-svg), which could both use some help!

### Infinite Red

- We have our Keynote speakers for [Chain React conf](https://infinite.red/ChainReactConf): [Kent C. Dodds](https://twitter.com/kentcdodds) and [Tracy Lee](https://twitter.com/ladyleet). We will be opening CFP very soon.
- [Community chat](http://community.infinite.red/) now at 1600 people.
- [React Native Newsletter](http://reactnative.cc/) now at 8500 subscribers.
- Currently researching best practice for making RN crash resistant, reports to follow.
- Adding ability to report from [Solidarity](https://shift.infinite.red/effortless-environment-reports-d129d53eb405).
- Published a HOW-TO for releasing on [React Native and Android](https://shift.infinite.red/simple-react-native-android-releases-319dc5e29605).


### Microsoft

- A [pull request](https://github.com/Microsoft/react-native-windows/pull/1419) has been started to migrate the core React Native Windows bridge to .NET Standard, making it effectively OS-agnostic. The hope is that many other .NET Core platforms can extend the bridge with their own threading models, JavaScript runtimes, and UIManagers (think JavaScriptCore, Xamarin.Mac, Linux Gtk#, and Samsung Tizen options).

### Wix

- [Detox](https://github.com/wix/detox)
  - In order for us to scale with E2E tests, we want to minimize time spent on CI, we are working on parallelization support for Detox.
  - Submitted a [pull request](https://github.com/facebook/react-native/pull/16948) to enable support for custom flavor builds, to better support mocking on E2E.
- [DetoxInstruments](https://github.com/wix/DetoxInstruments)
  - Working on the killer feature of DetoxInstruments proves to be a very challenging task, taking JavaScript backtrace at any given time requires a custom JSCore implementation to support JS thread suspension. Testing the profiler internally on Wix’s app revealed interesting insights about the JS thread.
  - The project is still not stable enough for general use but is actively worked on, and we hope to announce it soon.
- [React Native Navigation](https://github.com/wix/react-native-navigation)
  - V2 development pace has been increased substantially, up until now, we only had 1 developer working on it 20% of his time, we now have 3 developers working on it full time!
- Android Performance
  - Replacing the old JSCore bundled in RN with its newest version (tip of webkitGTK project, with custom JIT configuration) produced 40% performance increase on the JS thread. Next up is compiling a 64bit version of it. This effort is based on [JSC build scripts for Android](https://github.com/SoftwareMansion/jsc-android-buildscripts). Follow its current status [here](https://github.com/DanielZlotin/jsc-android-buildscripts/tree/tip).

## Next sessions

There's been some discussion on re-purposing this meeting to discuss a single and specific topic (e.g. navigation, moving React Native modules into separate repos, documentation, ...). That way we feel we can contribute the best to React Native community. It might take place in the next meeting session. Feel free to tweet what you'd like to see covered as a topic.