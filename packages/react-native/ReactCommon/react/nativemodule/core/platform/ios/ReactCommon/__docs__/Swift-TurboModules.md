# Swift TurboModules Support in React Native

This document explains the approach implemented in [D92527173](https://www.internalfb.com/diff/D92527173) to enable writing TurboModules directly in pure Swift, without requiring Objective-C++ wrappers.

## Overview

Traditionally, React Native TurboModules on iOS require Objective-C++ implementation files (`.mm`) to bridge between JavaScript and native code. This change introduces infrastructure to write TurboModules entirely in Swift, simplifying the developer experience for iOS developers who prefer Swift.

## Architecture

### Protocol Hierarchy

The implementation introduces a new protocol hierarchy:

```
RCTModule (base protocol)
    ├── RCTSwiftTurboModule (for pure Swift modules)
    └── RCTTurboModule (existing Obj-C++ modules, also conforms to RCTModuleProvider)
```

#### New Protocols

1. **`RCTModule`**: A minimal base protocol that serves as the root marker for all React Native module types. Both Swift and Objective-C++ TurboModules conform to this protocol.

2. **`RCTSwiftTurboModule`**: A protocol specifically designed for Swift TurboModules. It inherits from `RCTModule` and is used by the codegen to generate Swift-compatible headers.

### Module Provider Pattern

A new optional method has been added to `RCTModuleProvider`:

```objc
@optional
- (Class<RCTModule>)getAppleModule;
```

This method allows a module provider (typically Objective-C++) to return a reference to a Swift module class. The TurboModuleManager uses this to:

1. Identify when a Swift module is being requested
2. Properly instantiate the Swift class
3. Wire it up to the TurboModule infrastructure

### Codegen Changes

The React Native Codegen now generates an additional header file for Swift compatibility:

- **`{LibraryName}-Swift.h`**: Contains Swift-compatible protocol declarations that inherit from both `RCTBridgeModule` and `RCTSwiftTurboModule`

Example generated protocol:

```objc
@protocol NativeCalculatorSpec <RCTBridgeModule, RCTSwiftTurboModule>

- (NSNumber *)add:(double)a b:(double)b;
- (NSNumber *)subtract:(double)a b:(double)b;

@end
```

## How to Use

### Step 1: Define Your Module Spec

Create a TypeScript specification file for your module:

```typescript
// NativeCalculator.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeCalculator');
```

### Step 2: Run Codegen

Run the React Native codegen to generate the Swift-compatible headers:

```bash
# This happens automatically during pod install or can be run manually
./scripts/generate-codegen-artifacts.js
```

This generates:
- `NativeCalculatorSpec.h` (standard Obj-C++ header)
- `NativeCalculator-Swift.h` (Swift-compatible header)

### Step 3: Implement in Swift

Create your Swift implementation:

```swift
// NativeCalculator.swift
import Foundation
import React
import ReactCommon

@objc(NativeCalculator)
class NativeCalculator: NSObject, NativeCalculatorSpec {

    @objc static func moduleName() -> String! {
        return "NativeCalculator"
    }

    @objc func add(_ a: Double, b: Double) -> NSNumber {
        return NSNumber(value: a + b)
    }

    @objc func subtract(_ a: Double, b: Double) -> NSNumber {
        return NSNumber(value: a - b)
    }
}
```

### Step 4: Create the Module Provider

Create an Objective-C++ file that bridges the Swift module to the TurboModule system:

```objc
// NativeCalculatorProvider.mm
#import <ReactCommon/RCTTurboModule.h>
#import "YourApp-Swift.h"  // Swift bridging header

@interface NativeCalculatorProvider : NSObject <RCTModuleProvider>
@end

@implementation NativeCalculatorProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    // Return the TurboModule wrapping the Swift class
    return std::make_shared<facebook::react::ObjCTurboModule>(params);
}

- (Class<RCTModule>)getAppleModule {
    return [NativeCalculator class];
}

@end
```

### Step 5: Register the Module

Register your module by configuring the `modulesProvider` mapping in your `package.json`. This tells React Native which provider class to use for each Swift TurboModule.

Add the `modulesProvider` field under the `ios` section of your `codegenConfig`:

```json
{
  "name": "your-app",
  "version": "1.0.0",
  "codegenConfig": {
    "name": "AppSpecs",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.yourapp.specs"
    },
    "ios": {
      "modulesProvider": {
        "NativeCalculator": "NativeCalculatorProvider"
      }
    }
  }
}
```

The `modulesProvider` is a dictionary that maps:
- **Key**: The module name (as defined in your TypeScript spec and returned by `moduleName()` in Swift)
- **Value**: The name of the Objective-C++ provider class that implements `getAppleModule`

When you run `pod install`, the codegen will use this mapping to generate the `RCTAppDependencyProvider` which automatically wires up your Swift modules to the TurboModule infrastructure.

You can register multiple Swift modules by adding additional entries:

```json
"ios": {
  "modulesProvider": {
    "NativeCalculator": "NativeCalculatorProvider",
    "NativeStorage": "NativeStorageProvider",
    "NativeAuth": "NativeAuthProvider"
  }
}
```

## Key Implementation Details

### TurboModuleManager Changes

The `RCTTurboModuleManager` has been updated to:

1. **Detect Swift modules**: When `getAppleModule` is implemented, the manager knows to treat the module as a Swift-based implementation.

2. **Separate provider and module**: The manager now distinguishes between:
   - `moduleProvider`: The Obj-C++ wrapper that provides the TurboModule
   - `module`: The actual Swift class instance

3. **Proper initialization**: Swift modules are instantiated through the `getAppleModule` class reference, ensuring proper Swift runtime initialization.

### Protocol Conformance Check

The macro `RCT_IS_TURBO_MODULE_CLASS` now checks for `RCTModule` conformance (instead of `RCTTurboModule`), enabling both Swift and Obj-C++ modules to be recognized:

```objc
#define RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTModule)]))
```

### Pod Configuration

The podspec template has been updated to include Swift-generated files:

```ruby
s.source_files = ["**/RCTAppDependencyProvider.{h,mm}", "**/*-Swift.{h,mm}"]
```

## Benefits

1. **Pure Swift Development**: Write TurboModules entirely in Swift without managing Objective-C++ complexity.

2. **Type Safety**: Leverage Swift's type system while still benefiting from codegen-generated protocols.

3. **Familiar Patterns**: Use standard Swift classes and methods with `@objc` annotations for bridging.

4. **Incremental Adoption**: Existing Objective-C++ TurboModules continue to work unchanged.

## Limitations (Current State)

This is a basic implementation with the following current limitations:

- Requires an Objective-C++ provider file to bridge the Swift module
- Event emitter support may need additional configuration
- Complex types (arrays, dictionaries with nested objects) may require additional bridging

## Future Improvements

Future iterations may include:

- Automatic provider generation from codegen
- Direct Swift-to-JSI bridging without Objective-C++ intermediary
- Enhanced type mapping for complex Swift types
- Swift macro support for reducing boilerplate

## References

- [Pull Request #52710](https://github.com/facebook/react-native/pull/52710)
- [React Native TurboModules Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
