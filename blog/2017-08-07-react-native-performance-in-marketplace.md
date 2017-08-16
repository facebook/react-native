---
title: React Native Performance in Marketplace
author: Aaron Chiu
authorTitle: Software Engineer at Facebook
authorURL: https://www.facebook.com/aaronechiu
authorImage: https://fb-s-d-a.akamaihd.net/h-ak-fbx/v/t1.0-9/185908_1738453495300_6268428_n.jpg?_nc_log=1&oh=b0d497607c0d2012e88fde70cf4c7c7e&oe=59ED387B&__gda__=1509259466_d31a1cfbe282168c51f63019db5db391
authorTwitter: AaaChiuuu
category: engineering
---

React Native is used in multiple places across multiple apps in the Facebook family including a top level tab in the main Facebook apps. Our focus for this post is a highly visible product, [Marketplace](https://newsroom.fb.com/news/2016/10/introducing-marketplace-buy-and-sell-with-your-local-community/). It is available in a dozen or so countries and enables users to discover products and services provided by other users.

In the first half of 2017, through the joint effort of the Relay Team, the Marketplace team, the Mobile JS Platform team, and the React Native team, we cut Marketplace Time to Interaction (TTI) in half for Android [Year Class 2010-11 devices](https://code.facebook.com/posts/307478339448736/year-class-a-classification-system-for-android/). Facebook has historically considered these devices as low-end Android devices, and they have the slowest TTIs on any platform or device type.

A typical React Native startup looks something like this:

[![](/react-native/blog/img/RNPerformanceStartup.png)](/react-native/blog/img/RNPerformanceStartup.png)

> Disclaimer: ratios aren't representative and will vary depending on how React Native is configured and used.

We first initialize the React Native core (aka the “Bridge”) before running the product specific JavaScript which determines what native views React Native will render in the Native Processing Time.

### A different approach

One of the earlier mistakes that we made was to let [Systrace and CTScan](https://code.facebook.com/posts/747457662026706/performance-instrumentation-for-android-apps/) drive our performance efforts. These tools helped us find a lot of low-hanging fruit in 2016, but we discovered that both Systrace and CTScan are **not representative of production scenarios** and cannot emulate what happens in the wild. Ratios of time spent in the breakdowns are often incorrect and, wildly off-base at times. At the extreme, some things that we expected to take a few milliseconds actually take hundreds or thousands of milliseconds. That said, CTScan is useful and we've found it catches a third of regressions before they hit production.

On Android, we attribute the shortcomings of these tools to the fact that 1) React Native is a multithreaded framework, 2) Marketplace is co-located with a multitude of complex views such as Newsfeed and other top-level tabs, and 3) computation times vary wildly. Thus, this half, we let production measurements and breakdowns drive almost all of our decision making and prioritization.

### Down the path of production instrumentation

Instrumenting production may sound simple on the surface, but it turned out to be quite a complex process. It took multiple iteration cycles of 2-3 weeks each; due to the latency of landing a commit in master, to pushing the app to the Play Store, to gathering sufficient production samples to have confidence in our work. Each iteration cycle involved discovering if our breakdowns were accurate, if they had the right level of granularity, and if they properly added up to the whole time span. We could not rely on alpha and beta releases because they are not representative of the general population. In essence, we very tediously built a very accurate production trace based on the aggregate of millions of samples.

One of the reasons we meticulously verified that every millisecond in breakdowns properly added up to their parent metrics was that we realized early on there were gaps in our instrumentation. It turned out that our initial breakdowns did not account for stalls caused by thread jumps. Thread jumps themselves aren't expensive, but thread jumps to busy threads already doing work are very expensive. We eventually reproduced these blockages locally by sprinkling `Thread.sleep()` calls at the right moments, and we managed to fix them by:

1. removing our dependency on AsyncTask, 
2. undoing the forced initialization of ReactContext and NativeModules on the UI thread, and 
3. removing the dependency on measuring the ReactRootView at initialization time.

Together, removing these thread blockage issues reduced the startup time by over 25%.

Production metrics also challenged some of our prior assumptions. For example, we used to pre-load many JavaScript modules on the startup path under the assumption that co-locating modules in one bundle would reduce their initialization cost. However, the cost of pre-loading and co-locating these modules far outweighed the benefits. By re-configuring our inline require blacklists and removing JavaScript modules from the startup path, we were able to avoid loading unnecessary modules such as Relay Classic (when only [Relay Modern](https://facebook.github.io/relay/docs/new-in-relay-modern.html) was necessary). Today, our `RUN_JS_BUNDLE` breakdown is over 75% faster.

We also found wins by investigating product-specific native modules. For example, by lazily injecting a native module's dependencies, we reduced that native module's cost by 98%. By removing the contention of Marketplace startup with other products, we reduced startup by an equivalent interval.

The best part is that many of these improvements are broadly applicable to all screens built with React Native.

## Conclusion

People assume that React Native startup performance problems are caused by JavaScript being slow or exceedingly high network times. While speeding up things like JavaScript would bring down TTI by a non-trivial sum, each of these contribute a much smaller percentage of TTI than was previously believed.

The lesson so far has been to *measure, measure, measure!* Some wins come from moving run-time costs to build time, such as Relay Modern and [Lazy NativeModules](https://github.com/facebook/react-native/commit/797ca6c219b2a44f88f10c61d91e8cc21e2f306e). Other wins come from avoiding work by being smarter about parallelizing code or removing dead code. And some wins come from large architectural changes to React Native, such as cleaning up thread blockages. There is no grand solution to performance, and longer-term performance wins will come from incremental instrumentation and improvements. Do not let cognitive bias influence your decisions. Instead, carefully gather and interpret production data to guide future work.

## Future plans

In the long term, we want Marketplace TTI to be comparable to similar products built with Native, and, in general, have React Native performance on par with native performance. Further more, although this half we drastically reduced the bridge startup cost by about 80%, we plan to bring the cost of the React Native bridge close to zero via projects like [Prepack](https://prepack.io/) and more build time processing.


