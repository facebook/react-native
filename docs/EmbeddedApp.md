---
id: embedded-app
title: Integration with Existing App
layout: docs
category: Guides
permalink: docs/embedded-app.html
next: javascript-environment
---

Since React makes no assumptions about the rest of your technology stack – it’s commonly noted as simply the `V` in `MVC` – it’s easily embeddable within an existing non-React Native app. In fact, it integrates with other best practice community tools like [CocoaPods](http://cocoapods.org/).

## Requirements

- [CocoaPods](http://cocoapods.org/) – `gem install cocoapods`
- [Node.js](http://nodejs.org) – `brew install node`

## Install React Native Using CocoaPods

[CocoaPods](http://cocoapods.org/) is a package management tool for iOS/Mac development. We need to use it to download React Native. If you haven't install CocoaPods yet, checkout [this tutorial](http://guides.cocoapods.org/using/getting-started.html).

When you are ready to work with CocoaPods, add the following line to `Podfile`. If you don't have one, then create it under the root directory of your project.

```
pod 'React'
pod 'React/RCTText'
# Add any subspecs you want to use in your project
```

Remember to install all subspecs you need. The `<Text>` element cannot be used without `pod 'React/RCTText'`.

Then install your pods:

```
$ pod install
```

## Create Your React Native App

There are two pieces you’ll need to set up:

1. The root JavaScript file that will contain your actual React Native app and other components
- Wrapper Objective-C code that will load up your script and create a `RCTRootView` to display and manage your React Native components

First, create a directory for your app’s React code and create a simple `index.ios.js` file:

```
$ mkdir ReactComponent
$ touch index.ios.js
```

Copy & paste following starter code for `index.ios.js` – it’s a barebones React Native app:

```
'use strict';

var React = require('react-native');
var {
  Text,
  View
} = React;

var styles = React.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red'
  }
});

class SimpleApp extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>This is a simple application.</Text>
      </View>
    )
  }
}

React.AppRegistry.registerComponent('SimpleApp', () => SimpleApp);
```

`SimpleApp` will be your **module name**, which will be used later on.

## Add Container View To Your App

You should now add a container view for the React Native component. It can be any `UIView` in your app.

![Container view example](/react-native/img/EmbeddedAppContainerViewExample.png)

However, let's subclass `UIView` for the sake of clean code. Let's name it `ReactView`. Open up `Yourproject.xcworkspace` and create a new class `ReactView` (You can name it whatever you like :)).

```
// ReactView.h

#import <UIKit/UIKit.h>
@interface ReactView : UIView
@end
```

In a view controller that wants to manage this view, go ahead and add an outlet and wire it up:

```
// ViewController.m

@interface ViewController ()
@property (weak, nonatomic) IBOutlet ReactView *reactView;
@end
```

Here I disabled **AutoLayout** for simplicity. In real production world, you should turn on AutoLayout and setup constraints by yourself.

## Add RCTRootView To Container View

Ready for the most interesting part? Now we shall create the `RCTRootView`, where your React Native app lives in.

In `ReactView.m`, we need to first initiate `RCTRootView` with the URI of your `index.ios.bundle`. `index.ios.bundle` will be created by packager and served by React Native server, which will be discussed later on.

```
NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle"];
// For production use, this `NSURL` could instead point to a pre-bundled file on disk:
//
//   NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
//
// To generate that file, run the curl command and add the output to your main Xcode build target:
//
//   curl -4 http://localhost:8081/index.ios.bundle -o main.jsbundle
RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                    moduleName: @"SimpleApp"
                                                 launchOptions:nil];
```

Then add it as a subview of the `ReactView`.

```
[self addSubview:rootView];
rootView.frame = self.bounds;
```

## Start Development Server

In root directory, we need to start React Native development server.

```
(JS_DIR=`pwd`/ReactComponent; cd Pods/React; npm run start -- --root $JS_DIR)
```

This command will start up a React Native development server within our CocoaPods dependency to build our bundled script. The `--root` option indicates the root of your React Native apps – this will be our `ReactComponents` directory containing the single `index.ios.js` file. This running server will package up the `index.ios.bundle` file accessible via `http://localhost:8081/index.ios.bundle`.

## Compile And Run

Now compile and run your app. You shall now see your React Native app running inside of the `ReactView`.

![Example](/react-native/img/EmbeddedAppExample.png)

Live reload works from the simulator, too! You’ve got a simple React component totally encapsulated behind an Objective-C `UIView` subclass.

## Conclusion

So under the hood, when `RCTRootView` is initialized, it will try to download, parse and run the bundle file from React Native development server. This means all you need to do is to implement your own container view or view controller for the `RCTRootView` – the `RCTRootView` ingests your bundled JS and renders your React components. Bravo!

You can checkout full source code of a sample application [here](https://github.com/tjwudi/EmbededReactNativeExample).
