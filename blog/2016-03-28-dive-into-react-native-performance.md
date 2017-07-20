---
title: Dive into React Native Performance
author: Pieter De Baets
authorTitle: Software Engineer at Facebook
authorURL: https://github.com/javache
authorImage: https://avatars1.githubusercontent.com/u/5676?v=3&s=460
authorTwitter: javache
category: engineering
---

React Native allows you to build iOS and Android apps in JavaScript using React and Relay's declarative programming model. This leads to more concise, easier-to-understand code; fast iteration without a compile cycle; and easy sharing of code across multiple platforms. You can ship faster and focus on details that really matter, making your app look and feel fantastic. Optimizing performance is a big part of this. Here is the story of how we made React Native app startup twice as fast.

## Why the hurry?

With an app that runs faster, content loads quickly, which means people get more time to interact with it, and smooth animations make the app enjoyable to use. In emerging markets, where [2011 class phones](https://code.facebook.com/posts/952628711437136/classes-performance-and-network-segmentation-on-android/) on [2G networks](https://newsroom.fb.com/news/2015/10/news-feed-fyi-building-for-all-connectivity/) are the majority, a focus on performance can make the difference between an app that is usable and one that isn't.

Since releasing React Native on [iOS](https://facebook.github.io/react/blog/2015/03/26/introducing-react-native.html) and on [Android](https://code.facebook.com/posts/1189117404435352/react-native-for-android-how-we-built-the-first-cross-platform-react-native-app/), we have been improving list view scrolling performance, memory efficiency, UI responsiveness, and app startup time. Startup sets the first impression of an app and stresses all parts of the framework, so it is the most rewarding and challenging problem to tackle.

<footer>
  <a href="https://code.facebook.com/posts/895897210527114/dive-into-react-native-performance/" class="btn">Read more</a>
</footer>

> This is an excerpt. Read the rest of the post on [Facebook Code](https://code.facebook.com/posts/895897210527114/dive-into-react-native-performance/).
