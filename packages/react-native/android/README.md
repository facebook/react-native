# The `/android` folder inside `react-native`

Starting from React Native 0.71, we're not shipping the `/android` folder inside the React Native NPM package
anymore due to sizing constraints on NPM. The Android artifacts are distributed via Maven Central.
You can read more about it in this RFC:
https://github.com/react-native-community/discussions-and-proposals/pull/508

If you're a library author and you're manipulating the React Native .aar files, to extract headers,
extract `.so` files or do anything with it, you're probably doing something wrong. React Native
0.71 ships with all the necessary logic to let you consume it transparently by just using:

```
implementation("com.facebook.react:react-android")
// or to keep backward compatibility with older versions of React Native:
implementation("com.facebook.react:react-native:+")
```

You should consider refactoring your library code not to unzip/manipulate the React Native .aar files.

This README.md file is kept in this folder as some libraries are checking the existence of the `/android` folder
and failing user builds if the folder is missing.
