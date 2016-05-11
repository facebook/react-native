---
id: quick-start-introduction
title: Introduction to React Native
layout: docs
category: Quick Start
permalink: docs/quick-start/introduction.html
next: quick-start-getting-started
---

React Native is a JavaScript framework for writing native, mobile applications. Instead of writing
applications in a language specific to a platform (e.g., Swift for iOS, Java for Android),
JavaScript is used, much of which can be shared across native platforms. React Native is based on
[React](http://facebook.github.io/react/), which is a JavaScript library for building user
interfaces. While React is primarily  known for targeting web browser applications, its core is used
as the basis for React Native.

## Why React Native

The React Native [introductory blog post](https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/)
bests explains why React Native was developed.

## Application Overview

React Native applications are written using JavaScript, React and
[JSX](http://facebook.github.io/react/docs/jsx-in-depth.html). React Native itself invokes a
"bridge" between your code and the native rendering API for the platform you are targeting. For
example, if you are creating an iOS application, Objective-C or Swift APIs will be invoked behind
the scenes so that your UI will use real mobile UI components, and look and feel like a native iOS
application.

In addition, React Native exposes high-level interfaces to access native platform features such as
a camera. Thus, accessing hardware features, etc. is still done from JavaScript.
