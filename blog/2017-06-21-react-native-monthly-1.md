---
title: React Native Monthly #1
author: Tomislav Tenodi
authorTitle: Product Manager at Shoutem
authorURL: https://github.com/tenodi
authorImage: https://pbs.twimg.com/profile_images/877237660225609729/bKFDwfAq.jpg
authorTwitter: TomislavTenodi
category: engineering
---

At [Shoutem](https://shoutem.github.io/), we've been fortunate enough to work with React Native from its very beginnings. We decided we wanted to be part of the amazing community from day one. Soon enough, we realized it's almost impossible to keep up with the pace the community was growing and improving. That's why we decided to organize a monthly meeting where all major React Native contributors can briefly present what their efforts and plans are.

## Monthly meetings

We had our first session of the monthly meeting on June 14, 2017. The mission for React Native Monthly is simple and straightforward: **improve the React Native community**. Presenting teams' efforts eases collaboration between teams done offline.

## Teams

On the first meeting, we had 8 teams join us:

- [Airbnb](https://github.com/airbnb)
- [Callstack](https://github.com/callstack-io)
- [Expo](https://github.com/expo)
- [Facebook](https://github.com/facebook)
- [GeekyAnts](https://github.com/GeekyAnts)
- [Microsoft](https://github.com/microsoft)
- [Shoutem](https://github.com/shoutem)
- [Wix](https://github.com/wix)

We hope to have more core contributors join the upcoming sessions!

## Notes

As teams' plans might be of interest to a broader audience, we'll be sharing them here, on the React Native blog. So, here they are:

### Airbnb

- Plans to add some A11y (accessibility) APIs to `View` and the `AccessibilityInfo` native module.
- Will be investigating adding some APIs to native modules on Android to allow for specifying threads for them to run on.
- Have been investigating potential initialization performance improvements.
- Have been investigating some more sophisticated bundling strategies to use on top of "unbundle".

### Callstack

- Looking into improving the release process by using [Detox](https://github.com/wix/detox) for E2E testing. Pull request should land soon.
- Blob pull request they have been working on has been merged, subsequent pull requests coming up.
- Increasing [Haul](https://github.com/callstack-io/haul) adoption across internal projects to see how it performs compared to [Metro Bundler](http://github.com/facebook/metro-bundler). Working on better multi-threaded performance with the Webpack team.
- Internally, they have implemented a better infrastructure to manage open source projects. Plans to be getting more stuff out in upcoming weeks.
- The React Native Europe conference is coming along, nothing interesting yet, but y'all invited!
- Stepped back from [react-navigation](https://github.com/react-community/react-navigation) for a while to investigate alternatives (especially native navigations).

### Expo

- Working on making it possible to install npm modules in [Snack](https://snack.expo.io/), will be useful for libraries to add examples to documentation.
- Working with [Krzysztof](https://github.com/kmagiera) and other people at [Software Mansion](https://github.com/softwaremansion) on a JSC update on Android and a gesture handling library.
- [Adam Miskiewicz](https://github.com/skevy) is transitioning his focus towards [react-navigation](https://github.com/react-community/react-navigation).
- [Create React Native App](https://github.com/react-community/create-react-native-app) is in the [Getting Started guide](https://facebook.github.io/react-native/docs/getting-started.html) in the docs. Expo wants to encourage library authors to explain clearly whether their lib works with CRNA or not, and if so, explain how to set it up.

### Facebook

- React Native's packager is now [Metro Bundler](https://github.com/facebook/metro-bundler), in an independent repo. The Metro Bundler team in London is excited to address the needs of the community, improve modularity for additional use-cases beyond React Native, and increase responsiveness on issues and PRs.
- In the coming months, the React Native team will work on refining the APIs of primitive components. Expect improvements in layout quirks, accessibility, and flow typing.
- The React Native team also plans on improving core modularity this year, by refactoring to fully support 3rd party platforms such as Windows and macOS.

### GeekyAnts

- The team is working on a UI/UX design app (codename: Builder) which directly works with `.js` files. Right now, it supports only React Native. It’s similar to Adobe XD and Sketch.
- The team is working hard so that you can load up an existing React Native app in the editor, make changes (visually, as a designer) and save the changes directly to the JS file.
- Folks are trying to bridge the gap between Designers and Developers and bring them on the same repo.
- Also, [NativeBase](https://github.com/GeekyAnts/NativeBase) recently reached 5,000 GitHub stars.

### Microsoft

- [CodePush](https://github.com/Microsoft/code-push) has now been integrated into [Mobile Center](https://mobile.azure.com/). This is the first step in providing a much more integrated experience with distribution, analytics and other services. See their announcement [here](https://microsoft.github.io/code-push/articles/CodePushOnMobileCenter.html).
- [VSCode](https://github.com/Microsoft/vscode) has a bug with debugging, they are working on fixing that right now and will have a new build.
- Investigating [Detox](https://github.com/wix/detox) for Integration testing, looking at JSC Context to get variables alongside crash reports.

### Shoutem

- Making it easier to work on Shoutem apps with tools from the React Native community. You will be able to use all the React Native commands to run the apps created on [Shoutem](https://shoutem.github.io/).
- Investigating profiling tools for React Native. They had a lot of problems setting it up and they will write some of the insights they discovered along the way.
- Shoutem is working on making it easier to integrate React Native with existing native apps. They will document the concept that they developed internally in the company, in order to get the feedback from the community.

### Wix

- Working internally to adopt [Detox](https://github.com/wix/detox) to move significant parts of the Wix app to "zero manual QA". As a result, Detox is being used heavily in a production setting by dozens of developers and maturing rapidly.
- Working to add support to the [Metro Bundler](https://github.com/facebook/metro-bundler) for overriding any file extension during the build. Instead of just "ios" and "android", it would support any custom extension like "e2e" or "detox". Plans to use this for E2E mocking. There's already a library out called [react-native-repackager](https://github.com/wix/react-native-repackager), now working on a PR.
- Investigating automation of performance tests. This is a new repo called [DetoxInstruments](https://github.com/wix/DetoxInstruments). You can take a look, it's being developed open source.
- Working with a contributor from KPN on Detox for Android and supporting real devices.
- Thinking about "Detox as a platform" to allow building other tools that need to automate the simulator/device. An example is [Storybook](https://github.com/storybooks/react-native-storybook) for React Native or Ram's idea for integration testing.

## Next session

Meetings will be held every four weeks. The next session is scheduled for July 12, 2017. As we just started with this meeting, we'd like to know how do these notes benefit the React Native community. Feel free to ping me [on Twitter](https://twitter.com/TomislavTenodi) if you have any suggestion on what we should cover in the following sessions, or how we should improve the output of the meeting.
