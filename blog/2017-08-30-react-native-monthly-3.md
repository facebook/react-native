---
title: React Native Monthly #3
author: Mike Grabowski
authorTitle: CTO at Callstack
authorURL: https://github.com/grabbou
authorImage: https://pbs.twimg.com/profile_images/836150188725121024/NkU0AcqW_400x400.jpg
authorTwitter: grabbou
category: engineering
---

The React Native monthly meeting continues! This month's meeting was a bit shorter as most of our teams were busy shipping. Next month, we are at [React Native EU](https://react-native.eu/) conference in Wroclaw, Poland. Make sure to grab a ticket and see you there in person! Meanwhile, let's see what our teams are up to.

## Teams

On this third meeting, we had 5 teams join us:

- [Callstack](https://github.com/callstack-io)
- [Expo](https://github.com/expo)
- [Facebook](https://github.com/facebook)
- [Microsoft](https://github.com/microsoft)
- [Shoutem](https://github.com/shoutem)

## Notes

Here are the notes from each team:

### Callstack

- Recently open sourced [`react-native-material-palette`](https://github.com/callstack-io/react-native-material-palette). It extracts prominent colors from images to help you create visually engaging apps. It's Android only at the moment, but we are looking into adding support for iOS in the future. 
- We have landed HMR support into [`haul`](https://github.com/callstack-io/haul) and a bunch of other, cool stuff! Check out latest releases.
- React Native EU 2017 is coming! Next month is all about React Native and Poland! Make sure to grab last tickets available [here](https://react-native.eu/).

### Expo

- Released support for installing npm packages on [Snack](https://snack.expo.io). Usual Expo restrictions apply -- packages can't depend on custom native APIs that aren't already included in Expo. We are also working on supporting multiple files and uploading assets in Snack. [Satyajit](https://github.com/satya164) will talk about Snack at [React Native Europe](https://react-native.eu/).
- Released SDK20 with camera, payments, secure storage, magnetometer, pause/resume fs downloads, and improved splash/loading screen.
- Continuing to work with [Krzysztof](https://github.com/kmagiera) on [react-native-gesture-handler](https://github.com/kmagiera/react-native-gesture-handler). Please give it a try, rebuild some gesture that you have previously built using PanResponder or native gesture recognizers and let us know what issues you encounter.
- Experimenting with JSC debugging protocol, working on a bunch of feature requests on [Canny](https://expo.canny.io/feature-requests).

### Facebook

- Last month we discussed management of the GitHub issue tracker and that we would try to make improvements to address the maintainability of the project.
- Currently, the number of open issues is holding steady at around 600, and it seems like it may stay that way for a while. In the past month, we have closed 690 issues due to lack of activity (defined as no comments in the last 60 days). Out of those 690 issues, 58 were re-opened for a variety of reasons (a maintainer committed to providing a fix, or a contributor made a great case for keeping the issue open).
- We plan to continue with the automated closing of stale issues for the foreseeable future. We’d like to be in a state where every impactful issue opened in the tracker is acted upon, but we’re not there yet. We need all the help we can from maintainers to triage issues and make sure we don't miss issues that introduce regressions or introduce breaking changes, especially those that affect newly created projects. People interested in helping out can use the Facebook GitHub Bot to triage issues and pull requests. The new [Maintainers Guide](https://facebook.github.io/react-native/docs/maintainers.html) contains more information on triage and use of the GitHub Bot. Please add yourself to the [issue task force](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt) and encourage other active community members to do the same!

### Microsoft

- The new Skype app is built on top of React Native in order to facilitate sharing as much code between platforms as possible. The React Native-based Skype app is currently available in the iOS and Android app stores.
- While building the Skype app on React Native, we send pull requests to React Native in order to address bugs and missing features that we come across. So far, we've gotten about [70 pull requests merged](https://github.com/facebook/react-native/pulls?utf8=%E2%9C%93&q=is%3Apr%20author%3Arigdern%20).
- React Native enabled us to power both the iOS and Android Skype apps from the same codebase. We also want to use that codebase to power the Skype web app. To help us achieve that goal, we built and open sourced a thin layer on top of React/React Native called [ReactXP](https://microsoft.github.io/reactxp/blog/2017/04/06/introducing-reactxp.html). ReactXP provides a set of cross platform components that get mapped to React Native when targeting iOS/Android and to react-dom when targeting the web. ReactXP's goals are similar to another open source library called React Native for Web. There's a brief description of how the approaches of these libraries differ in the [ReactXP FAQ](https://microsoft.github.io/reactxp/docs/faq.html).

### Shoutem

- We are continuing our efforts on improving and simplifying the developer experience when building apps using [Shoutem](https://shoutem.github.io/).
- Started migrating all our apps to react-navigation, but we ended postponing this until a more stable version is released, or one of the native navigation solutions becomes stable.
- Updating all our [extensions](https://github.com/shoutem/extensions) and most of our open source libraries ([animation](https://github.com/shoutem/animation), [theme](https://github.com/shoutem/theme), [ui](https://github.com/shoutem/ui)) to React Native 0.47.1.

## Next session

The next session is scheduled for Wednesday 13, September 2017. As this was only our third meeting, we'd like to know how do these notes benefit the React Native community. Feel free to ping me [on Twitter](https://twitter.com/grabbou) if you have any suggestion on how we should improve the output of the meeting.
