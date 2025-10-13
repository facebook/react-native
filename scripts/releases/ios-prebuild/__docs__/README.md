# iOS Prebuild Scripts Documentation

This folder contains scripts for creating precompiled XCFrameworks for React Native's dependencies. These scripts automate the process of downloading, building, and packaging third-party libraries into distributable XCFramework bundles for iOS.

## Overview

The iOS prebuild system creates precompiled frameworks to reduce build times for React Native iOS apps. Instead of compiling dependencies from source during every build, these scripts package them as ready-to-use XCFrameworks.

The prebuild process creates a Swift package that builds frameworks for the following 3rd party libraries:

- boost
- folly
- glog
- fmt
- double-conversion
- socketrocket
- fast-float

## Main Scripts

### `cli.js`

Command-line interface for the prebuild system. Provides the following options:

```bash
# Setup: Download and prepare dependencies
node cli.js --setup

# Build: Compile dependencies for specified platforms
node cli.js --build --platforms ios,macos

# Compose: Create XCFrameworks from built artifacts
node cli.js --compose

# Create Swift Package: Generate Package.swift file
node cli.js --swiftpackage
```

**Options:**
- `--setup` / `-s`: Download and setup dependencies
- `--build` / `-b`: Build dependencies for target platforms
- `--compose` / `-c`: Compose XCFrameworks from built artifacts
- `--swiftpackage` / `-w`: Generate Package.swift file
- `--platforms` / `-p`: Target platforms (ios, macos, catalyst, tvos, visionos)
- `--configurations` / `-g`: Build configurations (Debug, Release)
- `--dependencies` / `-d`: Specific dependencies to process
- `--clean`: Clean build folder before building
- `--identity` / `-i`: Signing identity for frameworks

### `setupDependencies.js`

Handles downloading and preparing third-party dependencies defined in `configuration.js`.

**Functions:**
- Downloads dependencies from specified URLs
- Extracts archives (tar.gz, zip)
- Runs preparation scripts for each dependency
- Organizes source files in the build directory

### `build.js`

Compiles dependencies using Xcode for specified platforms and configurations.

**Key features:**
- Builds for multiple platforms: iOS, macOS, Catalyst, tvOS, visionOS
- Supports both Debug and Release configurations
- Creates universal binaries for device and simulator
- Handles architecture-specific builds (arm64, x86_64)

### `compose-framework.js`

Creates the final XCFramework from built artifacts.

**Functions:**

#### `createFramework(scheme, configuration, dependencies, rootFolder, buildFolder, identity)`
Composes XCFrameworks from platform-specific builds using `xcodebuild -create-xcframework`.

#### `copyHeaders(scheme, dependencies, rootFolder)`
Copies public headers from dependencies to the framework's Headers folder based on settings in `configuration.js`.

#### `copyBundles(scheme, dependencies, outputFolder, frameworkPaths)`
Copies resource bundles into the XCFramework's Resources folder.

#### `copySymbols(scheme, outputFolder, frameworkPaths)`
Copies debug symbols (dSYM files) to enable symbolication of crash reports.

#### `signXCFramework(identity, xcframeworkPath)`
Code signs the XCFramework with the specified identity.

### `configuration.js`

Defines all dependencies and their build settings.

**Configuration structure:**
```javascript
{
  name: 'boost',
  version: '1.84.0',
  url: new URL('https://...'),
  files: {
    sources: ['boost/**/*.hpp'],
    headers: ['boost/**/*.hpp'],
    resources: ['PrivacyInfo.xcprivacy']
  },
  settings: {
    publicHeaderFiles: './',
    headerSearchPaths: ['./'],
    cCompilerFlags: ['-Wno-documentation'],
    cxxCompilerFlags: ['-std=c++20']
  }
}
```

### `swift-package.js`

Generates a Package.swift file for Swift Package Manager distribution.

**Functions:**
- `createSwiftPackageFile(dependencies, version, outputPath)`: Creates Package.swift with binary target definitions

### `folders.js`

Utility functions for folder operations.

**Functions:**
- `cleanFolder(folderPath)`: Removes and recreates a directory
- `ensureFolder(folderPath)`: Creates directory if it doesn't exist

### `constants.js`

Defines shared constants used across scripts:
- `HEADERS_FOLDER`: Location for extracted headers
- `TARGET_FOLDER`: Build output location
- `CPP_STANDARD`: C++ standard version to use

### `types.js`

Flow type definitions for TypeScript-style type checking:
- `Platform`: Supported platform types
- `Configuration`: Build configuration types
- `Dependency`: Dependency configuration structure

## Workflow

The typical workflow for creating prebuilt frameworks:

1. **Setup Phase** (`setupDependencies.js`)
   - Downloads third-party dependencies
   - Extracts archives
   - Runs preparation scripts
   - Organizes files in build directory

2. **Build Phase** (`build.js`)
   - Compiles each dependency for target platforms
   - Creates fat binaries for device + simulator
   - Generates build artifacts in platform-specific folders

3. **Compose Phase** (`compose-framework.js`)
   - Combines platform builds into XCFramework
   - Copies headers and resources
   - Includes debug symbols (dSYM)
   - Code signs if identity provided

4. **Package Phase** (`swift-package.js`)
   - Generates Package.swift for SPM distribution
   - Defines binary targets with checksums

## Integration

The prebuilt frameworks are consumed via CocoaPods or Swift Package Manager.

Related files:
- `packages/react-native/scripts/cocoapods/rndependencies.rb` - CocoaPods integration
- `packages/react-native/React-Core-prebuilt.podspec` - Prebuilt React Core podspec

## Entry Point

The main entry point is `prepare-ios-prebuilds.js` which orchestrates the entire prebuild process:

```javascript
const {buildDepenencies} = require('./ios-prebuild/build');
const {createFramework} = require('./ios-prebuild/compose-framework');
const {setupDependencies} = require('./ios-prebuild/setupDependencies');
```

## Environment Variables

- `RCT_USE_RN_DEP`: Use prebuilt dependencies instead of building from source
- `RCT_USE_LOCAL_RN_DEP`: Use local tarball for testing
- `RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS`: Download and install dSYMs for symbolication

See `packages/react-native/scripts/cocoapods/rncore.rb` for implementation details.

## Usage

To use the prebuilt React Native XCFrameworks in your iOS project, run pod install with the environment variable `RCT_USE_PREBUILT_RNCORE` set to `1`:

```bash
RCT_USE_PREBUILT_RNCORE=1 bundle exec pod install
```

This can be combined with `RCT_USE_RN_DEP=1` to use both React Native and its dependencies as prebuilt frameworks.

For debugging and troubleshooting the Cocoapods scripts, you can use the following environment variables:

- `RCT_TESTONLY_RNCORE_TARBALL_PATH`: **TEST ONLY** If set, it will use a local tarball of RNCore if it exists.
- `RCT_TESTONLY_RNCORE_VERSION`: **TEST ONLY** If set, it will override the version of RNCore to be used.
- `RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS`: If set to 1, it will download the dSYMs for the prebuilt RNCore frameworks and install these in the framework folders
