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
2. Download the latest Xcode beta [here](https://developer.apple.com/xcode/).
3. Install visionOS Simulator runtime.
4. Initialize the project using this command:

```
npx @callstack/react-native-visionos@latest init YourApp
```
5. Next, go to `YourApp/visionos` folder and run following commands to install Pods:

```
cd visionos
bundle install
bundle exec pod install
```

6. If you want to use Hermes, you need to install CMake from source (v3.28.0)

```sh
brew install cmake --HEAD
```

If not, remember to disable it in `Podfile`.

8. Open `YourApp/visionos/YourApp.xcworkspace` using Xcode 15 Beta.
9. Build the app by clicking the "Run" button in Xcode.

## Platform guidelines

We suggest you read [Human Interface Guidelines for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos) when creating visionOS apps.

It's important not to cover the translucent background with a solid color, as it helps to ground apps and make them feel like part of the environment.

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