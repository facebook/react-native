---
title: React Native monthly #1
author: Tomislav Tenodi
authorTitle: Product Manager at Shoutem
authorURL: https://github.com/tenodi
authorImage: https://pbs.twimg.com/profile_images/877237660225609729/bKFDwfAq.jpg
authorTwitter: TomislavTenodi
category: engineering
---

At [Shoutem](https://shoutem.github.io/), we've been fortunate enough to work with React Native from its very beginnings. We decided we wanted to be part of the amazing community from the day one. Soon enough, we realised it's almost impossible to keep up with the pace the community was growing and improving. That's why we decided to organise the monthly meeting where all major React Native contributors could briefly present what their efforts and plans are.

## Monthly meeting

On `6/14/2017` we had the first session of the monthly meeting. The mission for React Native monthly is simple and straightforward: **improve the React Native community**. Presenting team's efforts eases collaboration between teams done offline from the meeting.

## Teams

On the first meeting, we had 8 teams joining us. Alphabetically, they are:

- [Airbnb](https://github.com/airbnb)
- [Callstack](https://github.com/callstack-io)
- [Expo](https://github.com/expo)
- [Facebook](https://github.com/facebook)
- [GeekyAnts](https://github.com/GeekyAnts)
- [Microsoft](https://github.com/microsoft)
- [Shoutem](https://github.com/shoutem)
- [Wix](https://github.com/wix)

We hope to have more core contributors joining the upcoming sessions!

## Notes

As teams' plans might be of interest to a broader audience, we'll be sharing them here, on the React Native blog. So, here they are.

### Airbnb

- We have plans to add some A11y APIs to `View` and the `AccessibilityInfo` native module
- We will be investigating adding some APIs to native modules on Android to allow for specifying threads for them to run on
- We have been investigating potential initialization performance improvements
- We have been investigating some more sophisticated bundling strategies to use on top of "unbundle"

### Callstack

- Looking into improving the release process by using [Detox](https://github.com/wix/detox) for E2E testing. PR should land soon
- Blob PR we have been working on has been merged - subsequent PRs coming up
- Increasing [Haul](https://github.com/callstack-io/haul) adoption across internal projects to see how it performs compared to Metro Bundler. We are working on better multi-threaded perf with Webpack team
- Internally, we have implemented a better infrastructure to manage open source projects, so we should be getting more stuff out in upcoming weeks
- React Native Europe is coming along, nothing interesting yet, but y'all invited!
- Stepped back from [react-navigation](https://github.com/react-community/react-navigation) for a while to investigate alternatives (esp. native navigations)

### Expo

- Working on making it possible to install npm modules in [Snack](https://snack.expo.io/), will be useful for libraries to add examples to documentation
- Working with Krzysztof and other people at Software Mansion on 1) JSC update on Android 2) gesture handling library
- Skevy is transitioning his focus towards [react-navigation](https://github.com/react-community/react-navigation)
- [Create React Native App](https://github.com/react-community/create-react-native-app) is in the [Getting Started guide](https://facebook.github.io/react-native/docs/getting-started.html) in the docs, want to encourage library authors to explain clearly whether their lib works with it or not, and if so how to set it up

### Facebook

- React Native's packager is now [Metro Bundler](https://github.com/facebook/metro-bundler), in an independent repo. The Metro Bundler team in London is excited to address the needs of the community, improve modularity for additional use-cases beyond RN, and increase responsiveness on issues and PRs.
- In the coming months, the RN team will work on refining the APIs of primitive components. Expect improvements in layout quirks, accessibility, and flow typing
- The RN team also plans on improving core modularity this year, by refactoring to fully support 3rd party platforms such as Windows and macOS.

### GeekyAnts

- The team is working on a UI/UX design app (codename: Builder) which directly works with `.js` files. Right now, it supports only React Native. It’s similar to Adobe XD and Sketch.
- The team is working hard so that you can load up an existing React Native app in the editor, make changes (visually, as a designer) and save the changes directly to the JS file.
- Folks are trying to bridge the gap between Designers and Developers and bring them on the same repo.
- Also, [NativeBase](https://github.com/GeekyAnts/NativeBase) reached 5,000 GitHub stars.

### Microsoft

- [CodePush](https://github.com/Microsoft/code-push) has now been integrated into [Mobile Center](https://mobile.azure.com/). This is the first step in providing a much more integrated experience with distribution, analytics and other services. [link](https://microsoft.github.io/code-push/articles/CodePushOnMobileCenter.html)
- [VSCode](https://github.com/Microsoft/vscode) has a bug with debugging, we are working on fixing that right now and will have a new build
- Investigating [Detox](https://github.com/wix/detox) for Integration testing, looking at JSC Context to get variables alongside crash reports

### Shoutem

- Making it easier to work on Shoutem apps with tools from the React Native community. You will be able to use all the React Native commands to run the apps created on [Shoutem](https://shoutem.github.io/)
- Investigating profiling tools for React Native. We had a lot of problems setting it up and we'll write some of the insights we discovered along the way
- Working on making it easier to integrate React Native with existing native apps. We'll document concept that we developed internally in the company, so we can get the feedback from the community

### Wix

- Working internally to adopt [Detox](https://github.com/wix/detox) to move significant parts of the Wix app to "zero manual QA". As a result, Detox is being used heavily in a production setting by dozens of developers and maturing rapidly.
- Working to add support to the packager ([Metro Bundler](https://github.com/facebook/metro-bundler)) for overriding any file extension during the build. Instead of just "ios" and "android" to any custom one like "e2e" or "detox". We plan to use this for E2E mocking. There's already a library out called [react-native-repackager](https://github.com/wix/react-native-repackager), now working on a PR.
- Investigating automation of performance tests. This is a new repo called [DetoxInstruments](https://github.com/wix/DetoxInstruments). You can take a look, it's being developed open source.
- Working with a contributor from KPN on Detox for Android and supporting real devices.
- Thinking about "Detox as a platform" to allow building other tools that need to automate the simulator/device. An example is [Storybook](https://github.com/storybooks/react-native-storybook) for React Native or Ram's idea for integration testing.

## Next session

The next session is scheduled for `7/12/2017` (the meeting is actually held every 4 weeks). As we just started with this meeting, we'd like to know how do these notes benefit the React Native community. Feel free to ping me [on Twitter](https://twitter.com/TomislavTenodi) if you have any suggestion what should we cover in the following sessions or how should we improve the output of the meeting.
