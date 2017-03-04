---
id: tutorial
title: Tutorial
layout: docs
category: The Basics
permalink: docs/tutorial.html
next: props
previous: getting-started
---

React Native is like React, but it uses native components instead of web components as building blocks. So to understand the basic structure of a React Native app, you need to understand some of the basic React concepts, like JSX, components, `state`, and `props`. If you already know React, you still need to learn some React-Native-specific stuff, like the native components. This
tutorial is aimed at all audiences, whether you have React experience or not.

Let's do this thing.

## Hello World

In accordance with the ancient traditions of our people, we must first build an app that does nothing except say "Hello world". Here it is:

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text } from 'react-native';

class HelloWorldApp extends Component {
  render() {
    return (
      <Text>Hello world!</Text>
    );
  }
}

AppRegistry.registerComponent('HelloWorldApp', () => HelloWorldApp);
```

If you are feeling curious, you can play around with sample code directly in the web simulators. You can also paste it into your `index.ios.js` or `index.android.js` file to create a real app on your local machine.

## What's going on here?

Some of the things in here might not look like JavaScript to you. Don't panic. This is the future.

First of all, ES2015 (also known as ES6) is a set of improvements to JavaScript that is now part of the official standard, but not yet supported by all browsers, so often it isn't used yet in web development. React Native ships with ES2015 support, so you can use this stuff without worrying about compatibility. `import`, `from`, `class`, `extends`, and the `() =>` syntax in the example above are all ES2015 features. If you aren't familiar with ES2015, you can probably pick it up just by reading through sample code like this tutorial has. If you want, [this page](https://babeljs.io/docs/learn-es2015/) has a good overview of ES2015 features.

The other unusual thing in this code example is `<Text>Hello world!</Text>`. This is JSX - a syntax for embedding XML within JavaScript. Many frameworks use a special templating language which lets you embed code inside markup language. In React, this is reversed. JSX lets you write your markup language inside code. It looks like HTML on the web, except instead of web things like `<div>` or `<span>`, you use React components. In this case, `<Text>`
is a built-in component that just displays some text.

## Component and AppRegistry

So this code is defining `HelloWorldApp`, a new `Component`, and it's registering it with the `AppRegistry`. When you're building a React Native app, you'll be making new components a lot. Anything you see on the screen is some sort of component. A component can be pretty simple - the only thing that's required is a `render` function which returns some JSX to render.

The `AppRegistry` just tells React Native which component is the root one for the whole application. You won't be thinking about `AppRegistry` a lot - there will probably just be one call to `AppRegistry.registerComponent` in your whole app. It's included in these examples so you can paste the whole thing into your `index.ios.js` or `index.android.js` file and get it running.

## This App Doesn't Do Very Much

Good point. To make components do more interesting things, you need to [learn about Props](docs/props.html).
