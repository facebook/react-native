---
title: React Native Monthly #2
author: Tomislav Tenodi
authorTitle: Product Manager at Shoutem
authorURL: https://github.com/tenodi
authorImage: https://pbs.twimg.com/profile_images/877237660225609729/bKFDwfAq.jpg
authorTwitter: TomislavTenodi
category: engineering
---

The React Native monthly meeting continues! On this session, we were joined by [Infinite Red](https://infinite.red/), great minds behind [Chain React, the React Native Conference](https://infinite.red/ChainReactConf). As most of the people here were presenting talks at Chain React, we pushed the meeting to a week later. Talks from the conference have been [posted online](https://www.youtube.com/playlist?list=PLFHvL21g9bk3RxJ1Ut5nR_uTZFVOxu522) and I encourage you to check them out. So, let's see what our teams are up to.

## Teams

On this second meeting, we had 9 teams join us:

- [Airbnb](https://github.com/airbnb)
- [Callstack](https://github.com/callstack-io)
- [Expo](https://github.com/expo)
- [Facebook](https://github.com/facebook)
- [GeekyAnts](https://github.com/GeekyAnts)
- [Infinite Red](https://github.com/infinitered)
- [Microsoft](https://github.com/microsoft)
- [Shoutem](https://github.com/shoutem)
- [Wix](https://github.com/wix)

## Notes

Here are the notes from each team:

### Airbnb

- Check out the [Airbnb repository](https://github.com/airbnb) for React Native related projects.

### Callstack

- [Mike Grabowski](https://github.com/grabbou) has been managing React Native's monthly releases as always, including a few betas that were pushed out. In particular, working on getting a v0.43.5 build published to npm since it unblocks Windows users!
- Slow but consistent work is happening on [Haul](https://github.com/callstack-io/haul). There is a pull request that adds HMR, and other improvements have shipped. Recently got a few industry leaders to adopt it. Possibly planning to start a full-time paid work in that area.
- [Michał Pierzchała](https://twitter.com/thymikee) from the [Jest](https://github.com/facebook/jest) team has joined us at Callstack this month. He will help maintain [Haul](https://github.com/callstack-io/haul) and possibly work on [Metro Bundler](https://github.com/facebook/metro-bundler) and [Jest](https://github.com/facebook/jest).
- [Satyajit Sahoo](https://twitter.com/satya164) is now with us, yay!
- Got a bunch of cool stuff coming up from our OSS department. In particular, working on bringing Material Palette API to React Native. Planning to finally release our native iOS kit which is aimed to provide 1:1 look & feel of native components.

### Expo

- Recently launched [Native Directory](https://native.directory) to help with discoverability and evaluation of libraries in React Native ecosystem. The problem: lots of libraries, hard to test, need to manually apply heuristics and not immediately obvious which ones are just the best ones that you should use. It's also hard to know if something is compatible with CRNA/Expo. So Native Directory tries to solve these problems. Check it out and [add your library](https://github.com/react-community/native-directory) to it. The list of libraries is in [here](https://github.com/react-community/native-directory/blob/master/react-native-libraries.json). This is just our first pass of it, and we want this to be owned and run by the community, not just Expo folks. So please pitch in if you think this is valuable and want to make it better!
- Added initial support for installing npm packages in [Snack](https://snack.expo.io/) with Expo SDK 19. Let us know if you run into any issues with it, we are still working through some bugs. Along with Native Directory, this should make it easy to test libraries that have only JS dependencies, or dependencies included in [Expo SDK](https://github.com/expo/expo-sdk). Try it out:
  - [react-native-modal](https://snack.expo.io/ByBCD_2r-)
  - [react-native-animatable](https://snack.expo.io/SJfJguhrW)
  - [react-native-calendars](https://snack.expo.io/HkoXUdhr-)
- [Released Expo SDK19](https://blog.expo.io/expo-sdk-v19-0-0-is-now-available-821a62b58d3d) with a bunch of improvements across the board, and we're now using the [updated Android JSC](https://github.com/SoftwareMansion/jsc-android-buildscripts).
- Working on a guide in docs with [Alexander Kotliarskyi](https://github.com/frantic) with a list of tips on how to improve the user experience of your app. Please join in and add to the list or help write some of it!
  - Issue: [#14979](https://github.com/facebook/react-native/issues/14979)
  - Initial pull request: [#14993](https://github.com/facebook/react-native/pull/14993)
- Continuing to work on: audio/video, camera, gestures (with Software Mansion, `react-native-gesture-handler`), GL camera integration and hoping to land some of these for the first time in SDK20 (August), and significant improvements to others by then as well. We're just getting started on building infrastructure into the Expo client for background work (geolocation, audio, handling notifications, etc.).
- [Adam Miskiewicz](https://twitter.com/skevy) has made some nice progress on imitating the transitions from [UINavigationController](https://developer.apple.com/documentation/uikit/uinavigationcontroller) in [react-navigation](https://github.com/react-community/react-navigation). Check out an earlier version of it in [his tweet](https://twitter.com/skevy/status/884932473070735361) - release coming with it soon. Also check out `MaskedViewIOS` which he [upstreamed](https://github.com/facebook/react-native/commit/8ea6cea39a3db6171dd74838a6eea4631cf42bba). If you have the skills and desire to implement `MaskedView` for Android that would be awesome!

### Facebook

- Facebook is internally exploring being able to embed native [ComponentKit](http://componentkit.org/) and [Litho](https://fblitho.com/) components inside of React Native.
- Contributions to React Native are very welcome! If you are wondering how you can contribute, the ["How to Contribute" guide](http://facebook.github.io/react-native/docs/contributing.html) describes our development process and lays out the steps to send your first pull request. There are other ways to contribute that do not require writing code, such as by triaging issues or updating the docs.
  - At the time of writing, React Native has **635** [open issues](https://github.com/facebook/react-native/issues) and **249** [open pull requests](https://github.com/facebook/react-native/pulls). This is overwhelming for our maintainers, and when things get fixed internally, it is difficult to ensure the relevant tasks are updated.
  - We are unsure what the best approach is to handle this while keeping the community satisfied. Some (but not all!) options include closing stale issues, giving significantly more people permissions to manage issues, and automatically closing issues that do not follow the issue template. We wrote a ["What to Expect from Maintainers"](http://facebook.github.io/react-native/docs/maintainers.html) guide to set expectations and avoid surprises. If you have ideas on how we can make this experience better for maintainers as well as ensuring people opening issues and pull requests feel heard and valued, please let us know!

### GeekyAnts

- We demoed the Designer Tool which works with React Native files on Chain React. Many attendees signed up for the waiting list.  
- We are also looking at other cross-platform solutions like [Google Flutter](https://flutter.io/) (a major comparison coming along), [Kotlin Native](https://github.com/JetBrains/kotlin-native), and [Apache Weex](https://weex.incubator.apache.org/) to understand the architectural differences and what we can learn from them to improve the overall performance of React Native.
- Switched to [react-navigation](https://github.com/react-community/react-navigation) for most of our apps, which has improved the overall performance.
- Also, announced [NativeBase Market](https://market.nativebase.io/) - A marketplace for React Native components and apps (for and by the developers).

### Infinite Red

- We want to introduce the [Reactotron](https://github.com/infinitered/reactotron). Check out the [introductory video](https://www.youtube.com/watch?v=tPBRfxswDjA). We'll be adding more features very soon!
- Organised Chain React Conference. It was awesome, thanks all for coming! [The videos are now online!](https://www.youtube.com/playlist?list=PLFHvL21g9bk3RxJ1Ut5nR_uTZFVOxu522)

### Microsoft

- [CodePush](https://github.com/Microsoft/code-push) has now been integrated into [Mobile Center](https://mobile.azure.com/). Existing users will have no change in their workflow.
  - Some people have reported an issue with duplicate apps - they already had an app on Mobile Center. We are working on resolving them, but if you have two apps, let us know, and we can merge them for you.
- Mobile Center now supports Push Notifications for CodePush. We also showed how a combination of Notifications and CodePush could be used for A/B testing apps - something unique to the ReactNative architecture.
- [VSCode](https://github.com/Microsoft/vscode) has a known debugging issue with ReactNative - the next release of the extension in a couple of days will be fixing the issue.
- Since there are many other teams also working on React Native inside Microsoft, we will work on getting better representation from all the groups for the next meeting. 

### Shoutem

- Finished the process of making the React Native development easier on [Shoutem](https://shoutem.github.io/). You can use all the standard `react-native` commands when developing apps on Shoutem.
- We did a lot of work trying to figure out how to best approach the profiling on React Native. A big chunk of [documentation](https://facebook.github.io/react-native/docs/performance.html) is outdated, and we'll do our best to create a pull request on the official docs or at least write some of our conclusions in a blog post.
- Switching our navigation solution to [react-navigation](https://github.com/react-community/react-navigation), so we might have some feedback soon.
- We released [a new HTML component](https://github.com/shoutem/ui/tree/develop/html) in our toolkit which transforms the raw HTML to the React Native components tree.

### Wix

- We started working on a pull request to [Metro Bundler](https://github.com/facebook/metro-bundler) with [react-native-repackager](https://github.com/wix/react-native-repackager) capabilities. We updated react-native-repackager to support RN 44 (which we use in production). We are using it for our mocking infrastructure for [detox](https://github.com/wix/detox).
- We have been covering the Wix app in detox tests for the last three weeks. It's an amazing learning experience of how to reduce manual QA in an app of this scale (over 40 engineers). We have resolved several issues with detox as a result, a new version was just published. I am happy to report that we are living up to the "zero flakiness policy" and the tests are passing consistently so far.
- Detox for Android is moving forward nicely. We are getting significant help from the community. We are expecting an initial version in about two weeks.
- [DetoxInstruments](https://github.com/wix/detoxinstruments), our performance testing tool, is getting a little bigger than we originally intended. We are now planning to turn it into a standalone tool that will not be tightly coupled to detox. It will allow investigating the performance of iOS apps in general. It will also be integrated with detox so we can run automated tests on performance metrics.

## Next session

The next session is scheduled for August 16, 2017. As this was only our second meeting, we'd like to know how do these notes benefit the React Native community. Feel free to ping me [on Twitter](https://twitter.com/TomislavTenodi) if you have any suggestion on how we should improve the output of the meeting.
