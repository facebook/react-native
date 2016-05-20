---
id: tutorial-integration-with-existing-apps
title: Integration With Existing Apps
layout: docs
category: Tutorials
permalink: docs/tutorial-integration-with-existing-apps.html
next: sample-application-movies
---

We know that many developers are not looking to create new applications from scratch. Instead, they have existing applications where React Native may be a technological fit. With a few steps, you can begin to integrate React Native to add new components to your existing app, or convert current components to React Native.

## Key Concepts

The keys to integrating React Native components into your iOS application are to:

1. Understand what React Native components you want to integrate.
2. Create a `Podfile` with `subspec`s for all the React Native components you will need for your integration.
3. Create your actual React Native components in JavaScript - either all directly in a `index.ios.js` file, or in a `index.ios.js` file and multiple other files.  
4. Add a new event handler that creates a `RCTRootView` that points to your React Native component and its `AppRegistry` name that you defined in `index.ios.js`.
5. Start the React Native server and run your native application.
6. Profit!

## Prerequisites

### General

First, follow the [Getting Started guide](/react-native/docs/getting-started.html) for your development environment and target platform to install the prerequisites for React Native.

### CocoaPods

[CocoaPods](http://cocoapods.org) is a package management tool for iOS and Mac development. We use it to add the actual React Native framework code locally into your current project.

```bash
$ gem install cocoapods
```

> If you get a permission error, prefix the above command with `sudo`.

## Our Sample App

Assume the [app for integration](https://github.com/JoelMarcey/iOS-2048) is a [2048](https://en.wikipedia.org/wiki/2048_(video_game) game. Here is what the main menu of the native application looks like without React Native.

![Before RN Integration](img/react-native-existing-app-integration-ios-before.png)

## Package Dependencies

React Native integration requires both the React and React Native node modules. The React Native Framework will provide the code to allow your application integration to happen.


### `package.json`

We will add the package dependencies to a `package.json` file. Create this file in the root of your project if it does not exist.

> When "root of project" is mentioned in any step, that is the location where your application's project file is located (e.g., `.xcodeproj`).

Below is an example of what your `package.json` file should minimally contain.

> Version numbers will vary according to your needs. Normally the latest versions for each will be sufficient.

```bash
{
  "name": "NumberTileGame",
  "version": "0.0.1",
  "private": true,
  "scripts": {
  "start": "node node_modules/react-native/local-cli/cli.js start"
  },
  "dependencies": {
    "react": "^15.0.2",
    "react-native": "^0.26.1"
  }
}
```

### Packages Installation

Install the React and React Native modules via the Node package manager. The Node modules will be installed into a `node_modules/` directory in the root of your project.

```bash
# From the *root directory* of your project, install the modules into node_modules/
$ npm install
```

## React Native Framework

The React Native Framework was installed as Node module in your project [above](#package-dependencies). We will now install a CocoaPods `Podfile` with the components you want to use from the framework itself.

### Subspecs

Before you integrate React Native into your application, you will want to decide what React Native components you would like to integrate. That is where `subspec`s come in. When you create your `Podfile`, you are going to specify React Native library dependencies that you will want installed so that your application can use those libraries. Each library will become a `subspec` in the `Podfile`.

For example, you will generally always want the `Core` `subspec`. That will get you the `AppRegistry`, `StyleSheet`, `View` and other core React Native libraries. If you want to add the React Native `Text` library (e.g., for `<Text>` elements), then you will need the `RCTText` `subspec`. If you want the `Image` library (e.g., for `<Image>` elements), then you will need the `RCTImage` `subspec`.

> The list of supported `subspec`s are in `node_modules/react-native/react-native/React.podspec`.

#### Podfile

After you have used Node to install the React and React Native frameworks into the `node_modules` directory, and you have decided on what React Native elements you want to integrate, you are ready to create your `Podfile` so you can install those components for use in your application.

The easiest way to create a `Podfile` is by using the CocoaPods `init` command in the root directory of your project:

```bash
$ pod init
```

The `Podfile` will be created and saved in the *root* directory of your current project and will contain a boilerplate setup that ou will tweak for your integration purposes. In the end, `Podfile` should look something similar to this:

```
# The target name is most likely the name of your project.
target 'NumberTileGame' do

  # Your 'node_modules' directory is probably in the root of your project,
  # but if not, adjust the `:path` accordingly
  pod 'React', :path => './node_modules/react-native', :subspecs => [
    'Core',
    'RCTText',
    'RCTWebSocket', # needed for localhost testing of your app
    # Add any other subspecs you want to use in your project
  ]

end
```

#### Pod Installation

After you have created your `Podfile`, you are ready to install the React Native pod.

```bash
$ pod install
```

Your should see output such as:

```bash
Analyzing dependencies
Fetching podspec for `React` from `./node_modules/react-native`
Downloading dependencies
Installing React (0.26.0)
Generating Pods project
Integrating client project
Sending stats
Pod installation complete! There are 2 dependencies from the Podfile and 1 total pod installed.
```

## Code Integration

Now that we have a package foundation, we will actually modify the native application to integrate React Native into the application. For our 2048 app, we will add a "High Score" screen in React Native.

### The React Native component

The first bit of code we will write is the actual React Native code for the new "High Score" screen that will be intergrated into our application.

#### Create a `index.ios.js` file

First, create an empty `index.ios.js` file. For ease, I am doing this in the root of the project.

> `index.ios.js` is the starting point for React Native applications on iOS. And it is always required. It can be a small file that `require`s other file that are part of your React Native component or application, or it can contain all the code that is needed for it. In our case, we will just put everything in `index.ios.js`

```bash
# In root of your project
$ touch index.ios.js
```

#### Add Your React Native Code

In your `index.ios.js`, create your component. In our sample here, we will add simple `<Text>` component within a styled `<View>`

```js
'use strict';

import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

class RNHighScores extends React.Component {
  render() {
    console.log(this.props["scores"]);
    var contents = this.props["scores"].map(
      score => <Text key={score.name}>{score.name}:{score.value}{"\n"}</Text>
    );
    return (
      <View style={styles.container}>
        <Text style={styles.highScoresTitle}>
          2048 High Scores!
        </Text>
        <Text style={styles.scores}>
          {contents}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  highScoresTitle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  scores: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

// Module name
AppRegistry.registerComponent('RNHighScores', () => RNHighScores);
```

> `RNHighScores` is the name of your module that will be used when you add a view to React Native from within your iOS application.

## The Magic: `RCTRootView`

Now that your React Native component is created via `index.ios.js`, you need add that component to a new or existing `ViewController`. The easiest path is to take is to optionally create an event path to your component and then add that component to an existing `ViewController`.

We will tie our React Native component with a new native view in the `ViewController` that will actually host it called `RCTRootView` .

### Create an Event Path

You can add a new link on the main game menu to go to the "High Score" React Native page.

![Event Path](img/react-native-add-react-native-integration-link.png)

#### Event Handler

We will now add an event handler from the menu link. A method will be added to the main `ViewController` of your application. This is where `RCTRootView` comes into play.

When you build a React Native application, you use the React Native packager to create an `index.ios.bundle` that will be served by the React Native server. Inside `index.ios.bundle` will be our `RNHighScore` module. So, we need to point our `RCTRootView` to the location of the `index.ios.bundle` resource (via `NSURL`) and tie it to the module.

We will, for debugging purposes, log that the event handler was invoked. Then create a string with the location of our React Native code inside the `index.ios.bundle` and then create the main `RCTRootView`. Notice how we provide `HighScores` as the `moduleName` that we created [above](#the-react-native-component) when writing the code for our React Native component.

First `import` the `RCTRootView` library.

```
#import "RCTRootView.h"
```

> The `initialProperties` are here for illustration purposes so we have some data for our high score screen. In our React Native component, we will use `this.props` to get access to that data.

```
- (IBAction)highScoreButtonPressed:(id)sender {
    NSLog(@"High Score Button Pressed");
    NSURL *jsCodeLocation = [NSURL
                             URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios"];
    RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                 moduleName: @"RNHighScores"
                                                 initialProperties:
  @{
     @"scores": @[
       @{
          @"name": @"Alex",
          @"value": @"42"
        },
       @{
         @"name": @"Joel",
         @"value": @"10"
        }
     ]
   }
                                                 launchOptions:nil
                             ];
    UIViewController *vc = [[UIViewController alloc] init];
    vc.view = rootView;
    [self presentViewController:vc animated:YES completion:nil];
}
```

> When moving your app to production, the `NSURL` can point to a pre-bundled file on disk via something like `[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];`. You can use the `react-native-xcode.sh` script in `node_modules/react-native/packager/` to generate that pre-bundled file.

#### Wire Up

Wire up the new link in the main menu to the newly added event handler method.

![Event Path](img/react-native-add-react-native-integration-wire-up.png)

> One of the easier ways to do this is to open the view in the storyboard and right click on the new link. Select something such as the `Touch Up Inside` event, drag that to the storyboard and then select the created method from the list provided.


## Test Your Integration

You have now done all the basic steps to integrate React Native with your current application. Now we will start the React Native packager to build the `index.ios.bundle` packager and the server running on `localhost` to serve it.

### App Transport Security

Unfortunately, Apple has blocked implicit cleartext HTTP resource loading. So we need to add the following our project's `Info.plist` (or equivalent) file.

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Run the Packager

```bash
# From the root of your project, where the `node_modules` directory is located.
$ npm start
```

### Run the App

Using Xcode or your favorite editor, build and run your native iOS application as normal. In our sample application, you should see the link to the "High Scores" and then when you click on that you will see the rendering of your React Native component.

Here is the *native, Objective-C* home screen:

![Home Screen](img/react-native-add-react-native-integration-example-home-screen.png)

Here is the *React Native* high score screen:

![High Scores](img/react-native-add-react-native-integration-example-high-scores.png)

> If you are getting module resolution issues when running your application please see [this GitHub issue](https://github.com/facebook/react-native/issues/4968) for information and possible resolution. [This comment](https://github.com/facebook/react-native/issues/4968#issuecomment-220941717) seemed to be the latest possible resolution.

### See the Code

You can examine the code that added the React Native screen on [GitHub](https://github.com/JoelMarcey/iOS-2048/commit/b90f5235e8af40eb10ade112a6283c3d68266e1d).
