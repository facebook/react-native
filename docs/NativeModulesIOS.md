---
id: nativemodulesios
title: Native Modules (iOS)
layout: docs
category: Guides
permalink: docs/nativemodulesios.html
next: activityindicatorios
---

Sometimes an app needs access to platform API, and React Native doesn't have a corresponding wrapper yet. This is a more advanced guide that shows how to build a native module. It assumes the reader knows Objective-C (Swift is not supported yet) and core libraries (Foundation, UIKit).

## iOS Calendar module example

This guide will use iOS Calendar API example. Let's say we would like to be able to access iOS calendar from JavaScript.

Native module is just an Objectve-C class that implements `RCTBridgeModule` protocol.

```objective-c
// RCTCalendarManager.h
#import "RCTBridgeModule.h"

@interface RCTCalendarManager : NSObject <RCTBridgeModule>
@end
```

React Native will not expose any methods of `RCTCalendarManager` to JavaScript unless explicitly asked. Fortunately this is pretty easy with `RCT_EXPORT`:

```objective-c
// RCTCalendarManager.m
@implementation RCTCalendarManager

- (void)addEventWithName:(NSString *)name location:(NSString *)location
{
  RCT_EXPORT();
  RCTLogInfo(@"Pretending to create an event %@ at @%@", name, location);
}

@end
```

Now from your JavaScript file you can call the method like this:

```javascript
var CalendarManager = require('NativeModules').CalendarManager;
CalendarManager.addEventWithName('Birthday Party', '4 Privet Drive, Surrey');
```

Notice that the module name doesn't have `RCT` prefix. Exported method name was generated from first part of Objective-C selector. Sometimes it results in a non-idiomatic JavaScript name (like the one in our example). You can change the name by supplying an optional argument to `RCT_EXPORT`, e.g. `RCT_EXPORT("addEvent")`.

The return type of the method should always be `void`. React Native bridge is asynchronous, so the only way to pass result to JavaScript is by using callbacks or emitting events (see below).

## Argument types

React Native supports several types of arguments that can be passed from JavaScript code to native module:

- string (`NSString`)
- number (`NSInteger`, `float`, `NSNumber`)
- boolean (`BOOL`, `NSNumber`)
- array (`NSArray`) of any types from this list
- map (`NSDictionary`) with string keys and values of any type from this list
- function (`RCTResponseSenderBlock`)

In our `CalendarManager` example, if we want to pass event date to native, we have to convert it to a string or a number:

```objective-c
- (void)addEventWithName:(NSString *)name location:(NSString *)location date:(NSInteger)secondsSinceUnixEpoch
{
  RCT_EXPORT("addEvent");
  NSDate *date = [NSDate dateWithTimeIntervalSince1970:secondsSinceUnixEpoch];
}
```

As `CalendarManager.addEvent` method gets more and more complex, the number of arguments will grow. Some of them might be optional. In this case it's worth considering changing the API a little bit to accept a dictionary of event attributes, like this:

```objective-c
- (void)addEventWithName:(NSString *)name details:(NSDictionary *)details
{
  RCT_EXPORT("addEvent");
  NSString *location = details[@"location"];
  if ([location isKindOfClass:[NSString class]]) {
    ...
  }
}
```

and call it from JavaScript:

```javascript
CalendarManager.addEvent('Birthday Party', {
  location: '4 Privet Drive, Surrey',
  time: date.toTime(),
  description: '...'
})
```

NOTE about array and map - React Native doesn't provide any guarantees about the types of values in these structures. Your native module might expect array of strings, but if JavaScript calls your method with an array that contains number and string you'll get `NSArray` with `NSNumber` and `NSString`. It's developer's responsibility to check array/map values types.

# Callbacks

WARNING: This section is even more experimental than others, we don't have a set of best practices around callbacks yet.

Native module also supports a special kind of argument - callback. In most cases it is used to provide function call result to JavaScript.

```objective-c
- (void)findEvents:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();
  NSArray *events = ...
  callback(@[[NSNull null], events]);
}
```

`RCTResponseSenderBlock` accepts only one argument - array of arguments to pass to JavaScript callback. In this case we use node's convention to set first argument to error and the rest - to the result of the function.

```javascript
CalendarManager.findEvents((error, events) => {
  if (error) {
    console.error(error);
  } else {
    this.setState({events: events});
  }
})
```

Native module is supposed to invoke callback only once. It can, however, store the callback as an ivar and invoke it later. This pattern is often used to wrap iOS APIs that require delegate. See `RCTAlertManager`.

If you want to pass error-like object to JavaScript, use `RCTMakeError` from `RCTUtils.h`.

## Implementing native module

The native module should not have any assumptions about what thread it is being called on. React Native invokes native modules methods on a separate serial GCD queue, but this is an implementation detail and might change. If the native module needs to call main-thread-only iOS API, it should schedule the operation on the main queue:


```objective-c
- (void)addEventWithName:(NSString *)name callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT("addEvent");
  dispatch_async(dispatch_get_main_queue(), ^{
    // Call iOS API on main thread
    ...
    // You can invoke callback from any thread/queue
    callback(@[...]);
  });
}
```

The same way if the operation can take a long time to complete, the native module should not block. It is a good idea to use `dispatch_async` to schedule expensive work on background queue.

## Exporting constants

Native module can export constants that are instantly available to JavaScript at runtime. This is useful to export some initial data that would otherwise require a bridge round-trip.

```objective-c
- (NSDictionary *)constantsToExport
{
  return @{ @"firstDayOfTheWeek": @"Monday" };
}
```

JavaScript can use this value right away:

```javascript
console.log(CalendarManager.firstDayOfTheWeek);
```

Note that the constants are exported only at initialization time, so if you change `constantsToExport` value at runtime it won't affect JavaScript environment.


## Sending events to JavaScript

The native module can signal events to JavaScript without being invoked directly. The easiest way to do this is to use `eventDispatcher`:

```objective-c
- (void)calendarEventReminderReceived:(NSNotification *)notification
{
  NSString *eventName = notification.userInfo[@"name"];
  [self.bridge.eventDispatcher sendAppEventWithName:@"EventReminder"
                                               body:@{@"name": eventName}];
}
```

JavaScript code can subscribe to these events:

```javascript
var subscription = RCTDeviceEventEmitter.addListener(
  'EventReminder',
  (reminder) => console.log(reminder.name)
);
...
// Don't forget to unsubscribe
subscription.remove();
```

For more examples of sending events to JavaScript, see `RCTLocationObserver`.
