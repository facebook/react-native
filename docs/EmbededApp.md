---
id: embeded-app
title: Use React Native in Existing iOS App
layout: docs
category: Guides
permalink: docs/embeded-app.html
next: activityindicatorios
---

## Install React Native Using Cocoapods

[Cocoapods](http://cocoapods.org/) is a package management tool for iOS/Mac development. We need to use it to download React Native. If you haven't install Cocoapods yet, checkout [this tutorial](http://guides.cocoapods.org/using/getting-started.html).

When you are ready to work with Cocoapods, add the following line to `Podfile`. If you don't have one, then create it under the root directory of your project.

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
  
The installation process also requires [Node.js](http://nodejs.org).

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

![Container view example](http://7qn8cx.com1.z0.glb.clouddn.com/c37deb761ce048225989ece06cf3d185061c511d-74d3e6b285e1b5cd93153c39fca63c63838b8dbf.png?imageView2/2/h/400/w/400/q/85)

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

![Example](http://7qn8cx.com1.z0.glb.clouddn.com/0c4e7b977f1db688b60f1579a581f30dd1abc85f-86bebe4092e82c395e322fefcc8f7727b0820ac7.png?imageView2/2/h/400/w/400/q/85)

## Conclusion

So under the hood, when **RCTRootView** is initialized, it will try to download, parse and run the bundle file from React Native development server. All you need to do is to implement your own container view, add **RCTRootView** as its subclass. And then serve the bundle using React Native development server. Then, bravo!

You can checkout full source code of sample application [here](https://github.com/tjwudi/EmbededReactNativeExample).
