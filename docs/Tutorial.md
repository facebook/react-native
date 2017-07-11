---
id: tutorial
title: Learn the Basics
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

export default class HelloWorldApp extends Component {
  render() {
    return (
      <Text>Hello world!</Text>
    );
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => HelloWorldApp);
```

If you are feeling curious, you can play around with sample code directly in the web simulators. You can also paste it into your `App.js`, `index.ios.js`, or `index.android.js` file to create a real app on your local machine.

## What's going on here?

Some of the things in here might not look like JavaScript to you. Don't panic. _This is the future_.

First of all, ES2015 (also known as ES6) is a set of improvements to JavaScript that is now part of the official standard, but not yet supported by all browsers, so often it isn't used yet in web development. React Native ships with ES2015 support, so you can use this stuff without worrying about compatibility. `import`, `from`, `class`, `extends`, and the `() =>` syntax in the example above are all ES2015 features. If you aren't familiar with ES2015, you can probably pick it up just by reading through sample code like this tutorial has. If you want, [this page](https://babeljs.io/learn-es2015/) has a good overview of ES2015 features.

The other unusual thing in this code example is `<Text>Hello world!</Text>`. This is JSX - a syntax for embedding XML within JavaScript. Many frameworks use a special templating language which lets you embed code inside markup language. In React, this is reversed. JSX lets you write your markup language inside code. It looks like HTML on the web, except instead of web things like `<div>` or `<span>`, you use React components. In this case, `<Text>`
is a built-in component that just displays some text.

## Components

So this code is defining `HelloWorldApp`, a new `Component`. When you're building a React Native app, you'll be making new components a lot. Anything you see on the screen is some sort of component. A component can be pretty simple - the only thing that's required is a `render` function which returns some JSX to render.

<div class="banner-crna-ejected">
  <h3>Projects With Native Code Only</h3>
  <p>
    In the particular example above, <code>HelloWorldApp</code> is registered with the <code>AppRegistry</code>. The <code>AppRegistry</code> just tells React Native which component is the root one for the whole application. It's included in these examples so you can paste the whole thing into your <code>index.ios.js</code> or <code>index.android.js</code> file and get it running. If you have a project from Create React Native App, this is handled for you and it's not necessary to call <code>AppRegistry</code> in your code.
  </p>
</div>


## This app doesn't do very much

Good point. To make components do more interesting things, you need to [learn about Props](docs/props.html).
