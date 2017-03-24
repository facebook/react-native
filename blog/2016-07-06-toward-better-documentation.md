---
title: Toward Better Documentation
author: Kevin Lacker
authorTitle: Engineering Manager at Facebook
authorURL: https://twitter.com/lacker
authorImage: http://www.gravatar.com/avatar/9b790592be15d4f55a5ed7abb5103304?s=128
authorTwitter: lacker
category: announcements
---

Part of having a great developer experience is having great documentation. A lot goes into creating good docs - the ideal documentation is concise, helpful, accurate, complete, and delightful. Recently we've been working hard to make the docs better based on your feedback, and we wanted to share some of the improvements we've made.

## Inline Examples

When you learn a new library, a new programming language, or a new framework, there's a beautiful moment when you first write a bit of code, try it out, see if it works... and it *does* work. You created something real. We wanted to put that visceral experience right into our docs. Like this:

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, View } from 'react-native';

class ScratchPad extends Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <Text style={{fontSize: 30, flex: 1, textAlign: 'center'}}>
          Isn't this cool?
        </Text>
        <Text style={{fontSize: 100, flex: 1, textAlign: 'center'}}>
          👍
        </Text>
      </View>
    );
  }
}

AppRegistry.registerComponent('ScratchPad', () => ScratchPad);
```

We think these inline examples, using the [`react-native-web-player`](https://github.com/dabbott/react-native-web-player) module with help from [Devin Abbott](https://twitter.com/devinaabbott), are a great way to learn the basics of React Native, and we have updated our [tutorial for new React Native developers](/react-native/docs/tutorial.html) to use these wherever possible. Check it out - if you have ever been curious to see what would happen if you modified just one little bit of sample code, this is a really nice way to poke around. Also, if you're building developer tools and you want to show a live React Native sample on your own site, [`react-native-web-player`](https://github.com/dabbott/react-native-web-player) can make that straightforward.

The core simulation engine is provided by [Nicolas Gallagher](https://twitter.com/necolas)'s [`react-native-web`](https://github.com/necolas/react-native-web) project, which provides a way to display React Native components like `Text` and `View` on the web. Check out [`react-native-web`](https://github.com/necolas/react-native-web) if you're interested in building mobile and web experiences that share a large chunk of the codebase.

## Better Guides

In some parts of React Native, there are multiple ways to do things, and we've heard feedback that we could provide better guidance.

We have a new [guide to Navigation](/react-native/docs/navigator-comparison.html) that compares the different approaches and advises on what you should use - `Navigator`, `NavigatorIOS`, `NavigationExperimental`. In the medium term, we're working towards improving and consolidating those interfaces. In the short term, we hope that a better guide will make your life easier.

We also have a new [guide to handling touches](/react-native/docs/handling-touches.html) that explains some of the basics of making button-like interfaces, and a brief summary of the different ways to handle touch events.

Another area we worked on is Flexbox. This includes tutorials on how to [handle layout with Flexbox](/react-native/docs/flexbox.html) and how to control [the size of components](/react-native/docs/height-and-width.html). It also includes an unsexy but hopefully-useful [list of all the props that control layout in React Native](/react-native/docs/layout-props.html).

## Getting Started

When you start getting a React Native development environment set up on your machine, you do have to do a bunch of installing and configuring things. It's hard to make installation a really fun and exciting experience, but we can at least make it as quick and painless as possible.

We built a [new Getting Started workflow](/react-native/releases/next/docs/getting-started.html) that lets you select your development operating system and your mobile operating system up front, to provide one concise place with all the setup instructions. We also went through the installation process to make sure everything worked and to make sure that every decision point had a clear recommendation. After testing it out on our innocent coworkers, we're pretty sure this is an improvement.

We also worked on the [guide to integrating React Native into an existing app](/react-native/docs/integration-with-existing-apps.html). Many of the largest apps that use React Native, like the Facebook app itself, actually build part of the app in React Native, and part of it using regular development tools. We hope this guide makes it easier for more people to build apps this way.

## We Need Your Help

Your feedback lets us know what we should prioritize. I know some people will read this blog post and think "Better docs? Pffft. The documentation for X is still garbage!". That's great - we need that energy. The best way to give us feedback depends on the sort of feedback.

If you find a mistake in the documentation, like inaccurate descriptions or code that doesn't actually work, [file an issue](https://github.com/facebook/react-native/issues). Tag it with "Documentation", so that it's easier to route it to the right people.

If there isn't a specific mistake, but something in the documentation is fundamentally confusing, it's not a great fit for a GitHub issue. Instead, post on [Canny](https://react-native.canny.io/feature-requests) about the area of the docs that could use help. This helps us prioritize when we are doing more general work like guide-writing.

Thanks for reading this far, and thanks for using React Native!
