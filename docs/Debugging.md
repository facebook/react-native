---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: testing
---

## Debugging React Native Apps
To access the in-app developer menu, shake the iOS device or press `control + ⌘ + z` in the simulator.

> Hint
>
> To disable the developer menu for production builds, open your project in Xcode and select `Product` → `Scheme` → `Edit Scheme...` (or press `⌘ + <`). Next, select `Run` from the menu on the left and change the Build Configuration to `Release`.

### Reload
Selecting `Reload` or pressing `⌘ + r` in the simulator will reload the JavaScript that powers your application. If you have added new resources (such as an image to `Images.xcassets`) or modified any Objective-C/Swift code, you will need to re-build from Xcode for the changes to take effect (you can do this with `⌘ + r` in Xcode).

### Chrome Developer Tools
To debug the JavaScript code in Chrome, select `Debug in Chrome` from the developer menu. This will open a new tab at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui).

Press `⌘ + option + i` or select `View` → `Developer` → `Developer Tools` to toggle the developer tools console. Enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.

To debug on a real device: Open the file `RCTWebSocketExecutor.m` and change `localhost` to the IP address of your computer. Shake the device to open the development menu with the option to start debugging.

#### React Developer Tools (optional)
Install the [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension for Google Chrome. This will allow you to navigate the component hierarchy via the `React` in the developer tools (see [facebook/react-devtools](https://github.com/facebook/react-devtools) for more information).

### Live Reload
Select `Enable Live Reload` via the developer menu to have the application automatically reload when changes are made to the JavaScript.

### FPS (Frames per Second) Monitor
On `0.5.0-rc` and higher versions, you can enable a FPS graph overlay in the developers menu in order to help you debug performance problems.
