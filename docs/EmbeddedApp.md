---
id: embedded-app
title: Integration with Existing App
layout: docs
category: Guides
permalink: docs/embeded-app.html
next: activityindicatorios
---

Since React makes no assumptions about the rest of your technology stack – it’s commonly noted as simply the `V` in `MVC` – it’s easily embeddable within an existing non-React Native app. In fact, it integrates with other best practice community tools like [Cocoapods](http://cocoapods.org/).

## Requirements

- [Cocoapods](http://cocoapods.org/) – `gem install cocoapods`
- [Node.js](http://nodejs.org) – `brew install node`

## Install React Native Using Cocoapods

[CocoaPods](http://cocoapods.org/) is a package management tool for iOS/Mac development. We need to use it to download React Native. If you haven't install CocoaPods yet, checkout [this tutorial](http://guides.cocoapods.org/using/getting-started.html).

When you are ready to work with CocoaPods, add the following line to `Podfile`. If you don't have one, then create it under the root directory of your project.

```
pod 'React'
pod 'React/RCTText'
# Add any subspecs you want to use in your project
```

Remember to install all subspecs you need. The `<Text>` element cannot be used without `pod 'React/RCTText'`.

Then install pods via shell

```
$ pod install --verbose
```

## Create Your React Native App

First, enter React Native's pod root directory and create **index.ios.js** inside a directory `ReactComponent`.

```
$ cd Pods/React
$ mkdir ReactComponent
$ touch index.ios.js
```

Copy & paste following starter code for **index.ios.js**.

```
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
    return <View style={styles.container}>
        <Text>This is a simple application.</Text>
      </View>;
  }
}

React.AppRegistry.registerComponent('SimpleApp', () => SimpleApp);
```

`SimpleApp` will be your **module name**, which will be used later on.

## Add Container View To Your App

You should now add container view for React Native component. It can be any **UIView** in your app.

![Container view example](/react-native/img/EmbeddedAppContainerViewExample.png)

However, let's subclass **UIView** for the sake of clean code. Let's name it **ReactView**. Open up **Yourproject.xcworkspace** and create a new class **ReactView** (You can name it whatever you like :)).

```
// ReactView.h

#import <UIKit/UIKit.h>
@interface ReactView : UIView
@end
```

Don't forget to add an outlet for it.

```
// ViewController.m

@interface ViewController ()
@property (weak, nonatomic) IBOutlet ReactView *reactView;
@end
```

Here I disabled **AutoLayout** for simplicity. In real production world, you should turn on AutoLayout and setup constraints by yourself.

## Add RCTRootView To Container View

Ready for the most interesting part? Now we shall create the **RCTRootView**, where your React Native app lives in.

In **ReactView.m**, we need to first initiate **RCTRootView** with the URI of your **index.ios.bundle**. **index.ios.bundle** will be created by packager and served by React Native server, which will be discussed later on.

```
NSString *urlString = @"http://localhost:8081/index.ios.bundle";
NSURL *jsCodeLocation = [NSURL URLWithString:urlString];
RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                    moduleName: @"SimpleApp"
                                                 launchOptions:nil];
```

Then add it as a subview of the **ReactView**.

```
[self addSubview:rootView];
rootView.frame = self.bounds;
```

## Start Development Server

In root directory, we need to start React Native development server.

```
$ ./Pods/React/packager/packager.sh --root ./ReactComponents
```

`--root` indicates the root of your React Native apps. Here we just have one **index.ios.js**. React Native development server will use packager to create a **index.ios.bundle**. Which can be access via `http://localhost:8081/index.ios.bundle`.

## Compile And Run

Now compile and run your app. You shall now see your React Native app running inside of the **ReactView**.

![Example](/react-native/img/EmbeddedAppExample.png)

## Conclusion

So under the hood, when **RCTRootView** is initialized, it will try to download, parse and run the bundle file from React Native development server. All you need to do is to implement your own container view, add **RCTRootView** as its subclass. And then serve the bundle using React Native development server. Then, bravo!

You can checkout full source code of sample application [here](https://github.com/tjwudi/EmbededReactNativeExample).
