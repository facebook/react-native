/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var Prism = require('Prism');
var React = require('React');
var Site = require('Site');

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>React Native</strong></div>
            <div className="minitext">
              Learn once, write anywhere: Build mobile apps with React
            </div>
          </div>

          <div className="buttons-unit">
            <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
          </div>
        </div>

        <section className="content wrap">

          <div style={{margin: '40px auto', maxWidth: 800}}>

          <h2>Build Native Mobile Apps using JavaScript and React</h2>
          <p>
            React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.
          </p>

          <Prism>

{`import React, { Component } from 'react';
import { Text, View } from 'react-native';

class WhyReactNativeIsSoGreat extends Component {
  render() {
    return (
      <View>
        <Text>
          If you like React on the web, you'll like React Native.
        </Text>
        <Text>
          You just use native components like '<View>' and '<Text>',
          instead of web components like '<div>' and '<a>'.
        </Text>
      </View>
    );
  }
}`}
          </Prism>

          <h2>A React Native App is a Real Mobile App</h2>
          <p>
            With React Native, you don't build a “mobile web app”, an “HTML5 app”, or a “hybrid app”. You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.
          </p>

          <Prism>
{`import React, { Component } from 'react';
import { Image, ScrollView, Text } from 'react-native';

class AwkwardScrollingImageWithText extends Component {
  render() {
    return (
      <ScrollView>
        <Image source={{uri: 'http://facebook.github.io/react/thats-amazing.png'}} />
        <Text>
          On iOS, a React Native '<ScrollView>' uses a native UIScrollView.
          On Android, it uses a native ScrollView.

          On iOS, a React Native '<Image>' uses a native UIImageView.
          On Android, it uses a native ImageView.

          React Native wraps the fundamental native components, giving you
          the performance of a native app, plus the clean design of React.
        </Text>
      </ScrollView>
    );
  }
}`}
          </Prism>

          <h2>Don't Waste Time Recompiling</h2>
          <p>
            React Native lets you build your app faster. Instead of recompiling, you can reload your app instantly. With hot reloading, you can even run new code while retaining your application state. Give it a try - it's a magical experience.
          </p>
          <br />
          <img src='https://media.giphy.com/media/13WZniThXy0hSE/giphy.gif' />

          <h2>Use Native Code When You Need To</h2>
          <p>
            React Native is focused on changing the way view code is written.  For the rest, we look to the web for universal standards and polyfill those APIs where appropriate. You can use npm to install JavaScript libraries that work on top of the functionality baked into React Native, such as XMLHttpRequest, window.requestAnimationFrame, and navigator.geolocation.  We are working on expanding the available APIs, and are excited for the Open Source community to contribute as well.
          </p>
          <Prism>
{`// iOS & Android

import React, {
  Component,
} from 'react';
import {
  Text,
} from 'react-native';

class GeoInfo extends Component {
  constructor(props) {
    super(props);
    this.state = { position: 'unknown' };
  },
  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      (position) => this.setState({position}),
      (error) => console.error(error)
    );
  }
  render() {
    return (
      <Text>
        Position: {JSON.stringify(this.state.position)}
      </Text>
    );
  }
}`}
          </Prism>

          <h2>Extensibility</h2>
          <p>
            It is certainly possible to create a great app using React Native without writing a single line of native code, but React Native is also designed to be easily extended with custom native views and modules - that means you can reuse anything you{"'"}ve already built, and can import and use your favorite native libraries.
          </p>
          <h3>Creating iOS modules</h3>
          <p>
            To create a simple iOS module, create a new class that implements the RCTBridgeModule protocol, and wrap the function that you want to make available to JavaScript in RCT_EXPORT_METHOD. Additionally, the class itself must be explicitly exported with RCT_EXPORT_MODULE();.
          </p>
          <Prism>
{`// Objective-C

#import "RCTBridgeModule.h"

@interface MyCustomModule : NSObject <RCTBridgeModule>
@end

@implementation MyCustomModule

RCT_EXPORT_MODULE();

// Available as NativeModules.MyCustomModule.processString
RCT_EXPORT_METHOD(processString:(NSString *)input callback:(RCTResponseSenderBlock)callback)
{
  callback(@[[input stringByReplacingOccurrencesOfString:@"Goodbye" withString:@"Hello"]]);
}
@end`}
          </Prism>
          <Prism>
{`// JavaScript

import React, {
  Component,
} from 'react';
import {
  NativeModules,
  Text,
} from 'react-native';

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = { text: 'Goodbye World.' };
  }
  componentDidMount() {
    NativeModules.MyCustomModule.processString(this.state.text, (text) => {
      this.setState({text});
    });
  }
  render() {
    return (
      <Text>{this.state.text}</Text>
    );
  }
}`}
          </Prism>

          <h3>Creating iOS views</h3>
          <p>
            Custom iOS views can be exposed by subclassing RCTViewManager, implementing a -(UIView *)view method, and exporting properties with the RCT_EXPORT_VIEW_PROPERTY macro.  Then a simple JavaScript file connects the dots.
          </p>
          <Prism>
{`// Objective-C

#import "RCTViewManager.h"

@interface MyCustomViewManager : RCTViewManager
@end

@implementation MyCustomViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[MyCustomView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(myCustomProperty, NSString);
@end`}
          </Prism>
          <Prism>
{`// JavaScript

import React, {
  Component,
} from 'react';
import {
  requireNativeComponent,
} from 'react-native';

var NativeMyCustomView = requireNativeComponent('MyCustomView', MyCustomView);

export default class MyCustomView extends Component {
  static propTypes = {
    myCustomProperty: React.PropTypes.oneOf(['a', 'b']),
  };
  render() {
    return <NativeMyCustomView {...this.props} />;
  }
}
`}
          </Prism>

          <h3>Creating Android modules</h3>
          <p>
            Likewise, Android also supports custom extensions, the methods are just slightly different.
          </p>
          <p>
            To create a simple module in Android, create a new class that extends the ReactContextBaseJavaModule class, and annotate the function that you want to make available to JavaScript with @ReactMethod. Additionally, the class itself must be registered in the ReactPackage of your React Native application.
          </p>
          <Prism>
{`// Java

public class MyCustomModule extends ReactContextBaseJavaModule {

// Available as NativeModules.MyCustomModule.processString
  @ReactMethod
  public void processString(String input, Callback callback) {
    callback.invoke(input.replace("Goodbye", "Hello"));
  }
}
`}
</Prism>

<Prism>
{`// JavaScript

import React, {
  Component,
} from 'react';
import {
  NativeModules,
  Text,
} from 'react-native';
class Message extends Component {
  constructor(props) {
    super(props);
    this.state = { text: 'Goodbye World.' };
  },
  componentDidMount() {
    NativeModules.MyCustomModule.processString(this.state.text, (text) => {
      this.setState({text});
    });
  }
  render() {
    return (
      <Text>{this.state.text}</Text>
    );
  }
}
`}
          </Prism>

          <h3>Creating Android views</h3>
          <p>
          Custom Android views can be exposed by extending SimpleViewManager, implementing a createViewInstance and getName methods, and exporting properties with the @ReactProp annotation. Then a simple JavaScript file connects the dots.
          </p>
          <Prism>
{`// Java

public class MyCustomViewManager extends SimpleViewManager<MyCustomView> {
  @Override
  public String getName() {
    return "MyCustomView";
  }

  @Override
  protected MyCustomView createViewInstance(ThemedReactContext reactContext) {
    return new MyCustomView(reactContext);
  }

  @ReactProp(name = "myCustomProperty")
  public void setMyCustomProperty(MyCustomView view, String value) {
    view.setMyCustomProperty(value);
  }
}
`}
          </Prism>
          <Prism>
{`// JavaScript

import React, {
  Component,
} from 'react';
import {
  requireNativeComponent,
} from 'react-native';

var NativeMyCustomView = requireNativeComponent('MyCustomView', MyCustomView);

export default class MyCustomView extends Component {
  static propTypes = {
    myCustomProperty: React.PropTypes.oneOf(['a', 'b']),
  };
  render() {
    return <NativeMyCustomView {...this.props} />;
  }
}
`}
          </Prism>
          </div>
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
            </div>
          </section>
        </section>
      </Site>
    );
  }
});

module.exports = index;
