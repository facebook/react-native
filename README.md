**Warning: This is currently a private repo to accompany the ReactJS conference
talk, and is not accessible outside the official conference attendees - please
do not share this code.**

This is also a very early alpha release.  There are certainly bugs and missing
features. Some things may even be well-documented in JS, but missing from the
native implementation.  We are committed to improving and expanding the
capabilities of this project as fast as we can, and look forward to working with
the community.

# React Native [![Build Status](https://magnum.travis-ci.com/facebook/react-native.svg?token=L5Egb3B4dyQzH5wDijCB&branch=master)](https://magnum.travis-ci.com/facebook/react-native)

Our first React Native implementation is `React`, targeting iOS.  We are also
working on an Android implementation which we will release later.  `React`
apps are built using the [React JS](https://github.com/facebook/react) framework, and render directly to
native UIKit elements using a fully asynchronous architecture.  There is no
browser and no HTML. We have picked what we think is the best set of features
from these and other technologies to build what we hope to become the best
product development framework available, with an emphasis on iteration speed,
developer delight, continuity of technology, and absolutely beautiful and fast
products with no compromises in quality or capability.

## Requirements

1. OS X - This repo only contains the iOS implementation right now, and Xcode only runs on Mac.
2. New to Xcode?  [Download it](https://developer.apple.com/xcode/downloads/) from the Mac App Store.
3. [Homebrew](http://brew.sh/) is the recommended way to install node, watchman, and flow.
4. New to node or npm? `brew install node`
5. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.  `brew install watchman`
6. If you want to use [flow](http://www.flowtype.org), `brew install flow`

## Quick start

Get up and running with our Movies sample app:

1. Once you have the repo cloned and met all the requirements above, start the
packager that will transform your JS code on-the-fly:

  ```
  npm install
  npm start
  ```
2. Open the `Examples/Movies/Movies.xcodeproj` project in Xcode.
3. Make sure the target is set to `Movies` and that you have an iOS simulator
selected to run the app.
4. Build and run the project with the Xcode run button.

You should now see the Movies app running on your iOS simulator.
Congratulations!  You've just successfully run your first React Native app.

Now try editing a JavaScript file and viewing your changes. Let's change the
movie search placeholder text:

1. Open the `Examples/Movies/SearchScreen.js` file in your favorite JavaScript
editor.
2. Look for the current search placeholder text and change it to "Search for an
awesome movie...".
3. Hit cmd+R ([twice](http://openradar.appspot.com/19613391)) in your iOS simulator to reload the app and see your change.
If you don't immediately see your changes, try restarting your app within Xcode.

Feel free to browse the Movies sample files and customize various properties to
get familiar with the codebase and React Native.

Also check out the UI Component Explorer for more sample code:
`Examples/UIExplorer/UIExplorer.xcodeproj`.  **Make sure to close the Movies
project first - Xcode will break if you have two projects open that reference
the same library.**

## Troubleshooting

+ Xcode will break if you have two examples open at the same time.
+ If `npm start` fails with log spew like:
  ```
  2015-02-02 10:56 node[24294] (FSEvents.framework) FSEventStreamStart: register_with_server: ERROR: f2d_register_rpc() => (null) (-21)
  ```
then you've hit the node file watching bug - `brew install watchman` should fix the issue.
+ Jest testing does not yet work on node versions after 0.10.x.
+ You can verify the packager is working by loading the [bundle](http://localhost:8081/Examples/Movies/MoviesApp.includeRequire.runModule.bundle) in your browser and
inspecting the contents.

Please report any other issues you encounter so we can fix them ASAP.

## Basics

`<View>` is a container that behaves similar to a `<div>` element on web, but
renders to a `UIView`.  `<Text>`, `<Image>`, and `<ScrollView>` are other basic
components and there are several more.  You can compose these elements into
component trees just like normal react or HTML elements, and they can be styled
with the `style` property, which supports a subset of flexbox layout.  Check out
the UIExplorer examples for more [sample code](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ScrollViewExample.js).

Native events come in as you would expect via `onChange`, `onScroll`, `onTouch`
and other props. `TouchableHighlight` makes it really easy to build nice buttons
via `onPress`, which plays nicely with scroll views and other interactions via
the responder system.

# FAQ

##### Q. How does debugging work?  Can I set breakpoints in my JS?
A. We are going to add the ability to use the Chrome developer tools soon.  We
are very passionate about building the best possible developer experience.

##### Q. When is this coming to Android/Windows/OS X/etc?
A. We're working on Android, and we are excited to release it as soon as we can.
We are looking forward to the community helping us target other platforms as
well :)

##### Q. How do I create my own app?
A. Copy the entire `Examples/TicTacToe` folder, rename stuff in Xcode, and
replace the `TicTacToeApp.js` with your own. Then, in `AppDelegate.m`, update
`moduleName` to match your call to
`AppRegistry.registerComponent(<moduleName>, <componentName>)` at the bottom of your
JS file, and update `jsCodeLocation` to match your JS file name and location.

##### Q. Can I submit my own React Native app to the App Store?
A. Not yet, but you will be able to soon.  If you build something you want to
submit to the App Store, come talk to us ASAP.

##### Q. How do I deploy to my device?
A. You can change `localhost` in `AppDelegate.m` to your laptop's IP address and
grab the bundle over the same Wi-Fi network.  You can also download the bundle
that the React packager generates, save it to the file `main.jsbundle`, and add it
as a static resource in your Xcode project. Then set the `jsCodeLocation` in
`AppDelegate.m` to point to that file and deploy to your device like you would
any other app.

##### Q. What's up with this private repo?  Why aren't you just open sourcing it now?
A. We want input from the React community before we open the floodgates so we
can incorporate your feedback, and we also have a bunch more features we want to
add to make a more complete offering before we open source.

##### Q. Do you have to ship a JS runtime with your apps?
A. No, we just use the JavaScriptCore public API that is part of iOS 7 and
later.

##### Q. How do I add more native capabilities?
A. React Native is designed to be extensible - come talk to us, we would love to
work with you.

##### Q. Can I reuse existing iOS code?
A. Yes, React Native is designed to be extensible and allow integration of all
sorts of native components, such as `UINavigationController` (available as
`<NavigatorIOS>`), `MKMapView` (not available yet), or your own custom
component.  Check out `RCTUIActivityIndicatorViewManager.m` for a simple
example.

# In Depth

React renders these component trees as normal, but instead of applying the
result to the DOM, it sends a batch of create, update, and delete commands for
native views.  Everything in the React tree ultimately composes down to core
components that are mapped to their native counterpart.  The diff is first
applied to the shadow tree where layout is calculated in a background thread,
then the minimal changeset is applied to the native views on the main thread.

There are two key elements to making these apps feel great.  The first is the
100% asynchronous communication between the native engine and JS application
code.  This means that slow JS operations never block the main thread, so the
app can always be responsive to scrolling, image loading, and the like.  Second
is the powerful bridging API that let's us wrap any native components and APIs
we want, allowing us to use the native navigation system, tab bar, maps, blurs,
or any other existing native components standard on the platform, from another
open source project, or custom built.  These deep hooks also allow us to do very
high fidelity touch processing, capable of driving continuous gesture feedback
and animations at 60 fps.

Beyond performance, there are some exciting new concepts that make the
development experience a delight:

+ React JS - React is a unique and powerful way to structure apps that makes
them easier to reason about, and thus develop more quickly with fewer bugs.
React Native takes the same core React engine with JSX and ES6 and plugs
straight into the native view layer.  Some React components and most JS
libraries can easily be reused.
+ Instant reload - See the effect of your changes right away without compiling.
the React packager efficiently transforms, bundles, caches, and serves your
source code seamlessly.
+ `StyleSheet` - A simplifying evolution of CSS.  `padding`, `margin`,
`position: 'absolute'`, `left`, `right`...the list of support attributes goes on,
but no more selectors or complex precedence rules - `StyleSheet`s [are just JS](https://speakerdeck.com/vjeux/react-css-in-js),
and can be merged, shared, and manipulated just like any other JS object.
+ Flexbox layout - Views stack up based on the flex direction of their parent,
and can be configured to wrap tightly around their children, expand to fill
their parent container, or something more custom.  The layout algorithm runs
asynchronously as well, so scrolling and other animations can stay buttery
smooth, even while computing complex layout.
+ Responder events - Get that perfect touch interaction, even with extremely
complex, hierarchical trees of components.
+ Component Library - `TouchableHighlight`, `ListView`, `TextInput`, and more
provide a powerful library of pre-built, high quality components you can easily
drop into your apps.  Check out `Examples/UIExplorer/UIExplorer.xcodeproj` to
see example usage.

React Native is not in any way the first step to building a write-once, run-
anywhere solution.  One goal is simply to unify the developer experience, so
that a developer does not need to become a deep expert in every different
platform they want to deploy to - the future vision is for the development
tools, concepts, frameworks, programming language, and many of the APIs to be as
similar as possible across the web, iOS, Android, and maybe more, without
compromising app quality on any platform.

## Testing

Run example app tests with:

```
npm test
```

Note: Jest testing does not yet work on node versions after 0.10.x.

## Static Analysis

Lint the example apps with:

```
npm run lint
```

If you have [flow](http://flowtype.org) (version 0.1.6+) installed, you can do type analysis by running:

```
flow
```
