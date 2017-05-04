---
id: linking-libraries-ios
title: Linking Libraries
layout: docs
category: Guides (iOS)
permalink: docs/linking-libraries-ios.html
banner: ejected
next: running-on-simulator-ios
previous: native-components-ios
---

Not every app uses all the native capabilities, and including the code to support
all those features would impact the binary size... But we still want to make it
easy to add these features whenever you need them.

With that in mind we exposed many of these features as independent static libraries.

For most of the libs it will be as simple as dragging two files, sometimes a third
step will be necessary, but no more than that.

_All the libraries we ship with React Native live on the `Libraries` folder in
the root of the repository. Some of them are pure JavaScript, and you only need
to `require` it. Other libraries also rely on some native code, in that case
you'll have to add these files to your app, otherwise the app will throw an
error as soon as you try to use the library._

## Here the few steps to link your libraries that contain native code

### Automatic linking

#### Step 1

Install a library with native dependencies:
```bash
$ npm install <library-with-native-dependencies> --save
```

**Note:** _`--save` or `--save-dev` flag is very important for this step. React Native will link
your libs based on `dependencies` and `devDependencies` in your `package.json` file._

#### Step 2

Link your native dependencies:
```bash
$ react-native link
```

Done! All libraries with a native dependencies should be successfully linked to your iOS/Android project.

### Manual linking

#### Step 1

If the library has native code, there must be a `.xcodeproj` file inside it's
folder.
Drag this file to your project on Xcode (usually under the `Libraries` group
on Xcode);

![](img/AddToLibraries.png)

#### Step 2

Click on your main project file (the one that represents the `.xcodeproj`)
select `Build Phases` and drag the static library from the `Products` folder
inside the Library you are importing to `Link Binary With Libraries`

![](img/AddToBuildPhases.png)

#### Step 3

Not every library will need this step, what you need to consider is:

_Do I need to know the contents of the library at compile time?_

What that means is, are you using this library on the native side or only in
JavaScript? If you are only using it in JavaScript, you are good to go!

This step is not necessary for libraries that we ship with React Native with the
exception of `PushNotificationIOS` and `Linking`.

In the case of the `PushNotificationIOS` for example, you have to call a method
on the library from your `AppDelegate` every time a new push notification is
received.

For that we need to know the library's headers. To achieve that you have to go
to your project's file, select `Build Settings` and search for `Header Search
Paths`. There you should include the path to your library (if it has relevant
files on subdirectories remember to make it `recursive`, like `React` on the
example).

![](img/AddToSearchPaths.png)
