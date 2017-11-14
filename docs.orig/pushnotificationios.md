---
id: pushnotificationios
title: PushNotificationIOS
---

<div class="banner-crna-ejected">
  <h3>Projects with Native Code Only</h3>
  <p>
    This section only applies to projects made with <code>react-native init</code>
    or to those made with Create React Native App which have since ejected. For
    more information about ejecting, please see
    the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
    the Create React Native App repository.
  </p>
</div>

Handle push notifications for your app, including permission handling and
icon badge number.

To get up and running, [configure your notifications with Apple](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/AddingCapabilities/AddingCapabilities.html#//apple_ref/doc/uid/TP40012582-CH26-SW6)
and your server-side system.

[Manually link](docs/linking-libraries-ios.html#manual-linking) the PushNotificationIOS library

- Add the following to your Project: `node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj`
- Add the following to `Link Binary With Libraries`: `libRCTPushNotification.a`

Finally, to enable support for `notification` and `register` events you need to augment your AppDelegate.

At the top of your `AppDelegate.m`:

  `#import <React/RCTPushNotificationManager.h>`

And then in your AppDelegate implementation add the following:

  ```
   // Required to register for notifications
   - (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
   {
    [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
   }
   // Required for the register event.
   - (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
   {
    [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
   }
   // Required for the notification event. You must call the completion handler after handling the remote notification.
   - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
                                                          fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
   {
     [RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
   }
   // Required for the registrationError event.
   - (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
   {
    [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
   }
   // Required for the localNotification event.
   - (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
   {
    [RCTPushNotificationManager didReceiveLocalNotification:notification];
   }
  ```


### Methods

- [`presentLocalNotification`](docs/pushnotificationios.html#presentlocalnotification)
- [`scheduleLocalNotification`](docs/pushnotificationios.html#schedulelocalnotification)
- [`cancelAllLocalNotifications`](docs/pushnotificationios.html#cancelalllocalnotifications)
- [`removeAllDeliveredNotifications`](docs/pushnotificationios.html#removealldeliverednotifications)
- [`getDeliveredNotifications`](docs/pushnotificationios.html#getdeliverednotifications)
- [`removeDeliveredNotifications`](docs/pushnotificationios.html#removedeliverednotifications)
- [`setApplicationIconBadgeNumber`](docs/pushnotificationios.html#setapplicationiconbadgenumber)
- [`getApplicationIconBadgeNumber`](docs/pushnotificationios.html#getapplicationiconbadgenumber)
- [`cancelLocalNotifications`](docs/pushnotificationios.html#cancellocalnotifications)
- [`getScheduledLocalNotifications`](docs/pushnotificationios.html#getscheduledlocalnotifications)
- [`addEventListener`](docs/pushnotificationios.html#addeventlistener)
- [`removeEventListener`](docs/pushnotificationios.html#removeeventlistener)
- [`requestPermissions`](docs/pushnotificationios.html#requestpermissions)
- [`abandonPermissions`](docs/pushnotificationios.html#abandonpermissions)
- [`checkPermissions`](docs/pushnotificationios.html#checkpermissions)
- [`getInitialNotification`](docs/pushnotificationios.html#getinitialnotification)
- [`constructor`](docs/pushnotificationios.html#constructor)
- [`finish`](docs/pushnotificationios.html#finish)
- [`getMessage`](docs/pushnotificationios.html#getmessage)
- [`getSound`](docs/pushnotificationios.html#getsound)
- [`getCategory`](docs/pushnotificationios.html#getcategory)
- [`getAlert`](docs/pushnotificationios.html#getalert)
- [`getContentAvailable`](docs/pushnotificationios.html#getcontentavailable)
- [`getBadgeCount`](docs/pushnotificationios.html#getbadgecount)
- [`getData`](docs/pushnotificationios.html#getdata)

## Events

- [PushNotificationEventName](docs/pushnotificationios.html#pushnotificationeventname)

---

# Reference

## Methods

### `presentLocalNotification()`

```javascript
presentLocalNotification(details)
```

Schedules the localNotification for immediate presentation.

`details` is an object containing:

- `alertBody` : The message displayed in the notification alert.
- `alertAction` : The "action" displayed beneath an actionable notification. Defaults to "view";
- `soundName` : The sound played when the notification is fired (optional).
- `isSilent`  : If true, the notification will appear without sound (optional).
- `category`  : The category of this notification, required for actionable notifications (optional).
- `userInfo`  : An optional object containing additional notification data.
- `applicationIconBadgeNumber` (optional) : The number to display as the app's icon badge. The default value of this property is 0, which means that no badge is displayed.


---

### `scheduleLocalNotification()`

```javascript
static scheduleLocalNotification(details)
```


Schedules the localNotification for future presentation.

details is an object containing:

- `fireDate` : The date and time when the system should deliver the notification.
- `alertTitle` : The text displayed as the title of the notification alert.
- `alertBody` : The message displayed in the notification alert.
- `alertAction` : The "action" displayed beneath an actionable notification. Defaults to "view";
- `soundName` : The sound played when the notification is fired (optional).
- `isSilent`  : If true, the notification will appear without sound (optional).
- `category`  : The category of this notification, required for actionable notifications (optional).
- `userInfo` : An optional object containing additional notification data.
- `applicationIconBadgeNumber` (optional) : The number to display as the app's icon badge. Setting the number to 0 removes the icon badge.
- `repeatInterval` : The interval to repeat as a string.  Possible values: `minute`, `hour`, `day`, `week`, `month`, `year`.




---

### `cancelAllLocalNotifications()`

```javascript
static cancelAllLocalNotifications()
```


Cancels all scheduled localNotifications




---

### `removeAllDeliveredNotifications()`

```javascript
static removeAllDeliveredNotifications()
```


Remove all delivered notifications from Notification Center




---

### `getDeliveredNotifications()`

```javascript
static getDeliveredNotifications(callback)
```


Provides you with a list of the app’s notifications that are still displayed in Notification Center.

A delivered notification is an object containing:

- `identifier`: The identifier of this notification.
- `title`: The title of this notification.
- `body`: The body of this notification.
- `category`: The category of this notification, if has one.
- `userInfo`: An optional object containing additional notification data.
- `thread-id`: The thread identifier of this notification, if has one.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | function | Yes | Function which receives an array of delivered notifications. |




---

### `removeDeliveredNotifications()`

```javascript
static removeDeliveredNotifications(identifiers)
```

Removes the specified notifications from Notification Center.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| identifiers | array | Yes | Array of notification identifiers |



---

### `setApplicationIconBadgeNumber()`

```javascript
static setApplicationIconBadgeNumber(number)
```


Sets the badge number for the app icon on the home screen




---

### `getApplicationIconBadgeNumber()`

```javascript
static getApplicationIconBadgeNumber(callback)
```


Gets the current badge number for the app icon on the home screen




---

### `cancelLocalNotifications()`

```javascript
static cancelLocalNotifications(userInfo)
```


Cancel local notifications.

Optionally restricts the set of canceled notifications to those
notifications whose `userInfo` fields match the corresponding fields
in the `userInfo` argument.




---

### `getScheduledLocalNotifications()`

```javascript
static getScheduledLocalNotifications(callback)
```


Gets the local notifications that are currently scheduled.




---

### `addEventListener()`

```javascript
static addEventListener(type, handler)
```


Attaches a listener to remote or local notification events while the app is running
in the foreground or the background.

Valid events are:

- `notification` : Fired when a remote notification is received. The
  handler will be invoked with an instance of `PushNotificationIOS`.
- `localNotification` : Fired when a local notification is received. The
  handler will be invoked with an instance of `PushNotificationIOS`.
- `register`: Fired when the user registers for remote notifications. The
  handler will be invoked with a hex string representing the deviceToken.
- `registrationError`: Fired when the user fails to register for remote
  notifications. Typically occurs when APNS is having issues, or the device
  is a simulator. The handler will be invoked with
  {message: string, code: number, details: any}.




---

### `removeEventListener()`

```javascript
static removeEventListener(type, handler)
```


Removes the event listener. Do this in `componentWillUnmount` to prevent
memory leaks




---

### `requestPermissions()`

```javascript
static requestPermissions(permissions?)
```


Requests notification permissions from iOS, prompting the user's
dialog box. By default, it will request all notification permissions, but
a subset of these can be requested by passing a map of requested
permissions.
The following permissions are supported:

  - `alert`
  - `badge`
  - `sound`

If a map is provided to the method, only the permissions with truthy values
will be requested.

This method returns a promise that will resolve when the user accepts,
rejects, or if the permissions were previously rejected. The promise
resolves to the current state of the permission.




---

### `abandonPermissions()`

```javascript
static abandonPermissions()
```


Unregister for all remote notifications received via Apple Push Notification service.

You should call this method in rare circumstances only, such as when a new version of
the app removes support for all types of remote notifications. Users can temporarily
prevent apps from receiving remote notifications through the Notifications section of
the Settings app. Apps unregistered through this method can always re-register.




---

### `checkPermissions()`

```javascript
static checkPermissions(callback)
```


See what push permissions are currently enabled. `callback` will be
invoked with a `permissions` object:

 - `alert` :boolean
 - `badge` :boolean
 - `sound` :boolean




---

### `getInitialNotification()`

```javascript
static getInitialNotification()
```


This method returns a promise that resolves to either the notification
object if the app was launched by a push notification, or `null` otherwise.




---

### `constructor()`

```javascript
constructor(nativeNotif)
```


You will never need to instantiate `PushNotificationIOS` yourself. Listening to the `notification` event and invoking `getInitialNotification` is sufficient.




---

### `finish()`

```javascript
finish(fetchResult)
```


This method is available for remote notifications that have been received via [`application:didReceiveRemoteNotification:fetchCompletionHandler:`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623013-application).

Call this to execute when the remote notification handling is complete. When calling this block, pass in the fetch result value that best describes the results of your operation. You *must* call this handler and should do so as soon as possible. For a list of possible values, see `PushNotificationIOS.FetchResult`.

If you do not call this method your background remote notifications could be throttled, to read more about it see the above documentation link.


---

### `getMessage()`

```javascript
getMessage()
```


An alias for `getAlert` to get the notification's main message string




---

### `getSound()`

```javascript
getSound()
```


Gets the sound string from the `aps` object




---

### `getCategory()`

```javascript
getCategory()
```


Gets the category string from the `aps` object




---

### `getAlert()`

```javascript
getAlert()
```


Gets the notification's main message from the `aps` object




---

### `getContentAvailable()`

```javascript
getContentAvailable()
```


Gets the content-available number from the `aps` object




---

### `getBadgeCount()`

```javascript
getBadgeCount()
```


Gets the badge count number from the `aps` object




---

### `getData()`

```javascript
getData()
```


Gets the data object on the notif



## Events

### `PushNotificationEventName`

An event emitted by PushNotificationIOS.

- `notification` - Fired when a remote notification is received. The handler will be invoked with an instance of `PushNotificationIOS`.
- `localNotification` - Fired when a local notification is received. The handler will be invoked with an instance of `PushNotificationIOS`.
- `register` - Fired when the user registers for remote notifications. The handler will be invoked with a hex string representing the deviceToken.
- `registrationError` - Fired when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a emulator. The handler will be invoked with `{message: string, code: number, details: any}`.