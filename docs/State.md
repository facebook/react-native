---
id: state
title: State
layout: docs
category: The Basics
permalink: docs/state.html
next: style
previous: props
---

There are two types of data that control a component: `props` and `state`. `props` are set by the parent and they are fixed throughout the lifetime of a component. For data that is going to change, we have to use `state`.

In general, you should initialize `state` in the constructor, and then call `setState` when you want to change it.

For example, let's say we want to make text that blinks all the time. The text itself gets set once when the blinking component gets created, so the text itself is a `prop`. The "whether the text is currently on or off" changes over time, so that should be kept in `state`.

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, Text, View } from 'react-native';

class Blink extends Component {
  constructor(props) {
    super(props);
    this.state = {showText: true};

    // Toggle the state every second
    setInterval(() => {
      this.setState(previousState => {
        return { showText: !previousState.showText };
      });
    }, 1000);
  }

  render() {
    let display = this.state.showText ? this.props.text : ' ';
    return (
      <Text>{display}</Text>
    );
  }
}

export default class BlinkApp extends Component {
  render() {
    return (
      <View>
        <Blink text='I love to blink' />
        <Blink text='Yes blinking is so great' />
        <Blink text='Why did they ever take this out of HTML' />
        <Blink text='Look at me look at me look at me' />
      </View>
    );
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => BlinkApp);
```

In a real application, you probably won't be setting state with a timer. You might set state when you have new data arrive from the server, or from user input. You can also use a state container like [Redux](http://redux.js.org/index.html) to control your data flow. In that case you would use Redux to modify your state rather than calling `setState` directly.

When setState is called, BlinkApp will re-render its Component. By calling setState within the Timer, the component will re-render every time the Timer ticks.

State works the same way as it does in React, so for more details on handling state, you can look at the [React.Component API](https://facebook.github.io/react/docs/component-api.html).
At this point, you might be annoyed that most of our examples so far use boring default black text. To make things more beautiful, you will have to [learn about Style](docs/style.html).
