# React Native Gradle Plugin

This plugin is used by React Native Apps to configure themselves.

NOTE: It's important that this folder is called `react-native-gradle-plugin` as it's used
by users in their `build.gradle` file as follows:

```gradle
buildscript {
    // ...
    dependencies {
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}
```

The name of the artifact is imposed by the folder name.
