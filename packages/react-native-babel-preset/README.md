# @react-native/babel-preset

Babel presets for [React Native](https://reactnative.dev) applications. React Native itself uses this Babel preset by default when transforming your app's source code.

If you wish to use a custom Babel configuration by writing a `babel.config.js` file in your project's root directory, you must specify all the plugins necessary to transform your code. React Native does not apply its default Babel configuration in this case. So, to make your life easier, you can use this preset to get the default configuration and then specify more plugins that run before it.

## Usage

As mentioned above, you only need to use this preset if you are writing a custom `babel.config.js` file.

### Installation

Install `@react-native/babel-preset` in your app:

with `npm`:

```sh
npm i @react-native/babel-preset --save-dev
```

or with `yarn`:

```sh
yarn add -D @react-native/babel-preset
```

### Configuring Babel

Then, create a file called `babel.config.js` in your project's root directory. The existence of this `babel.config.js` file will tell React Native to use your custom Babel configuration instead of its own. Then load this preset:

```
{
  "presets": ["module:@react-native/babel-preset"]
}
```

You can further customize your Babel configuration by specifying plugins and other options. See [Babel's `babel.config.js` documentation](https://babeljs.io/docs/en/config-files/) to learn more.

## Help and Support

If you get stuck configuring Babel, please ask a question on Stack Overflow or find a consultant for help. If you discover a bug, please open up an issue.
