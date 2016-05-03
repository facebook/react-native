# babel-preset-react-native

Babel presets for React Native applications. React Native itself uses this Babel preset by default when transforming your app's source code.

If you wish to use a custom Babel configuration by writing a `.babelrc` file in your project's root directory, you must specify all the plugins necessary to transform your code. React Native does not apply its default Babel configuration in this case. So, to make your life easier, you can use this preset to get the default configuration and then specify more plugins that run before it.

## Usage

As mentioned above, you only need to use this preset if you are writing a custom `.babelrc` file.

### Installation

Install `babel-preset-react-native` in your app:
```sh
npm i babel-preset-react-native --save-dev
```

### Configuring Babel

Then, create a file called `.babelrc` in your project's root directory. The existence of this `.babelrc` file will tell React Native to use your custom Babel configuration instead of its own. Then load this preset:
```
{
  "presets": ["react-native"]
}
```

You can further customize your Babel configuration by specifying plugins and other options. See [Babel's `.babelrc` documentation](https://babeljs.io/docs/usage/babelrc/) to learn more.

## Help and Support

If you get stuck configuring Babel, please ask a question on Stack Overflow or find a consultant for help. If you discover a bug, please open up an issue.
