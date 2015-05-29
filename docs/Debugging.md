---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: testing
---

## Debugging React Native Apps
To access the in-app developer menu, shake the iOS device or simulate a shake in the iOS Simulator by pressing `Control + ⌘ + z`.

> Hint
>
> To disable the in-app developer menu for production builds of your application, open the project in Xcode and navigate to `Product` → `Scheme` → `Edit Scheme...`(or press `⌘ + <`), select `Run` from the menu on the left, and change the Build Configuration to `Release`.

### Reload
Selecting Reload will reload the iOS application (this is the same as pressing `⌘ + r` in the iOS Simulator).

### Chrome Developer Tools
To debug the JavaScript code of your React app in Chrome, either select the option from the developer menu or press `⌘ + d` to open the in-app developer menu, select `Debug in Chrome`, and a webpage should open up at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui).

Press `⌘ + Option + i` to open the Chrome Developer Tools, or open it via `View` → `Developer` → `Developer Tools`.

You should now be able to debug as you normally would.

Enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.

> Hint
>
> To debug on a real device: Open the file `RCTWebSocketExecutor.m` and change `localhost` to the IP address of your computer. Shake the device to open the development menu with the option to start debugging.

#### React Developer Tools (optional)
Install the [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension for Google Chrome. This will allow you to navigate the view hierarchy if you select the `React` tab when the developer tools are open.

### Live Reload
Enable Live Reload via the developer menu to have the application automatically reload when changes are made.
