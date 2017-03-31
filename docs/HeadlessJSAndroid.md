---
id: headless-js-android
title: Headless JS
layout: docs
category: Guides (Android)
permalink: docs/headless-js-android.html
banner: ejected
next: signed-apk-android
previous: native-components-android
---

Headless JS is a way to run tasks in JavaScript while your app is in the background. It can be used, for example, to sync fresh data, handle push notifications, or play music.

## The JS API

A task is a simple async function that you register on `AppRegistry`, similar to registering React applications:

```js
AppRegistry.registerHeadlessTask('SomeTaskName', () => require('SomeTaskName'));
```

Then, in `SomeTaskName.js`:

```js
module.exports = async (taskData) => {
  // do stuff
}
```

You can do anything in your task as long as it doesn't touch UI: network requests, timers and so on. Once your task completes (i.e. the promise is resolved), React Native will go into "paused" mode (unless there are other tasks running, or there is a foreground app).

## The Java API

Yes, this does still require some native code, but it's pretty thin. You need to extend `HeadlessJsTaskService` and override `getTaskConfig`, e.g.:

```java
public class MyTaskService extends HeadlessJsTaskService {

  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras != null) {
      return new HeadlessJsTaskConfig(
          "SomeTaskName",
          Arguments.fromBundle(extras),
          5000);
    }
    return null;
  }
}
```

Now, whenever you [start your service][0], e.g. as a periodic task or in response to some system event / broadcast, JS will spin up, run your task, then spin down.

## Caveats

* By default, your app will crash if you try to run a task while the app is in the foreground. This is to prevent developers from shooting themselves in the foot by doing a lot of work in a task and slowing the UI. There is a way around this.
* If you start your service from a `BroadcastReceiver`, make sure to call `HeadlessJsTaskService.acquireWakelockNow()` before returning from `onReceive()`.

[0]: https://developer.android.com/reference/android/content/Context.html#startService(android.content.Intent)
