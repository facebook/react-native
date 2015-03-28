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
 3. Press ```Command + Option + I``` to open the Chrome Developer tools, or open it via ```View``` -> ```Developer``` -> ```Developer Tools```.
 4. You should now be able to debug as you normally would.

### Optional
Install the [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) extension for Google Chrome. This will allow you to navigate the view hierarchy if you select the ```React``` tab when the developer tools are open.