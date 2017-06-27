---
title: Making React Native apps accessible
author: Georgiy Kassabli
authorTitle: Software Engineer at Facebook
authorURL: https://www.facebook.com/georgiy.kassabli
authorImage: https://scontent-sea1-1.xx.fbcdn.net/v/t1.0-1/c0.0.160.160/p160x160/1978838_795592927136196_1205041943_n.jpg?_nc_log=1&oh=d7a500fdece1250955a4d27b0a80fee2&oe=59E8165A
hero: /react-native/blog/img/blue-hero.jpg
category: engineering
---

With the recent launch of React on web and React Native on mobile, we've provided a new front-end framework for developers to build products. One key aspect of building a robust product is ensuring that anyone can use it, including people who have vision loss or other disabilities. The Accessibility API for React and React Native enables you to make any React-powered experience usable by someone who may use assistive technology, like a screen reader for the blind and visually impaired.

For this post, we're going to focus on React Native apps. We've designed the React Accessibility API to look and feel similar to the iOS and Android APIs. If you've developed accessible applications for the web, iOS, or Android before, you should feel comfortable with the framework and nomenclature of the React AX API. For instance, you can make a UI element _accessible_ (therefore exposed to assistive technology) and use _accessibilityLabel_ to provide a string description for the element:

```
<View accessible={true} accessibilityLabel=”This is simple view”>
```

Let's walk through a slightly more involved application of the React AX API by looking at one of Facebook's own React-powered products: the **Ads Manager app**.

<footer>
  <a href="https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/" class="btn">Read more</a>
</footer>

> This is an excerpt. Read the rest of the post on [Facebook Code](https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/).
