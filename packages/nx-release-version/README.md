# os/nx-release-version

Nx (v21) Version Actions for React Native macOS releases.

## Overview

This package provides custom Version Actions for Nx 21's modern release system (`useLegacyVersioning: false`). It extends the built-in `JsVersionActions` to include React Native platform-specific artifact updates.

## What it does

When versioning the `react-native-macos` project, this package automatically:

1. **Updates standard package.json files** (via the base `JsVersionActions`)
2. **Updates React Native platform artifacts**:
   - `ReactAndroid/gradle.properties`
   - `ReactNativeVersion.java`
   - `RCTVersion.m`
   - `ReactNativeVersion.h`
   - `ReactNativeVersion.js`
3. **Creates a `.rnm-publish` marker file** to indicate successful versioning

