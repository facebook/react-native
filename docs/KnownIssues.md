---
id: known-issues
title: Known Issues
layout: docs
category: Guides
permalink: docs/known-issues.html
next: activityindicatorios
---

###Missing Modules and Native Views
This is an initial release of React Native Android and therefore not all of the views present on iOS are released on Android. We are very much interested in the communities' feedback on the next set of modules and views for Open Source. Not all native views between iOS and Android have a 100% equivalent representation, here it will be necessary to use a counterpart eg using ProgressBar on Android in place of ActivityIndicator on iOS. 

Our provisional plan for common views and modules includes:

Views
```
    View Pager
    Swipe Refresh
    Spinner
    ART
    Maps
    Webview
```
Modules
```
    Geo Location
    Net Info
    Camera Roll
    App State
    Dialog
    Intent
    Media
    Pasteboard
    Alert
```
###Publishing modules on Android
There is currently no easy way of publishing custom native modules on Android. Smooth work flow for contributors is important and this will be looked at very closely after the initial Open Source release. Of course the aim will be to streamline and optimize the process between iOS and Android as much as possible.
###Overlay view with opacity of 0 cannot be clicked through
There is a noted difference in the handling of Views with an opacity of 0 between iOS and Android. While iOS will allow these views to be clicked through and the View below will receive the touch input, for Android the touch will be blocked. This can be demonstrated in this example where it will only be possible to click the touchable on iOS.

```
    <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => alert('hi!')}>
            <Text>HELLO!</Text>
        </TouchableOpacity>
        <View style={{
          position: 'absolute', 
          top: 0, 
          left: 0, 
          bottom: 0, 
          right: 0, 
          opacity: 0}} />
    </View>
```

###Layout-only nodes on android
An optimization feature of the Android version of React Native is for views which only contribute to the layout to not have a native view, only their layout properties are propagated to their children views. This optimization is to provide stability in deep view hierarchies for React Native and is therefore enabled by default. Should you depend on a view being present or internal tests incorrectly detect a view is layout only it will be necessary to turn off this behavior. To do this, set `collapsable` to false as in this example:
```
    <View collapsable={false}>
        ...
    </View>
```


