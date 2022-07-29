# React & React Native Versions

This page describes how React and React Native versions interact each other.
The version alignment between the two frameworks relies on two syncronization points:

1. The versions in the `package.json` of the new app template. For example [for React Native 0.68.1](https://github.com/facebook/react-native/blob/0.68-stable/template/package.json#L12-L15) the versions are aligned as follows:

```
  "dependencies": {
    "react": "17.0.2",
    "react-native": "0.68.1"
  },
```

1. The React renderers **shipped** with React Native inside this folder, the [./Libraries/Renderer](https://github.com/facebook/react-native/tree/main/Libraries/Renderer) folder, of React Native.

This practically means that you **can't bump** the version of React in your `package.json` to a later version,
as you will still be using the older renderer from the folder mentioned above. Bumping the react version in your `package.json` will lead to unexpected behaviors.

For the sake of React 18, the first version of React Native compatible with React 18 is **0.69.0**. Users on React Native 0.68.0 and previous versions won't be able to use React 18.

If you use the `react-native upgrade` command or the React Native Upgrade Helper, you'll bump to the correct React version once you upgrade React Native.
