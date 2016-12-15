---
title: San Francisco Meetup Recap
author: Héctor Ramos
authorTitle: Developer Advocate at Facebook
authorURL: https://twitter.com/hectorramos
authorImage: https://s.gravatar.com/avatar/f2223874e66e884c99087e452501f2da?s=128
authorTwitter: hectorramos
hero: /react-native/blog/img/rnmsf-august-2016-hero.jpg
category: events
---

Last week I had the opportunity to attend the [React Native Meetup](http://www.meetup.com/React-Native-San-Francisco/photos/27168649/#452793854) at Zynga’s San Francisco office. With around 200 people in attendance, it served as a great place to meet other developers near me that are also interested in React Native.

I was particularly interested in learning more about how React and React Native are used at companies like Zynga, Netflix, and Airbnb. The agenda for the night would be as follows:

* Rapid Prototyping in React
* Designing APIs for React Native
* Bridging the Gap: Using React Native in Existing Codebases

But first, the event started off with a quick introduction and a brief recap of recent news:

* Did you know that React Native is now the [top Java repository on GitHub](https://twitter.com/jamespearce/status/759637111880359937)?
* [rnpm](https://github.com/rnpm/rnpm) is now part of React Native core! You can now use `react-native link` in place of `rnpm link` to [install libraries with native dependencies](https://facebook.github.io/react-native/docs/linking-libraries-ios.html).
* The React Native Meetup community is growing fast! There are now over 4,800 developers across a variety of React Native meetup groups all over the globe.

If [one of these meetups](http://www.meetup.com/find/?allMeetups=false&keywords=react+native&radius=Infinity&userFreeform=San+Francisco%2C+CA&mcId=z94105&mcName=San+Francisco%2C+CA&sort=recommended&eventFilter=mysugg) is held near you, I highly recommend attending!

## Rapid Prototyping in React at Zynga

The first round of news was followed by a quick introduction by Zynga, our hosts for the evening. Abhishek Chadha talked about how they use React to quickly prototype new experiences on mobile, demoing a quick prototype of a Draw Something-like app. They use a similar approach as React Native, providing access to native APIs via a bridge. This was demonstrated when Abhishek used the device's camera to snap a photo of the audience and then drew a hat on someone's head.

## Designing APIs for React Native at Netflix

Up next, the first featured talk of the evening. [Clarence Leung](https://twitter.com/clarler), Senior Software Engineer at Netflix, presented his talk on Designing APIs for React Native. First he noted the two main types of libraries one may work on: components such as tab bars and date pickers, and libraries that provide access to native services such as the camera roll or in-app payments. There are two ways one may approach when building a library for use in React Native:

* Provide platform-specific components
* A cross-platform library with a similar API for both iOS and Android

Each approach has its own considerations, and it’s up to you to determine what works best for your needs.

**Approach #1**

As an example of platform-specific components, Clarence talked about the DatePickerIOS and DatePickerAndroid from core React Native. On iOS, date pickers are rendered as part of the UI and can be easily embedded in an existing view, while date pickers on Android are presented modally. It makes sense to provide separate components in this case.

**Approach #2**

Photo pickers, on the other hand, are treated similarly on iOS and Android. There are some slight differences — Android does not group photos into folders like iOS does with Selfies, for example — but those are easily handled using `if` statements and the `Platform` component.

Regardless of which approach you settle on, it’s a good idea to minimize the API surface and build app-specific libraries. For example, iOS’s In-App Purchase framework supports one-time, consumable purchases, as well as renewable subscriptions. If your app will only need to support consumable purchases, you may get away with dropping support for subscriptions in your cross-platform library.

![](/react-native/blog/img/rnmsf-august-2016-netflix.jpg)

There was a brief Q&A session at the end of Clarence’s talk. One of the interesting tid bits that came out of it was that around 80% of the React Native code written for these libraries at Netflix is shared across both iOS and Android.

## Bridging the Gap, Using React Native in Existing Codebases

The final talk of the night was by [Leland Richardson](https://twitter.com/intelligibabble) from Airbnb. The talk was focused on the use of React Native in existing codebases. I already know how easy it is to write a new app from scratch using React Native, so I was very interested to hear about Airbnb’s experience adopting React Native in their existing native apps.

Leland started off by talking about greenfield apps versus brownfield apps. Greenfield means to start a project without the need to consider any prior work. This is in contrast to brownfield projects where you need to take into account the existing project’s requirements, development processes, and all of the teams various needs.

When you’re working on a greenfield app, the React Native CLI sets up a single repository for both iOS and Android and everything just works. The first challenge against using React Native at Airbnb was the fact that the iOS and Android app each had their own repository. Multi-repo companies have some hurdles to get past before they can adopt React Native.

To get around this, Airbnb first set up a new repo for the React Native codebase. They used their continuous integration servers to mirror the iOS and Android repos into this new repo. After tests are run and the bundle is built, the build artifacts are synced back to the iOS and Android repos. This allows the mobile engineers to work on native code without altering their development enviroment. Mobile engineers don't need to install npm, run the packager, or remember to build the JavaScript bundle. The engineers writing actual React Native code do not have to worry about syncing their code across iOS and Android, as they work on the React Native repository directly.

This does come with some drawbacks, mainly they could not ship atomic updates. Changes that require a combination of native and JavaScript code would require three separate pull requests, all of which had to be carefully landed. In order to avoid conflicts, CI will fail to land changes back to the iOS and Android repos if master has changed since the build started. This would cause long delays during high commit frequency days (such as when new releases are cut).

Airbnb has since moved to a mono repo approach. Fortunately this was already under consideration, and once the iOS and Android teams became comfortable with using React Native they were happy to accelerate the move towards the mono repo.

This has solved most of the issues they had with the split repo approach. Leland did note that this does cause a higher strain on the version control servers, which may be an issue for smaller companies.

![](/react-native/blog/img/rnmsf-august-2016-airbnb.jpg)

### The Navigation Problem

The second half of Leland's talk focused on a topic that is dear to me: the Navigation problem in React Native. He talked about the abundance of navigation libraries in React Native, both first party and third party. NavigationExperimental was mentioned as something that seemed promising, but ended up not being well suited for their use case.

In fact, none of the existing navigation libraries seem to work well for brownfield apps. A brownfield app requires that the navigation state be fully owned by the native app. For example, if a user’s session expires while a React Native view is being presented, the native app should be able to take over and present a login screen as needed.

Airbnb also wanted to avoid replacing native navigation bars with JavaScript versions as part of a transition, as the effect could be jarring. Initially they limited themselves to modally presented views, but this obviously presented a problem when it came to adopting React Native more widely within their apps.

They decided that they needed their own library. The library is called `airbnb-navigation`. The library has not yet being open sourced as it is strongly tied to Airbnb’s codebase, but it is something they’d like to release by the end of the year.

I won’t go into much detail into the library’s API, but here are some of the key takeaways:

* One must preregister scenes ahead of time
* Each scene is displayed within its own `RCTRootView`. They are presented natively on each platform (e.g. `UINavigationController`s are used on iOS).
* The main `ScrollView` in a scene should be wrapped in a `ScrollScene` component. Doing so allows you to take advantage of native behaviors such as tapping on the status bar to scroll to the top on iOS.
* Transitions between scenes are handled natively, no need to worry about performance.
* The Android back button is automatically supported.
* They can take advantage of View Controller based navigation bar styling via a Navigator.Config UI-less component.

There’s also some considerations to keep in mind:

* The navigation bar is not easily customized in JavaScript, as it is a native component. This is intentional, as using native navigation bars is a hard requirement for this type of library.
* ScreenProps must be serialized/de-serialized whenever they're sent through the bridge, so care must be taken if sending too much data here.
* Navigation state is owned by the native app (also a hard requirement for the library), so things like Redux cannot manipulate navigation state.

Leland's talk was also followed by a Q&A session. Overall, Airbnb is satisfied with React Native. They’re interested in using Code Push to fix any issues without going through the App Store, and their engineers love Live Reload, as they don't have to wait for the native app to be rebuilt after every minor change.

## Closing Remarks

The event ended with some additional React Native news:

* Deco announced their [React Native Showcase](https://www.decosoftware.com/showcase), and invited everyone to add their app to the list.
* The recent [documentation overhaul](https://facebook.github.io/react-native/blog/2016/07/06/toward-better-documentation.html) got a shoutout!
* Devin Abbott, one of the creators of Deco IDE, will be teaching an introductory [React Native course](https://www.decosoftware.com/course).

![](/react-native/blog/img/rnmsf-august-2016-docs.jpg)

Meetups provide a good opportunity to meet and learn from other developers in the community. I'm looking forward to attending more React Native meetups in the future. If you make it up to one of these, please look out for me and let me know how we can make React Native work better for you!
