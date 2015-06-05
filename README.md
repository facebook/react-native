# React Native [![Build Status](https://travis-ci.org/facebook/react-native.svg?branch=master)](https://travis-ci.org/facebook/react-native)

React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and
[React](http://facebook.github.io/react). The focus of React Native is on developer efficiency across all the platforms you care about - learn once, write anywhere. Facebook uses React Native in multiple production apps and will continue investing in React Native.

## Native iOS Components

With React Native, you can use the standard platform components such as `UITabBar` and `UINavigationController` on iOS.  This gives your app a consistent look and feel with the rest of the platform ecosystem, and keeps the quality bar high.  These components are easily incorporated into your app using their React component counterparts, such as _TabBarIOS_ and _NavigatorIOS_.

```javascript
var React = require('react-native');
var { TabBarIOS, NavigatorIOS } = React;

var App = React.createClass({
  render: function() {
    return (
      <TabBarIOS>
        <TabBarIOS.Item title="React Native" selected={true}>
          <NavigatorIOS initialRoute={{ title: 'React Native' }} />
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  },
});
```

## Asynchronous Execution

All operations between the JavaScript application code and the native platform are performed asynchronously, and the native modules can also make use of additional threads as well.  This means we can decode images off of the main thread, save to disk in the background, measure text and compute layouts without blocking the UI, and more.  As a result, React Native apps are naturally fluid and responsive.  The communication is also fully serializable, which allows us to leverage Chrome Developer Tools to debug the JavaScript while running the complete app, either in the simulator or on a physical device.

![](http://facebook.github.io/react-native/img/chrome_breakpoint.png)


## Touch Handling

iOS has a very powerful system called the Responder Chain to negotiate touches in complex view hierarchies which does not have a universal analog on the web. React Native implements a similar responder system and provides high level components such as TouchableHighlight that integrate properly with scroll views and other elements without any additional configuration.

```javascript
var React = require('react-native');
var { ScrollView, TouchableHighlight, Text } = React;

var TouchDemo = React.createClass({
  render: function() {
    return (
      <ScrollView>
        <TouchableHighlight onPress={() => console.log('pressed')}>
          <Text>Proper Touch Handling</Text>
        </TouchableHighlight>
      </ScrollView>
    );
  },
});
```


## Flexbox and Styling
Laying out views should be easy, which is why we brought the flexbox layout model from the web to React Native.  Flexbox makes it simple to build the most common UI layouts, such as stacked and nested boxes with margin and padding.  React Native also supports common web styles, such as `fontWeight`, and the `StyleSheet` abstraction provides an optimized mechanism to declare all your styles and layout right along with the components that use them and apply them inline.

```javascript
var React = require('react-native');
var { Image, StyleSheet, Text, View } = React;

var ReactNative = React.createClass({
  render: function() {
    return (
      <View style={styles.row}>
        <Image
          source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
          style={styles.image}
        />
        <View style={styles.text}>
          <Text style={styles.title}>
            React Native
          </Text>
          <Text style={styles.subtitle}>
            Build high quality mobile apps using React
          </Text>
        </View>
      </View>
    );
  },
});
var styles = StyleSheet.create({
  row: { flexDirection: 'row', margin: 40 },
  image: { width: 40, height: 40, marginRight: 10 },
  text: { flex: 1, justifyContent: 'center'},
  title: { fontSize: 11, fontWeight: 'bold' },
  subtitle: { fontSize: 10 },
});
```

## Polyfills

React Native is focused on changing the way view code is written.  For the rest, we look to the web for universal standards and polyfill those APIs where appropriate. You can use npm to install JavaScript libraries that work on top of the functionality baked into React Native, such as `XMLHttpRequest`, `window.requestAnimationFrame`, and `navigator.geolocation`.  We are working on expanding the available APIs, and are excited for the Open Source community to contribute as well.

```javascript
var React = require('react-native');
var { Text } = React;

var GeoInfo = React.createClass({
  getInitialState: function() {
    return { position: 'unknown' };
  },
  componentDidMount: function() {
    navigator.geolocation.getCurrentPosition(
      (position) => this.setState({position}),
      (error) => console.error(error)
    );
  },
  render: function() {
    return (
      <Text>
        Position: {JSON.stringify(this.state.position)}
      </Text>
    );
  },
});
```

## Extensibility

It is certainly possible to create a great app using React Native without writing a single line of native code, but React Native is also designed to be easily extended with custom native views and modules - that means you can reuse anything you've already built, and can import and use your favorite native libraries.  To create a simple module in iOS, create a new class that implements the `RCTBridgeModule` protocol, and wrap the function that you want to make available to JavaScript in `RCT_EXPORT_METHOD`. Additionally, the class itself must be explicitly exported with `RCT_EXPORT_MODULE();`.

```objc
// Objective-C

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

@end
```

```javascript
// JavaScript

var React = require('react-native');
var { NativeModules, Text } = React;

var Message = React.createClass({
  getInitialState() {
    return { text: 'Goodbye World.' };
  },
  componentDidMount() {
    NativeModules.MyCustomModule.processString(this.state.text, (text) => {
      this.setState({text});
    });
  },
  render: function() {
    return (
      <Text>{this.state.text}</Text>
    );
  },
});
```

Custom iOS views can be exposed by subclassing `RCTViewManager`, implementing a `-view` method, and exporting properties with the `RCT_EXPORT_VIEW_PROPERTY` macro.  Then use `requireNativeComponent` in JavaScript to use the component in your app.

```objc
// Objective-C

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

@end
```

```javascript
// JavaScript

var React = require('react-native');
var { requireNativeComponent } = React;

class MyCustomView extends React.Component {
  render() {
    return <NativeMyCustomView {...this.props} />;
  }
}
MyCustomView.propTypes = {
  myCustomProperty: React.PropTypes.oneOf(['a', 'b']),
};

var NativeMyCustomView = requireNativeComponent('MyCustomView', MyCustomView);
module.exports = MyCustomView;
```

## Running the Examples

- `git clone https://github.com/facebook/react-native.git`
- `cd react-native && npm install`
- `cd Examples`

Now open any example and hit run in Xcode.

Further documentation, tutorials, and more on the [React Native website](http://facebook.github.io/react-native/docs/getting-started.html).
