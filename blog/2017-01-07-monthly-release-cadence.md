---
title: A Monthly Release Cadence: Releasing December and January RC
author: Eric Vicenti
authorTitle: Engineer at Facebook
authorURL: https://twitter.com/EricVicenti
authorImage: https://secure.gravatar.com/avatar/077ad5372b65567fe952a99f3b627048?s=128
authorTwitter: EricVicenti
category: announcements
---

Shortly after React Native was introduced, we started releasing every two weeks to help the community adopt new features, while keeping versions stable for production use. At Facebook we had to stabilize the codebase every two weeks for the release of our production iOS apps, so we decided to release the open source versions at the same pace. Now, many of the Facebook apps ship once per week, especially on Android. Because we ship from master weekly, we need to keep it quite stable. So the bi-weekly release cadence doesn't even benefit internal contributors anymore.

We frequently hear feedback from the community that the release rate is hard to keep up with. Tools like [Expo](https://expo.io/) had to skip every other release in order to manage the rapid change in version. So it seems clear that the bi-weekly releases did not serve the community well.

### Now releasing monthly

We're happy to announce the new monthly release cadence, and the December 2016 release, `v0.40`, which has been stabilizing for all last month and is ready to adopt. (Just make sure to [update headers in your native modules on iOS](https://github.com/facebook/react-native/releases/tag/v0.40.0)).

Although it may vary a few days to avoid weekends or handle unforeseen issues, you can now expect a given release to be available on the first day of the month, and released on the last.

### Use the current month for the best support

The January release candidate is ready to try, and you can [see what's new here](https://github.com/facebook/react-native/releases/tag/v0.41.0-rc.0).

To see what changes are coming and provide better feedback to React Native contributors, always use the current month's release candidate when possible. By the time each version is released at the end of the month, the changes it contains will have been shipped in production Facebook apps for over two weeks.

You can easily upgrade your app with the new [react-native-git-upgrade](http://facebook.github.io/react-native/blog/2016/12/05/easier-upgrades.html) command:

```
npm install -g react-native-git-upgrade
react-native-git-upgrade 0.41.0-rc.0
```

We hope this simpler approach will make it easier for the community to keep track of changes in React Native, and to adopt new versions as quickly as possible!

(Thanks go to [Martin Konicek](https://github.com/mkonicek) for coming up with this plan and [Mike Grabowski](https://github.com/grabbou) for making it happen)
