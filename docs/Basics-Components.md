---
id: basics-components
title: Components
layout: docs
category: Basics
permalink: docs/basics-components.html
next: basics-component-text
---

Components are the building blocks for a React Native application. A React Native user interface (UI) is specified by declaring components, often nested. Those components are then mapped to the native UI on the targeted platform.

####Props####

#####`this.props`#####

Components can be configured by passing properties `props` to the constructor. You can access `props` from your component's methods by accessing `this.props`. You should not alter your props within component methods.

####State####

#####`this.state`#####

Components maintain their state using the state object. You can access your component state via `this.state`. Each component should manage its own state. Parent components should not manage children state and children components should not manage parent component state.

#####`this.setState({key: value, ...})`#####

To update or change the state of your component passing a new object representing your newly desired state to `this.setState(obj)`. The specificed keys will be merged into `this.state`. Any existing keys will be overridden by new values.

## Core Components.

React Native has a number of core components that are commonly used in applications, either on their own or combined to build new components.

- [Text](/react-native/docs/basics-component-text.html)
- [Image](/react-native/docs/basics-component-image.html)
- [View](/react-native/docs/basics-component-view.html)
- [TextInput](/react-native/docs/basics-component-textinput.html)
- [ListView](/react-native/docs/basics-component-listview.html)