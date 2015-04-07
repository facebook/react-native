---
id: troubleshooting
title: Troubleshooting
layout: docs
category: Quick Start
permalink: docs/troubleshooting.html
---

## Cmd-R does not reload the simulator
Enable iOS simulator's "Connect hardware keyboard" from menu Hardware > Keyboard menu. 

![Keyboard Menu](https://cloud.githubusercontent.com/assets/1388454/6863127/03837824-d409-11e4-9251-e05bd31d978f.png)


If you are using a non-QWERTY/AZERTY keyboard layout you can use the `Hardware > Shake Gesture` to bring up the dev menu and click "Refresh"

## Port already in use red-screen
![red-screen](https://cloud.githubusercontent.com/assets/602176/6857442/63fd4f0a-d3cc-11e4-871f-875b0c784611.png)


Something is probably already running on port 8081. You can either kill it or try to change which port the packager is listening to.

##### Kill process on port 8081
`$ sudo lsof -n -i4TCP:8081 | grep LISTEN`

then

`$ kill -9 <cma process id>`



##### Change the port in Xcode
Edit `AppDelegate.m` to use a different port.
```
  // OPTION 1
  // Load from development server. Start the server from the repository root:
  //
  // $ npm start
  //
  // To run on device, change `localhost` to the IP address of your computer, and make sure your computer and
  // iOS device are on the same Wi-Fi network.
  jsCodeLocation = [NSURL URLWithString:@"http://localhost:9381/index.ios.bundle"];
  ```


## Watchman took too long to load
Permission settings prevent Watchman from loading. A recent update solves this, get a HEAD install of Watchman if you are experiencing this error.

```
brew uninstall watchman
brew install --HEAD watchman
```

## NPM locking error

If in the `react-native init <project>` phase you saw npm fail with "npm WARN locking Error: EACCES" then try the following:
```
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules
```
