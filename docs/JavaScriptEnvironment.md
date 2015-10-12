---
id: javascript-environment
title: JavaScript Environment
layout: docs
category: Guides
permalink: docs/javascript-environment.html
next: navigator-comparison
---

## JavaScript Runtime

When using React Native, you're going to be running your JavaScript code in two environments:

* On iOS simulators and devices, Android emulators and devices React Native uses [JavaScriptCore](http://trac.webkit.org/wiki/JavaScriptCore) which is the JavaScript engine that powers Safari. On iOS JSC doesn't use JIT due to the absence of writable executable memory in iOS apps.
* When using Chrome debugging, it runs all the JavaScript code within Chrome itself and communicates with native code via WebSocket. So you are using [V8](https://code.google.com/p/v8/).

While both environments are very similar, you may end up hitting some inconsistencies. We're likely going to experiment with other JS engines in the future, so it's best to avoid relying on specifics of any runtime.

## JavaScript Syntax Transformers

Syntax transformers make writing code more enjoyable by allowing you to use new JavaScript syntax without having to wait for support on all interpreters.

As of version 0.5.0, React Native ships with the [Babel JavaScript compiler](https://babeljs.io). Check [Babel documentation](http://babeljs.io/docs/advanced/transformers/) on its supported transformations for more details.

Here's a full list of React Native's [enabled transformations](https://github.com/facebook/react-native/blob/master/packager/transformer.js#L21).

ES5

* Reserved Words: `promise.catch(function() { });`

ES6

* [Arrow functions](http://babeljs.io/docs/learn-es2015/#arrows): `<C onPress={() => this.setState({pressed: true})}`
* [Block scoping](https://babeljs.io/docs/learn-es2015/#let-const): `let greeting = 'hi';`
* [Call spread](http://babeljs.io/docs/learn-es2015/#default-rest-spread): `Math.max(...array);`
* [Classes](http://babeljs.io/docs/learn-es2015/#classes): `class C extends React.Component { render() { return <View />; } }`
* [Constants](https://babeljs.io/docs/learn-es2015/#let-const): `const answer = 42;`
* [Destructuring](http://babeljs.io/docs/learn-es2015/#destructuring): `var {isActive, style} = this.props;`
* [Modules](http://babeljs.io/docs/learn-es2015/#modules): `import React, { Component } from 'react-native';`
* [Computed Properties](http://babeljs.io/docs/learn-es2015/#enhanced-object-literals): `var key = 'abc'; var obj = {[key]: 10};`
* Object Consise Method: `var obj = { method() { return 10; } };`
* [Object Short Notation](http://babeljs.io/docs/learn-es2015/#enhanced-object-literals): `var name = 'vjeux'; var obj = { name };`
* [Rest Params](https://github.com/sebmarkbage/ecmascript-rest-spread): `function(type, ...args) { }`
* [Template Literals](http://babeljs.io/docs/learn-es2015/#template-strings): ``var who = 'world'; var str = `Hello ${who}`;``

ES7

* [Object Spread](https://github.com/sebmarkbage/ecmascript-rest-spread): `var extended = { ...obj, a: 10 };`
* [Function Trailing Comma](https://github.com/jeffmo/es-trailing-function-commas): `function f(a, b, c,) { }`
* [Async Functions](https://github.com/tc39/ecmascript-asyncawait): `async function doStuffAsync() { const foo = await doOtherStuffAsync(); }`;
