---
title: React Native Monthly #4
author: Mike Grabowski
authorTitle: CTO at Callstack
authorURL: https://github.com/grabbou
authorImage: https://pbs.twimg.com/profile_images/836150188725121024/NkU0AcqW_400x400.jpg
authorTwitter: grabbou
category: engineering
---

The React Native monthly meeting continues! Here are the notes from each team:

### Callstack

- [React Native EU](https://react-native.eu) is over. More than 300 participants from 33 countries have visited Wroclaw. Talks can be found [on Youtube](https://www.youtube.com/channel/UCUNE_g1mQPuyW975WjgjYxA/videos).
- We are slowly getting back to our open source schedule after the conference. One thing worth mentioning is that we are working on a next release of [react-native-opentok](https://github.com/callstack/react-native-opentok) that fixes most of the existing issues.

### GeekyAnts

Trying to lower the entry barrier for the developers embracing React Native with the following things:

- Announced [BuilderX.io](https://builderx.io/) at [React Native EU](https://react-native.eu). BuilderX is a design tool that directly works with JavaScript files (only React Native is supported at the moment) to generate beautiful, readable, and editable code.
- Launched [ReactNativeSeed.com](http://reactnativeseed.com/) which provides a set of boilerplates for your next React Native project. It comes with a variety of options that include TypeScript & Flow for data-types, MobX, Redux, and mobx-state-tree for state-management with CRNA and plain React-Native as the stack.

### Expo

- Will release SDK 21 shortly, which adds support for react-native 0.48.3 and a bunch of bugfixes/reliability improvements/new features in the Expo SDK, including video recording, a new splash screen API, support for `react-native-gesture-handler`, and improved error handling.
- Re: [react-native-gesture-handler](https://github.com/kmagiera/react-native-gesture-handler), [Krzysztof Magiera](https://github.com/kmagiera) of [Software Mansion](http://swmansion.com/) continues pushing this forward and we've been helping him with testing it and funding part of his development time. Having this integrated in Expo in SDK21 will allow people to play with it easily in Snack, so we're excited to see what people come up with.
- Re: improved error logging / handling - see [this gist of an internal Expo PR](https://gist.github.com/brentvatne/00407710a854627aa021fdf90490b958) for details on logging, (in particular, "Problem 2"), and [this commit](https://github.com/expo/xdl/commit/1d62eca293dfb867fc0afc920c3dad94b7209987) for a change that handles failed attempts to import npm standard library modules. There is plenty of opportunity to improve error messages upstream in React Native in this way and we will work on follow up upstream PRs. It would be great for the community to get involved too.
- [native.directory](http://native.directory/) continues to grow, you can add your projects from [the Github repo](https://github.com/react-community/native-directory).
- Visit hackathons around North America, including [PennApps](http://pennapps.com/), [Hack The North](http://hackthenorth.com/), [HackMIT](https://hackmit.org/), and soon [MHacks](https://mhacks.org/).

### Facebook

- Working on improving `<Text>` and `<TextInput>` components on Android. (Native auto-growing for `<TextInput>`; deeply nested `<Text>` components layout issues; better code structure; performance optimizations).
- We're still looking for additional contributors who would like to help [triage issues and pull requests](https://facebook.github.io/react-native/docs/maintainers.html#facebook-github-bot).

### Microsoft

- Released Code Signing feature for CodePush. React Native developers are now able to sign their application bundles in CodePush. The announcement can be found [here](http://microsoft.github.io/code-push/articles/CodeSigningAnnouncement.html)
- Working on completing integration of CodePush to Mobile Center. Considering test/crash integration as well. 

## Next session

The next session is scheduled for Wednesday 10, October 2017. As this was only our fourth meeting, we'd like to know how do these notes benefit the React Native community. Feel free to ping me [on Twitter](https://twitter.com/grabbou) if you have any suggestion on how we should improve the output of the meeting.
