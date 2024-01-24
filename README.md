<h1 align="center">
  <a href="https://reactnative.dev/">
    React Native Vision OS
  </a>
</h1>

<p align="center">
  <strong>Learn once, write anywhere:</strong><br>
  Build spatial apps with React.
</p>

React Native Vision OS allows you to write visionOS with full support for platform SDK. This is a full fork of the main repository with changes needed to support visionOS.

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
React native visionOS uses SwiftUI lifecycle. The app entry point is now `App.swift` file (by default it is `main.m`). This change allows us to use full capabilities of the visionOS SDK. 

Here is a example from the template: 
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

```jsx
<TouchableOpacity visionos_hoverEffect="lift">
  <Text>Click me</Text>
</TouchableOpacity>
```

The available options are: `lift` or `highlight`.

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
