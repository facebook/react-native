---
id: native-modules-ios
title: Native Modules
layout: docs
category: Guides (iOS)
permalink: docs/native-modules-ios.html
banner: ejected
next: native-components-ios
previous: upgrading
---

Sometimes an app needs access to platform API, and React Native doesn't have a corresponding module yet. Maybe you want to reuse some existing Objective-C, Swift or C++ code without having to reimplement it in JavaScript, or write some high performance, multi-threaded code such as for image processing, a database, or any number of advanced extensions.

We designed React Native such that it is possible for you to write real native code and have access to the full power of the platform. This is a more advanced feature and we don't expect it to be part of the usual development process, however it is essential that it exists. If React Native doesn't support a native feature that you need, you should be able to build it yourself.

This is a more advanced guide that shows how to build a native module. It assumes the reader knows Objective-C or Swift and core libraries (Foundation, UIKit).

## iOS Calendar Module Example

This guide will use the [iOS Calendar API](https://developer.apple.com/library/mac/documentation/DataManagement/Conceptual/EventKitProgGuide/Introduction/Introduction.html) example. Let's say we would like to be able to access the iOS calendar from JavaScript.

A native module is just an Objective-C class that implements the `RCTBridgeModule` protocol. If you are wondering, RCT is an abbreviation of ReaCT.

```objective-c
// CalendarManager.h
#import <React/RCTBridgeModule.h>

@interface CalendarManager : NSObject <RCTBridgeModule>
@end
```

In addition to implementing the `RCTBridgeModule` protocol, your class must also include the `RCT_EXPORT_MODULE()` macro. This takes an optional argument that specifies the name that the module will be accessible as in your JavaScript code (more on this later). If you do not specify a name, the JavaScript module name will match the Objective-C class name.

```objective-c
// CalendarManager.m
@implementation CalendarManager

// To export a module named CalendarManager
RCT_EXPORT_MODULE();

// This would name the module AwesomeCalendarManager instead
// RCT_EXPORT_MODULE(AwesomeCalendarManager);

@end
```

React Native will not expose any methods of `CalendarManager` to JavaScript unless explicitly told to. This is done using the `RCT_EXPORT_METHOD()` macro:

```objective-c
#import "CalendarManager.h"
#import <React/RCTLog.h>

@implementation CalendarManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event %@ at %@", name, location);
}
```

Now, from your JavaScript file you can call the method like this:

```javascript
import { NativeModules } from 'react-native';
var CalendarManager = NativeModules.CalendarManager;
CalendarManager.addEvent('Birthday Party', '4 Privet Drive, Surrey');
```

> **NOTE**: JavaScript method names
>
> The name of the method exported to JavaScript is the native method's name up to the first colon. React Native also defines a macro called `RCT_REMAP_METHOD()` to specify the JavaScript method's name. This is useful when multiple native methods are the same up to the first colon and would have conflicting JavaScript names.

The CalendarManager module is instantiated on the Objective-C side using a [CalendarManager new] call. The return type of bridge methods is always `void`. React Native bridge is asynchronous, so the only way to pass a result to JavaScript is by using callbacks or emitting events (see below).

## Argument Types

`RCT_EXPORT_METHOD` supports all standard JSON object types, such as:

- string (`NSString`)
- number (`NSInteger`, `float`, `double`, `CGFloat`, `NSNumber`)
- boolean (`BOOL`, `NSNumber`)
- array (`NSArray`) of any types from this list
- object (`NSDictionary`) with string keys and values of any type from this list
- function (`RCTResponseSenderBlock`)

But it also works with any type that is supported by the `RCTConvert` class (see [`RCTConvert`](https://github.com/facebook/react-native/blob/master/React/Base/RCTConvert.h) for details). The `RCTConvert` helper functions all accept a JSON value as input and map it to a native Objective-C type or class.

In our `CalendarManager` example, we need to pass the event date to the native method. We can't send JavaScript Date objects over the bridge, so we need to convert the date to a string or number. We could write our native function like this:

```objective-c
RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location date:(nonnull NSNumber *)secondsSinceUnixEpoch)
{
  NSDate *date = [RCTConvert NSDate:secondsSinceUnixEpoch];
}
```

or like this:

```objective-c
RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location date:(NSString *)ISO8601DateString)
{
  NSDate *date = [RCTConvert NSDate:ISO8601DateString];
}
```

But by using the automatic type conversion feature, we can skip the manual conversion step completely, and just write:

```objective-c
RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location date:(NSDate *)date)
{
  // Date is ready to use!
}
```

You would then call this from JavaScript by using either:

```javascript
CalendarManager.addEvent('Birthday Party', '4 Privet Drive, Surrey', date.getTime()); // passing date as number of seconds since Unix epoch
```

or

```javascript
CalendarManager.addEvent('Birthday Party', '4 Privet Drive, Surrey', date.toISOString()); // passing date as ISO-8601 string
```

And both values would get converted correctly to the native `NSDate`.  A bad value, like an `Array`, would generate a helpful "RedBox" error message.

As `CalendarManager.addEvent` method gets more and more complex, the number of arguments will grow. Some of them might be optional. In this case it's worth considering changing the API a little bit to accept a dictionary of event attributes, like this:

```objective-c
#import <React/RCTConvert.h>

RCT_EXPORT_METHOD(addEvent:(NSString *)name details:(NSDictionary *)details)
{
  NSString *location = [RCTConvert NSString:details[@"location"]];
  NSDate *time = [RCTConvert NSDate:details[@"time"]];
  ...
}
```

and call it from JavaScript:

```javascript
CalendarManager.addEvent('Birthday Party', {
  location: '4 Privet Drive, Surrey',
  time: date.getTime(),
  description: '...'
})
```

> **NOTE**: About array and map
>
> Objective-C doesn't provide any guarantees about the types of values in these structures. Your native module might expect an array of strings, but if JavaScript calls your method with an array containing numbers and strings, you'll get an `NSArray` containing a mix of `NSNumber` and `NSString`. For arrays, `RCTConvert` provides some typed collections you can use in your method declaration, such as `NSStringArray`, or `UIColorArray`. For maps, it is the developer's responsibility to check the value types individually by manually calling `RCTConvert` helper methods.

## Callbacks

> **WARNING**
>
> This section is more experimental than others because we don't have a solid set of best practices around callbacks yet.

Native modules also supports a special kind of argument- a callback. In most cases it is used to provide the function call result to JavaScript.

```objective-c
RCT_EXPORT_METHOD(findEvents:(RCTResponseSenderBlock)callback)
{
  NSArray *events = ...
  callback(@[[NSNull null], events]);
}
```

`RCTResponseSenderBlock` accepts only one argument - an array of parameters to pass to the JavaScript callback. In this case we use Node's convention to make the first parameter an error object (usually `null` when there is no error) and the rest are the results of the function.

```javascript
CalendarManager.findEvents((error, events) => {
  if (error) {
    console.error(error);
  } else {
    this.setState({events: events});
  }
})
```

A native module should invoke its callback exactly once. It's okay to store the callback and invoke it later. This pattern is often used to wrap iOS APIs that require delegates - see [`RCTAlertManager`](https://github.com/facebook/react-native/blob/master/React/Modules/RCTAlertManager.m) for an example. If the callback is never invoked, some memory is leaked. If both `onSuccess` and `onFail` callbacks are passed, you should only invoke one of them.

If you want to pass error-like objects to JavaScript, use `RCTMakeError` from [`RCTUtils.h`](https://github.com/facebook/react-native/blob/master/React/Base/RCTUtils.h).  Right now this just passes an Error-shaped dictionary to JavaScript, but we would like to automatically generate real JavaScript `Error` objects in the future.

## Promises

Native modules can also fulfill a promise, which can simplify your code, especially when using ES2016's `async/await` syntax. When the last parameters of a bridged native method are an `RCTPromiseResolveBlock` and `RCTPromiseRejectBlock`, its corresponding JS method will return a JS Promise object.

Refactoring the above code to use a promise instead of callbacks looks like this:

```objective-c
RCT_REMAP_METHOD(findEvents,
                 findEventsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray *events = ...
  if (events) {
    resolve(events);
  } else {
    NSError *error = ...
    reject(@"no_events", @"There were no events", error);
  }
}
```

The JavaScript counterpart of this method returns a Promise. This means you can use the `await` keyword within an async function to call it and wait for its result:

```js
async function updateEvents() {
  try {
    var events = await CalendarManager.findEvents();

    this.setState({ events });
  } catch (e) {
    console.error(e);
  }
}

updateEvents();
```

## Threading

The native module should not have any assumptions about what thread it is being called on. React Native invokes native modules methods on a separate serial GCD queue, but this is an implementation detail and might change.  The `- (dispatch_queue_t)methodQueue` method allows the native module to specify which queue its methods should be run on.  For example, if it needs to use a main-thread-only iOS API, it should specify this via:

```objective-c
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}
```

Similarly, if an operation may take a long time to complete, the native module should not block and can specify it's own queue to run operations on. For example, the `RCTAsyncLocalStorage` module creates it's own queue so the React queue isn't blocked waiting on potentially slow disk access:

```objective-c
- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("com.facebook.React.AsyncLocalStorageQueue", DISPATCH_QUEUE_SERIAL);
}
```

The specified `methodQueue` will be shared by all of the methods in your module. If *just one* of your methods is long-running (or needs to be run on a different queue than the others for some reason), you can use `dispatch_async` inside the method to perform that particular method's code on another queue, without affecting the others:

```objective-c
RCT_EXPORT_METHOD(doSomethingExpensive:(NSString *)param callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // Call long-running code on background thread
    ...
    // You can invoke callback from any thread/queue
    callback(@[...]);
  });
}
```

> **NOTE**: Sharing dispatch queues between modules
>
> The `methodQueue` method will be called once when the module is initialized, and then retained by the bridge, so there is no need to retain the queue yourself, unless you wish to make use of it within your module. However, if you wish to share the same queue between multiple modules then you will need to ensure that you retain and return the same queue instance for each of them; merely returning a queue of the same name for each won't work.

## Dependency Injection
The bridge initializes any registered RCTBridgeModules automatically, however you may wish to instantiate your own module instances (so you may inject dependencies, for example).

You can do this by creating a class that implements the RCTBridgeDelegate Protocol, initializing an RCTBridge with the delegate as an argument and initialising a RCTRootView with the initialized bridge.

```objective-c
id<RCTBridgeDelegate> moduleInitialiser = [[classThatImplementsRCTBridgeDelegate alloc] init];

RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:moduleInitialiser launchOptions:nil];

RCTRootView *rootView = [[RCTRootView alloc]
                        initWithBridge:bridge
                            moduleName:kModuleName
                     initialProperties:nil];
```

## Exporting Constants

A native module can export constants that are immediately available to JavaScript at runtime. This is useful for communicating static data that would otherwise require a round-trip through the bridge.

```objective-c
- (NSDictionary *)constantsToExport
{
  return @{ @"firstDayOfTheWeek": @"Monday" };
}
```

JavaScript can use this value right away, synchronously:

```javascript
console.log(CalendarManager.firstDayOfTheWeek);
```

Note that the constants are exported only at initialization time, so if you change `constantsToExport` values at runtime it won't affect the JavaScript environment.

### Enum Constants

Enums that are defined via `NS_ENUM` cannot be used as method arguments without first extending RCTConvert.

In order to export the following `NS_ENUM` definition:

```objc
typedef NS_ENUM(NSInteger, UIStatusBarAnimation) {
    UIStatusBarAnimationNone,
    UIStatusBarAnimationFade,
    UIStatusBarAnimationSlide,
};
```

You must create a class extension of RCTConvert like so:

```objc
@implementation RCTConvert (StatusBarAnimation)
  RCT_ENUM_CONVERTER(UIStatusBarAnimation, (@{ @"statusBarAnimationNone" : @(UIStatusBarAnimationNone),
                                               @"statusBarAnimationFade" : @(UIStatusBarAnimationFade),
                                               @"statusBarAnimationSlide" : @(UIStatusBarAnimationSlide)}),
                      UIStatusBarAnimationNone, integerValue)
@end
```

You can then define methods and export your enum constants like this:

```objc
- (NSDictionary *)constantsToExport
{
  return @{ @"statusBarAnimationNone" : @(UIStatusBarAnimationNone),
            @"statusBarAnimationFade" : @(UIStatusBarAnimationFade),
            @"statusBarAnimationSlide" : @(UIStatusBarAnimationSlide) }
};

RCT_EXPORT_METHOD(updateStatusBarAnimation:(UIStatusBarAnimation)animation
                                completion:(RCTResponseSenderBlock)callback)
```

Your enum will then be automatically unwrapped using the selector provided (`integerValue` in the above example) before being passed to your exported method.


## Sending Events to JavaScript

The native module can signal events to JavaScript without being invoked directly. The preferred way to do this is to subclass `RCTEventEmitter`, implement `suppportEvents` and call `self sendEventWithName`:

```objective-c
// CalendarManager.h
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface CalendarManager : RCTEventEmitter <RCTBridgeModule>

@end
```

```objective-c
// CalendarManager.m
#import "CalendarManager.h"

@implementation CalendarManager

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"EventReminder"];
}

- (void)calendarEventReminderReceived:(NSNotification *)notification
{
  NSString *eventName = notification.userInfo[@"name"];
  [self sendEventWithName:@"EventReminder" body:@{@"name": eventName}];
}

@end
```

JavaScript code can subscribe to these events by creating a new `NativeEventEmitter` instance around your module.

```javascript
import { NativeEventEmitter, NativeModules } from 'react-native';
const { CalendarManager } = NativeModules;

const calendarManagerEmitter = new NativeEventEmitter(CalendarManager);

const subscription = calendarManagerEmitter.addListener(
  'EventReminder',
  (reminder) => console.log(reminder.name)
);
...
// Don't forget to unsubscribe, typically in componentWillUnmount
subscription.remove();
```
For more examples of sending events to JavaScript, see [`RCTLocationObserver`](https://github.com/facebook/react-native/blob/master/Libraries/Geolocation/RCTLocationObserver.m).

### Optimizing for zero listeners
You will receive a warning if you expend resources unnecessarily by emitting an event while there are no listeners. To avoid this, and to optimize your module's workload (e.g. by unsubscribing from upstream notifications or pausing background tasks), you can override `startObserving` and `stopObserving` in your `RCTEventEmitter` subclass.

```objective-c
@implementation CalendarManager
{
  bool hasListeners;
}

// Will be called when this module's first listener is added.
-(void)startObserving {
    hasListeners = YES;
    // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    hasListeners = NO;
    // Remove upstream listeners, stop unnecessary background tasks
}

- (void)calendarEventReminderReceived:(NSNotification *)notification
{
  NSString *eventName = notification.userInfo[@"name"];
  if (hasListeners) { // Only send events if anyone is listening
    [self sendEventWithName:@"EventReminder" body:@{@"name": eventName}];
  }
}
```
## Exporting Swift

Swift doesn't have support for macros so exposing it to React Native requires a bit more setup but works relatively the same.

Let's say we have the same `CalendarManager` but as a Swift class:

```swift
// CalendarManager.swift

@objc(CalendarManager)
class CalendarManager: NSObject {

  @objc(addEvent:location:date:)
  func addEvent(name: String, location: String, date: NSNumber) -> Void {
    // Date is ready to use!
  }

}
```

> **NOTE**: It is important to use the @objc modifiers to ensure the class and functions are exported properly to the Objective-C runtime.

Then create a private implementation file that will register the required information with the React Native bridge:

```objc
// CalendarManagerBridge.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarManager, NSObject)

RCT_EXTERN_METHOD(addEvent:(NSString *)name location:(NSString *)location date:(nonnull NSNumber *)date)

@end
```

For those of you new to Swift and Objective-C, whenever you [mix the two languages in an iOS project](https://developer.apple.com/library/prerelease/ios/documentation/Swift/Conceptual/BuildingCocoaApps/MixandMatch.html), you will also need an additional bridging file, known as a bridging header, to expose the Objective-C files to Swift. Xcode will offer to create this header file for you if you add your Swift file to your app through the Xcode `File>New File` menu option. You will need to import `RCTBridgeModule.h` in this header file.

```objc
// CalendarManager-Bridging-Header.h
#import <React/RCTBridgeModule.h>
```

You can also use `RCT_EXTERN_REMAP_MODULE` and `RCT_EXTERN_REMAP_METHOD` to alter the JavaScript name of the module or methods you are exporting. For more information see [`RCTBridgeModule`](https://github.com/facebook/react-native/blob/master/React/Base/RCTBridgeModule.h).
