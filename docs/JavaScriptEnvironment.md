---
id: javascript-environment
title: JavaScript Environment
layout: docs
category: Guides
permalink: docs/javascript-environment.html
next: activityindicatorios
---

## JavaScript Runtime

When using React Native, you're going to be running your JavaScript code in two environments:

* In the simulator and on the phone: [JavaScriptCore](http://trac.webkit.org/wiki/JavaScriptCore) which is the JavaScript engine that powers Safari and web views. Due to the absence of writable executable memory in iOS apps, it doesn't run with JIT.
* When using Chrome debugging, it runs all the JavaScript code within Chrome itself and communicates with Objective-C via WebSocket. So you are using [V8](https://code.google.com/p/v8/).

While both environments are very similar, you may end up hitting some inconsistencies. We're likely going to experiment with other JS engines in the future, so it's best to avoid relying on specifics of any runtime.


## JavaScript Transforms

React Native ships with many JavaScript transforms to make writing code more enjoyable. If you are curious, you can see the [implementation of all those transformations](https://github.com/facebook/jstransform/tree/master/visitors). Here's the full list:

ES5

* Reserved Words: `promise.catch(function() { });`

ES6

* Arrow function: `<C onPress={() => this.setState({pressed: true})}`
* Call spread: `Math.max(...array);`
* Class: `class C extends React.Component { render() { return <View />; } }`
* Destructuring: `var {isActive, style} = this.props;`
* Iteration: `for (var element of array) { }`
* Computed Properties: `var key = 'abc'; var obj = {[key]: 10};`
* Object Consise Method: `var obj = { method() { return 10; } };`
* Object Short Notation: `var name = 'vjeux'; var obj = { name };`
* Rest Params: `function(type, ...args) { }`
* Template: ``var who = 'world'; var str = `Hello ${who}`;``

ES7

* Object Spread: `var extended = { ...obj, a: 10 };`
* Function Trailing Comma: `function f(a, b, c,) { }`
