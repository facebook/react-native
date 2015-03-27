---
id: libraries
title: Linking Libraries
layout: docs
category: Guides
permalink: docs/linking-libraries.html
next: debugging
---

Not every app uses all the native capabilities, and including the code to support
all those features would impact in the binary size... But we still want to make
easy to add these features whenever you need them.

With that in mind we exposed many of these features as independent static libraries.

For most of the libs it will be as simples as dragging two files, sometimes a third
step will be necessary, but no more than that.

_All the libraries we ship with React Native live on the `Libraries` folder in
the root of the repository. Some of them are pure JavaScript, and you just need
to `require` it. Other libraries also rely on some native code, in that case
you'll have to add these files to your app, otherwise the app will throw an
error as soon as you try to use the library._

## Here the few steps to link your libraries that contain native code

### Step 1

If the library has native code, there must be a `.xcodeproj` file inside it's
folder.
Drag this file to your project on Xcode (usually under the `Libaries` group
on Xcode);

### Step 2

Click on your main project file (the one that represents the `.xcodeproj`)
select `Build Phases` and drag the static library from the `Products` folder
insed the Library you are importing to `Link Binary With Libraries`

### Step 3

The first two steps will be enough for all libraries that we ship we Ract Native
but PushNotificationIOS and LinkingIOS. Why is that?

Most of the libraries we ship are not statically referenced anywhere in the
main code, they are `BridgeModules` that are loaded into the `bridge` instance
at runtime, and then you'll just be able to access it via JavaScript.

In the case of the PushNotificationIOS for example, you have to call a method
on the library every time a new push notifiation is received.
For that we need to know the library's headers. To enable that go to you project
file, select `Build Settings` and search for `Header Search Paths`. There
you should include the path to you library, and if it has relevant files on
subdirectories remember to check `recursive`.
