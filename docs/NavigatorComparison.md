---
id: navigator-comparison
title: Navigator Comparison
layout: docs
category: Guides
permalink: docs/navigator-comparison.html
next: known-issues
---

The differences between [Navigator](docs/navigator.html)
and [NavigatorIOS](docs/navigatorios.html) are a common
source of confusion for newcomers.

Both `Navigator` and `NavigatorIOS` are components that allow you to
manage the navigation in your app between various "scenes" (another word
for screens). They manage a route stack and allow you to pop, push, and
replace states. In this way, [they are similar to the html5 history
API](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history).
The primary distinction between the two is that `NavigatorIOS` leverages
the iOS
[UINavigationController](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/)
class, and `Navigator` re-implements that functionality entirely in
JavaScript as a React component. A corollary of this is that `Navigator`
will be compatible with Android and iOS, whereas `NavigatorIOS` will
only work on the one platform. Below is an itemized list of differences
between the two.

## Navigator

- Extensive API makes it completely customizable from JavaScript.
- Under active development from the React Native team.
- Written in JavaScript.
- Works on iOS and Android.
- Includes a simple navigation bar component similar to the default `NavigatorIOS` bar: `Navigator.NavigationBar`, and another with breadcrumbs called `Navigator.BreadcrumbNavigationBar`. See the UIExplorer demo to try them out and see how to use them.
  - Currently animations are good and improving, but they are still less refined than Apple's, which you get from `NavigatorIOS`.
- You can provide your own navigation bar by passing it through the `navigationBar` prop.

## NavigatorIOS

- Small, limited API makes it much less customizable than `Navigator` in its current form.
- Development belongs to open-source community - not used by the React Native team on their apps.
  - A result of this is that there is currently a backlog of unresolved bugs, nobody who uses this has stepped up to take ownership for it yet.
- Wraps UIKit, so it works exactly the same as it would on another native app. Lives in Objective-C and JavaScript.
  - Consequently, you get the animations and behavior that Apple has developed.
- iOS only.
- Includes a navigation bar by default; this navigation bar is not a React Native view component and the style can only be slightly modified.

For most non-trivial apps, you will want to use `Navigator` - it won't be long before you run into issues when trying to do anything complex with `NavigatorIOS`.
