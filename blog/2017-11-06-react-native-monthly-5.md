---
title: React Native Monthly #5
author: Tomislav Tenodi
authorTitle: Founder at Speck
authorURL: https://github.com/tenodi
authorImage: https://pbs.twimg.com/profile_images/877237660225609729/bKFDwfAq.jpg
authorTwitter: TomislavTenodi
category: engineering
---

The React Native monthly meeting continues! Let's see what our teams are up to.

### Callstack

- We’ve been working on React Native CI. Most importantly, we have migrated from Travis to Circle, leaving React Native with a single, unified CI pipeline.
- We’ve organised [Hacktoberfest - React Native edition](https://blog.callstack.io/announcing-hacktoberfest-7313ea5ccf4f) where, together with attendees, we tried to submit many pull requests to open source projects.
- We keep working on [Haul](https://github.com/callstack/haul). Last month, we have submitted two new releases, including Webpack 3 support. We plan to add [CRNA](https://github.com/react-community/create-react-native-app) and [Expo](https://github.com/expo/expo) support as well as work on better HMR. Our roadmap is public on the issue tracker. If you would like to suggest improvements or give feedback, let us know!

### Expo

- Released [Expo SDK 22](https://blog.expo.io/expo-sdk-v22-0-0-is-now-available-7745bfe97fc6) (using React Native 0.49) and updated [CRNA](https://github.com/react-community/create-react-native-app) for it.
  - Includes improved splash screen API, basic ARKit support, “DeviceMotion” API, SFAuthenticationSession support on iOS11, and [more](https://blog.expo.io/expo-sdk-v22-0-0-is-now-available-7745bfe97fc6).
- Your [snacks](https://snack.expo.io) can now have multiple JavaScript files and you can upload images and other assets by just dragging them into the editor.
- Contribute to [react-navigation](https://github.com/react-community/react-navigation) to add support for iPhone X.
- Focus our attention on rough edges when building large applications with Expo. For example:
  - First-class support for deploying to multiple environments: staging, production, and arbitrary channels. Channels will support rolling back and setting the active release for a given channel. Let us know if you want to be an early tester, [@expo_io](https://twitter.com/expo_io).
  - We are also working on improving our standalone app building infrastructure and adding support for bundling images and other non-code assets in standalone app builds while keeping the ability to update assets over the air.

### Facebook

- Better RTL support:
  - We’re introducing a number of direction-aware styles.
    - Position:
      - (left|right) → (start|end)
    - Margin:
      - margin(Left|Right) → margin(Start|End)
    - Padding:
      - padding(Left|Right) → padding(Start|End)
    - Border:
      - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
      - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
      - border(Left|Right)Width → border(Start|End)Width
      - border(Left|Right)Color → border(Start|End)Color
  - The meaning of “left” and “right” were swapped in RTL for position, margin, padding, and border styles. Within a few months, we’re going to remove this behaviour and make “left” always mean “left,” and “right” always mean “right”. The breaking changes are hidden under a flag. Use `I18nManager.swapLeftAndRightInRTL(false)` in your React Native components to opt into them. 
- Working on [Flow](https://github.com/facebook/flow) typing our internal native modules and using those to generate interfaces in Java and protocols in ObjC that the native implementations must implement. We hope this codegen becomes open source next year, at the earliest.


### Infinite Red

- New OSS tool for helping React Native and other projects. More [here](https://shift.infinite.red/solidarity-the-cli-for-developer-sanity-672fa81b98e9).
- Revamping [Ignite](https://github.com/infinitered/ignite) for a new boilerplate release (Code name: Bowser)

### Shoutem

- Improving the development flow on Shoutem. We want to streamline the process from creating an app to first custom screen and make it really easy, thus lowering the barrier for new React Native developers. Prepared a few workshops to test out new features. We also improved [Shoutem CLI](https://github.com/shoutem/cli) to support new flows.
- [Shoutem UI](https://github.com/shoutem/ui) received a few component improvements and bugfixes. We also checked compatibility with latest React Native versions.
- Shoutem platform received a few notable updates, new integrations are available as part of the [open-source extensions project](https://github.com/shoutem/extensions). We are really excited to see active development on Shoutem extensions from other developers. We actively contact and offer advice and guidance about their extensions.

## Next session

The next session is scheduled for Wednesday 6, December 2017. Feel free to ping me [on Twitter](https://twitter.com/TomislavTenodi) if you have any suggestion on how we should improve the output of the meeting.
