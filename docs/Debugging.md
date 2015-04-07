---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: testing
---

## Debugging React Native Apps
To debug the javascript code of your react app do the following:

 1. Run your application in the iOS simulator.
 2. Press ```Command + D``` and a webpage should open up at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui). (Chrome only for now)
 3. Enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.
 4. Press ```Command + Option + I``` to open the Chrome Developer tools, or open it via ```View``` -> ```Developer``` -> ```Developer Tools```.
 5. You should now be able to debug as you normally would.

> Hint
>
> To debug on a real device: Open the file ```RCTWebSocketExecutor.m``` and change ```localhost``` to the IP address of your computer. Shake the device to open the development menu with the option to start debugging. 

### Optional
Install the [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension for Google Chrome. This will allow you to navigate the view hierarchy if you select the ```React``` tab when the developer tools are open.

## Live Reload
To activate Live Reload do the following:

1. Run your application in the iOS simulator.
2. Press ```Control + Command + Z```.
3. You will now see the `Enable/Disable Live Reload`, `Reload` and `Enable/Disable Debugging` options.
