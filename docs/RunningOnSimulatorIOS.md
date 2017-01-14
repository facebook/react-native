---
id: running-on-simulator-ios
title: Running On Simulator
layout: docs
category: Guides (iOS)
permalink: docs/running-on-simulator-ios.html
next: communication-ios
previous: linking-libraries-ios
---

## Starting the simulator

Once you have your React Native project initialized, you can run `react-native run-ios` inside the newly created project directory. If everything is set up correctly, you should see your new app running in the iOS Simulator shortly.

## Specifying a device

You can specify the device the simulator should run with the `--simulator` flag, followed by the device name as a string. The default is `"iPhone 6"`. If you wish to run your app on an iPhone 4s, just run `react-native run-ios --simulator="iPhone 4s"`.

The device names correspond to the list of devices available in Xcode. You can check your available devices by running `xcrun simctl list devices` from the console.

## Troubleshooting

*Install your `{ProjectName}.App` file on the simulator*.  You may drag and drop it directly on the Home screen with the latest version.  Read more about the iOS Simulator [here](https://developer.apple.com/library/content/documentation/IDEs/Conceptual/iOS_Simulator_Guide/GettingStartedwithiOSSimulator/GettingStartedwithiOSSimulator.html).

*Finding your `{ProjectName}.App` file:* the default Xcode build path will be in `build/Products/Debug-iphonesimulator/{ProjectName}.app.`  Otherwise if you open your Project.xcodeproject or Project.xcworkspace file with Xcode, then you can find your build path under `File > Workspace Settings` then click `Advanced`, if you haven't already select `Custom` and `Relative to Workspace`.  You should see right below it a path for Products, like `build/Products`.  

If you receive this error:
``
An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=2):
Failed to install the requested application
An application bundle was not found at the provided path.
Provide a valid path to the desired application bundle.
Print: Entry, ":CFBundleIdentifier", Does Not Exist
``
It is because the xcodebuild tool can not find your `{ProjectName}.App` file.  You can either set the path in two ways.
1. In Xcode, refer to Finding your .App file.
2. In the terminal, using the `--xcodePath` command like this
``
react-native run-ios --xcodePath 'build/Products'
``
