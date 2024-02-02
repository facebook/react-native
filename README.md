<h1 align="center">
  <a href="https://reactnative.dev/">
    React Native visionOS
  </a>
</h1>

<p align="center">
  <strong>Learn once, write anywhere:</strong><br>
  Build spatial apps with React.
</p>

React Native visionOS allows you to write visionOS with full support for platform SDK. This is a full fork of the main repository with changes needed to support visionOS.

![Screenshot](https://github.com/callstack/react-native-visionos/assets/52801365/0fcd5e5f-628c-49ef-84ab-d1d4675a011a)

> [!CAUTION]
> This project is still at an early stage of development and is not ready for production use.

## New project creation

1. Make sure you have a [proper development environment setup](https://reactnative.dev/docs/environment-setup)
2. Download the latest Xcode (at least 15.2).
3. Install visionOS simulator runtime.
4. Install the latest version of CMake (at least v3.28.0).
5. Initialize the project using this command:

```
npx @callstack/react-native-visionos@latest init YourApp
```
6. Next, go to `YourApp/visionos` folder and run following commands to install Pods:

```
bundle install
bundle exec pod install
```

7. Now you can run `yarn visionos` 
8. (Optional) you also can open project using Xcode (`xed YourApp/visionos/YourApp.xcworkspace`).
  - Build the app by clicking the "Run" button in Xcode.

## Platform guidelines

We suggest you read [Human Interface Guidelines for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos) when creating visionOS apps.

It's important not to cover the translucent background with a solid color, as it helps to ground apps and make them feel like part of the environment.

## API Reference

### App entry point
React Native visionOS uses SwiftUI lifecycle. The app entry point is now `App.swift` file (by default it is `main.m`). This change allows us to use full capabilities of the visionOS SDK. 

Here is an example from the template: 
```swift
// App.swift
@main
struct HelloWorldApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  
  var body: some Scene {
    RCTMainWindow(moduleName: "HelloWorld")
  }
}
```

We are using `@UIApplicationDelegateAdaptor`, a property wrapper that allows us to use familiar `AppDelegate` in SwiftUI life cycle. 

`AppDelegate` extends `RCTAppDelegate` which does most of React Native initialization.

### Hover effect API
This is a prop on `<View />` component allowing to add hover effect. It's applied to all Touchable and Pressable components by default.

If you want to customize it you can use the `visionos_hoverEffect` prop, like so:

```tsx
<TouchableOpacity visionos_hoverEffect="lift">
  <Text>Click me</Text>
</TouchableOpacity>
```

The available options are: `lift` or `highlight`.

### `XR` API (_nightly_) 
Manage Immersive Experiences.

#### Methods
**`requestSession`**
```js
requestSession: (sessionId?: string) => Promise<void>
```
Opens a new [`ImmersiveSpace`](https://developer.apple.com/documentation/swiftui/immersive-spaces) given it's unique `Id`.

**`endSession`**
```js
endSession: () => Promise<void>
```
Closes currently open `ImmersiveSpace`.

#### Constants
**`supportsMultipleScenes`**
```js
supportsMultipleScenes: boolean
```
A Boolean value that indicates whether the app may display multiple scenes simultaneously. Returns the value of `UIApplicationSupportsMultipleScenes` key from `Info.plist`.

### Example Usage

1. Set `UIApplicationSupportsMultipleScenes` to `true` in `Info.plist`:
```diff
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>UIApplicationSceneManifest</key>
	<dict>
		<key>UIApplicationPreferredDefaultSceneSessionRole</key>
		<string>UIWindowSceneSessionRoleApplication</string>
		<key>UIApplicationSupportsMultipleScenes</key>
-   <false/>
+		<true/>
		<key>UISceneConfigurations</key>
		<dict/>
	</dict>
</dict>
</plist>

```


1. Inside `App.swift` add new `ImmersiveSpace`:
```diff
@main
struct HelloWorldApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
+ @State private var immersionLevel: ImmersionStyle = .mixed
  
  var body: some Scene {
    RCTMainWindow(moduleName: "HelloWorldApp")
+   ImmersiveSpace(id: "TestImmersiveSpace") {
+     // RealityKit content goes here
+   }
+    .immersionStyle(selection: $immersionLevel, in: .mixed, .progressive, .full)
  }
}
```
For more information about `ImmersiveSpace` API refer to [Apple documentation](https://developer.apple.com/documentation/swiftui/immersive-spaces).

In the above example we set `ImmersiveSpace` id to `TestImmersiveSpace`.

Now in our JS code, we can call: 

```js
import {XR} from "@callstack/react-native-visionos"
//...
const openXRSession = async () => {
  try {
    if (!XR.supportsMultipleScenes) {
      Alert.alert('Error', 'Multiple scenes are not supported');
      return;
    }
    await XR.requestSession('TestImmersiveSpace'); // Pass the same identifier from `App.swift`
  } catch (e) {
    Alert.alert('Error', e.message);
  }
};

const closeXRSession = async () => {
  await XR.endSession();
};
```
> [!CAUTION]
> Opening an `ImmersiveSpace` can fail in this secarios:
> - `ImmersiveSpace` is not declared.
> - `UIApplicationSupportsMultipleScenes` is set to `false`.
> - User cancels the request.

For a full example usage, refer to [`XRExample.js`](https://github.com/callstack/react-native-visionos/blob/main/packages/rn-tester/js/examples/XR/XRExample.js).

## Contributing

1. Follow the same steps as in the `New project creation` section.
2. Checkout `rn-tester` [README.md](./packages/rn-tester/README.md) to build React Native from source.

## Release process

We use a script called `oot-release.js` which automatically releases `visionos` packages and aligns versions of dependencies with React Native core.

Usage:

```sh
node ./scripts/oot-release.js --new-version "<visionos-version>" --react-native-version "<react-native-version>" --one-time-password "<otp>"
```

To test releases and template we use [Verdaccio](https://verdaccio.org/).
