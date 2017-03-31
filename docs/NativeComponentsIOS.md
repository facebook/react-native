---
id: native-components-ios
title: Native UI Components
layout: docs
category: Guides (iOS)
permalink: docs/native-components-ios.html
banner: ejected
next: linking-libraries-ios
previous: native-modules-ios
---

There are tons of native UI widgets out there ready to be used in the latest apps - some of them are part of the platform, others are available as third-party libraries, and still more might be in use in your very own portfolio.  React Native has several of the most critical platform components already wrapped, like `ScrollView` and `TextInput`, but not all of them, and certainly not ones you might have written yourself for a previous app.  Fortunately, it's quite easy to wrap up these existing components for seamless integration with your React Native application.

Like the native module guide, this too is a more advanced guide that assumes you are somewhat familiar with iOS programming.  This guide will show you how to build a native UI component, walking you through the implementation of a subset of the existing `MapView` component available in the core React Native library.

## iOS MapView example

Let's say we want to add an interactive Map to our app - might as well use [`MKMapView`](https://developer.apple.com/library/prerelease/mac/documentation/MapKit/Reference/MKMapView_Class/index.html), we just need to make it usable from JavaScript.

Native views are created and manipulated by subclasses of `RCTViewManager`.  These subclasses are similar in function to view controllers, but are essentially singletons - only one instance of each is created by the bridge.  They vend native views to the `RCTUIManager`, which delegates back to them to set and update the properties of the views as necessary.  The `RCTViewManager`s are also typically the delegates for the views, sending events back to JavaScript via the bridge.

Vending a view is simple:

- Create the basic subclass.
- Add the `RCT_EXPORT_MODULE()` marker macro.
- Implement the `-(UIView *)view` method.

```objective-c
// RNTMapManager.m
#import <MapKit/MapKit.h>

#import <React/RCTViewManager.h>

@interface RNTMapManager : RCTViewManager
@end

@implementation RNTMapManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[MKMapView alloc] init];
}

@end
```
**Note:** Do not attempt to set the `frame` or `backgroundColor` properties on the `UIView` instance that you vend through the `-view` method. React Native will overwrite the values set by your custom class in order to match your JavaScript component's layout props. If you need this granularity of control it might be better to wrap the `UIView` instance you want to style in another `UIView` and return the wrapper `UIView` instead. See [Issue 2948](https://github.com/facebook/react-native/issues/2948) for more context.

> In the example above, we prefixed our class name with `RNT`. Prefixes are used to avoid name collisions with other frameworks. Apple frameworks use two-letter prefixes, and React Native uses `RCT` as a prefix. In order to avoid name collisions, we recommend using a three-letter prefix other than `RCT` in your own classes.

Then you just need a little bit of JavaScript to make this a usable React component:

```javascript
// MapView.js

import { requireNativeComponent } from 'react-native';

// requireNativeComponent automatically resolves this to "RNTMapManager"
module.exports = requireNativeComponent('RNTMap', null);
```

This is now a fully-functioning native map view component in JavaScript, complete with pinch-zoom and other native gesture support.  We can't really control it from JavaScript yet, though :(

## Properties

The first thing we can do to make this component more usable is to bridge over some native properties. Let's say we want to be able to disable pitch control and specify the visible region.  Disabling pitch is a simple boolean, so we add this one line:

```objective-c
// RNTMapManager.m
RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
```

Note that we explicitly specify the type as `BOOL` - React Native uses `RCTConvert` under the hood to convert all sorts of different data types when talking over the bridge, and bad values will show convenient "RedBox" errors to let you know there is an issue ASAP.  When things are straightforward like this, the whole implementation is taken care of for you by this macro.

Now to actually disable pitch, we set the property in JS:

```javascript
// MyApp.js
<MapView pitchEnabled={false} />
```

This isn't very well documented though - in order to know what properties are available and what values they accept, the client of your new component needs to dig through the Objective-C code.  To make this better, let's make a wrapper component and document the interface with React `PropTypes`:

```javascript
// MapView.js
import React from 'react';
import { requireNativeComponent } from 'react-native';

class MapView extends React.Component {
  render() {
    return <RNTMap {...this.props} />;
  }
}

MapView.propTypes = {
  /**
   * When this property is set to `true` and a valid camera is associated
   * with the map, the camera’s pitch angle is used to tilt the plane
   * of the map. When this property is set to `false`, the camera’s pitch
   * angle is ignored and the map is always displayed as if the user
   * is looking straight down onto it.
   */
  pitchEnabled: React.PropTypes.bool,
};

var RNTMap = requireNativeComponent('RNTMap', MapView);

module.exports = MapView;
```

Now we have a nicely documented wrapper component that is easy to work with.  Note that we changed the second argument to `requireNativeComponent` from `null` to the new `MapView` wrapper component.  This allows the infrastructure to verify that the propTypes match the native props to reduce the chances of mismatches between the ObjC and JS code.

Next, let's add the more complex `region` prop.  We start by adding the native code:

```objective-c
// RNTMapManager.m
RCT_CUSTOM_VIEW_PROPERTY(region, MKCoordinateRegion, RNTMap)
{
  [view setRegion:json ? [RCTConvert MKCoordinateRegion:json] : defaultView.region animated:YES];
}
```

Ok, this is more complicated than the simple `BOOL` case we had before.  Now we have a `MKCoordinateRegion` type that needs a conversion function, and we have custom code so that the view will animate when we set the region from JS.  Within the function body that we provide, `json` refers to the raw value that has been passed from JS.  There is also a `view` variable which gives us access to the manager's view instance, and a `defaultView` that we use to reset the property back to the default value if JS sends us a null sentinel.

You could write any conversion function you want for your view - here is the implementation for `MKCoordinateRegion` via two categories on `RCTConvert`:

```objective-c
@implementation RCTConvert(CoreLocation)

RCT_CONVERTER(CLLocationDegrees, CLLocationDegrees, doubleValue);
RCT_CONVERTER(CLLocationDistance, CLLocationDistance, doubleValue);

+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json
{
  json = [self NSDictionary:json];
  return (CLLocationCoordinate2D){
    [self CLLocationDegrees:json[@"latitude"]],
    [self CLLocationDegrees:json[@"longitude"]]
  };
}

@end

@implementation RCTConvert(MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json
{
  json = [self NSDictionary:json];
  return (MKCoordinateSpan){
    [self CLLocationDegrees:json[@"latitudeDelta"]],
    [self CLLocationDegrees:json[@"longitudeDelta"]]
  };
}

+ (MKCoordinateRegion)MKCoordinateRegion:(id)json
{
  return (MKCoordinateRegion){
    [self CLLocationCoordinate2D:json],
    [self MKCoordinateSpan:json]
  };
}
```

These conversion functions are designed to safely process any JSON that the JS might throw at them by displaying "RedBox" errors and returning standard initialization values when missing keys or other developer errors are encountered.

To finish up support for the `region` prop, we need to document it in `propTypes` (or we'll get an error that the native prop is undocumented), then we can set it just like any other prop:

```javascript
// MapView.js

MapView.propTypes = {
  /**
   * When this property is set to `true` and a valid camera is associated
   * with the map, the camera’s pitch angle is used to tilt the plane
   * of the map. When this property is set to `false`, the camera’s pitch
   * angle is ignored and the map is always displayed as if the user
   * is looking straight down onto it.
   */
  pitchEnabled: React.PropTypes.bool,

  /**
   * The region to be displayed by the map.
   *
   * The region is defined by the center coordinates and the span of
   * coordinates to display.
   */
  region: React.PropTypes.shape({
    /**
     * Coordinates for the center of the map.
     */
    latitude: React.PropTypes.number.isRequired,
    longitude: React.PropTypes.number.isRequired,

    /**
     * Distance between the minimum and the maximum latitude/longitude
     * to be displayed.
     */
    latitudeDelta: React.PropTypes.number.isRequired,
    longitudeDelta: React.PropTypes.number.isRequired,
  }),
};

// MyApp.js

  render() {
    var region = {
      latitude: 37.48,
      longitude: -122.16,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
    return <MapView region={region} />;
  }

```

Here you can see that the shape of the region is explicit in the JS documentation - ideally we could codegen some of this stuff, but that's not happening yet.

Sometimes you'll have some special properties that you need to expose for the native component, but don't actually want them as part of the API for the associated React component.  For example, `Switch` has a custom `onChange` handler for the raw native event, and exposes an `onValueChange` handler property that is invoked with just the boolean value rather than the raw event.  Since you don't want these native only properties to be part of the API, you don't want to put them in `propTypes`, but if you don't you'll get an error.  The solution is simply to call them out via the `nativeOnly` option, e.g.

```javascript
var RCTSwitch = requireNativeComponent('RCTSwitch', Switch, {
  nativeOnly: { onChange: true }
});
```

## Events

So now we have a native map component that we can control easily from JS, but how do we deal with events from the user, like pinch-zooms or panning to change the visible region?  The key is to declare an event handler property on `RNTMapManager`, make it a delegate for all the views it vends, and forward events to JS by calling the event handler block from the native view.  This looks like so (simplified from the full implementation):

```objective-c
// RNTMap.h

#import <MapKit/MapKit.h>

#import <React/RCTComponent.h>

@interface RNTMap: MKMapView

@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
```

```objective-c
// RNTMap.m

#import "RNTMap.h"

@implementation RNTMap

@end
```

```objective-c
// RNTMapManager.m

#import "RNTMapManager.h"

#import <MapKit/MapKit.h>

#import "RNTMap.h"
#import <React/UIView+React.h>

@interface RNTMapManager() <MKMapViewDelegate>
@end

@implementation RNTMapManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)

- (UIView *)view
{
  RNTMap *map = [RNTMap new];
  map.delegate = self;
  return map;
}

#pragma mark MKMapViewDelegate

- (void)mapView:(RNTMap *)mapView regionDidChangeAnimated:(BOOL)animated
{
  if (!mapView.onChange) {
    return;
  }

  MKCoordinateRegion region = mapView.region;
  mapView.onChange(@{
    @"region": @{
      @"latitude": @(region.center.latitude),
      @"longitude": @(region.center.longitude),
      @"latitudeDelta": @(region.span.latitudeDelta),
      @"longitudeDelta": @(region.span.longitudeDelta),
    }
  });
}
```

You can see we're adding an event handler property to the view by subclassing `MKMapView`.  Then we're exposing the `onChange` event handler property and setting the manager as the delegate for every view that it vends. Finally, in the delegate method `-mapView:regionDidChangeAnimated:` the event handler block is called on the corresponding view with the region data.  Calling the `onChange` event handler block results in calling the same callback prop in JavaScript.  This callback is invoked with the raw event, which we typically process in the wrapper component to make a simpler API:

```javascript
// MapView.js

class MapView extends React.Component {
  constructor() {
    this._onChange = this._onChange.bind(this);
  }
  _onChange(event: Event) {
    if (!this.props.onRegionChange) {
      return;
    }
    this.props.onRegionChange(event.nativeEvent.region);
  }
  render() {
    return <RNTMap {...this.props} onChange={this._onChange} />;
  }
}
MapView.propTypes = {
  /**
   * Callback that is called continuously when the user is dragging the map.
   */
  onRegionChange: React.PropTypes.func,
  ...
};
```

## Styles

Since all our native react views are subclasses of `UIView`, most style attributes will work like you would expect out of the box.  Some components will want a default style, however, for example `UIDatePicker` which is a fixed size.  This default style is important for the layout algorithm to work as expected, but we also want to be able to override the default style when using the component.  `DatePickerIOS` does this by wrapping the native component in an extra view, which has flexible styling, and using a fixed style (which is generated with constants passed in from native) on the inner native component:

```javascript
// DatePickerIOS.ios.js

import { UIManager } from 'react-native';
var RCTDatePickerIOSConsts = UIManager.RCTDatePicker.Constants;
...
  render: function() {
    return (
      <View style={this.props.style}>
        <RCTDatePickerIOS
          ref={DATEPICKER}
          style={styles.rkDatePickerIOS}
          ...
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  rkDatePickerIOS: {
    height: RCTDatePickerIOSConsts.ComponentHeight,
    width: RCTDatePickerIOSConsts.ComponentWidth,
  },
});
```

The `RCTDatePickerIOSConsts` constants are exported from native by grabbing the actual frame of the native component like so:

```objective-c
// RCTDatePickerManager.m

- (NSDictionary *)constantsToExport
{
  UIDatePicker *dp = [[UIDatePicker alloc] init];
  [dp layoutIfNeeded];

  return @{
    @"ComponentHeight": @(CGRectGetHeight(dp.frame)),
    @"ComponentWidth": @(CGRectGetWidth(dp.frame)),
    @"DatePickerModes": @{
      @"time": @(UIDatePickerModeTime),
      @"date": @(UIDatePickerModeDate),
      @"datetime": @(UIDatePickerModeDateAndTime),
    }
  };
}
```

This guide covered many of the aspects of bridging over custom native components, but there is even more you might need to consider, such as custom hooks for inserting and laying out subviews.  If you want to go even deeper, check out the actual `RCTMapManager` and other components in the [source code](https://github.com/facebook/react-native/blob/master/React/Views).
