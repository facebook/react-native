# Tasks: Remove RCT_EXPORT_MODULE from React Native Modules

This document tracks the migration from `RCT_EXPORT_MODULE()` macro to manually implementing the `+(NSString *)moduleName` method in all React Native modules. The goal is to remove the dependency on the `+load()` method when `RCT_DISABLE_STATIC_MODULE_REGISTRATION` is set to false.

## Background

The `RCT_EXPORT_MODULE()` macro in `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/Base/RCTBridgeModule.h` automatically generates:
1. A `+(NSString *)moduleName` method
2. A `+load()` method (when `RCT_DISABLE_STATIC_MODULE_REGISTRATION` is false)

We need to replace the macro usage by manually implementing the `+(NSString *)moduleName` method. The `+load()` method is no longer needed.

## Tasks

- [x] Remove RCT_EXPORT_MODULE from RCTActionSheetManager
- [ ] Remove RCT_EXPORT_MODULE from RCTAlertManager
- [ ] Remove RCT_EXPORT_MODULE from RCTDeviceInfo
- [ ] Remove RCT_EXPORT_MODULE from RCTDevMenu
- [ ] Remove RCT_EXPORT_MODULE from RCTUIManager
- [ ] Remove RCT_EXPORT_MODULE from RCTDevSettings
- [ ] Remove RCT_EXPORT_MODULE from RCTPlatform
- [ ] Remove RCT_EXPORT_MODULE from RCTViewManager
- [ ] Remove RCT_EXPORT_MODULE from RCTNetworking
- [ ] Remove RCT_EXPORT_MODULE from RCTPerfMonitor
- [ ] Remove RCT_EXPORT_MODULE from RCTImageLoader
- [ ] Remove RCT_EXPORT_MODULE from RCTDevLoadingView
- [ ] Remove RCT_EXPORT_MODULE from RCTNativeAnimatedTurboModule
- [ ] Remove RCT_EXPORT_MODULE from RCTAppState
- [ ] Remove RCT_EXPORT_MODULE from RCTImageStoreManager
- [ ] Remove RCT_EXPORT_MODULE from RCTRedBox
- [ ] Remove RCT_EXPORT_MODULE from RCTLogBox
- [ ] Remove RCT_EXPORT_MODULE from RCTAppearance
- [ ] Remove RCT_EXPORT_MODULE from RCTLinkingManager
- [ ] Remove RCT_EXPORT_MODULE from RCTExceptionsManager
- [ ] Remove RCT_EXPORT_MODULE from RCTLocalAssetImageLoader
- [ ] Remove RCT_EXPORT_MODULE from RCTBundleAssetImageLoader
- [ ] Remove RCT_EXPORT_MODULE from RCTNativeAnimatedModule
- [ ] Remove RCT_EXPORT_MODULE from RCTAccessibilityManager
- [ ] Remove RCT_EXPORT_MODULE from RCTPushNotificationManager
- [ ] Remove RCT_EXPORT_MODULE from RCTStatusBarManager
- [ ] Remove RCT_EXPORT_MODULE from RCTEventDispatcher
- [ ] Remove RCT_EXPORT_MODULE from RCTSettingsManager
- [ ] Remove RCT_EXPORT_MODULE from RCTTiming
- [ ] Remove RCT_EXPORT_MODULE from RCTImageViewManager
- [ ] Remove RCT_EXPORT_MODULE from RCTKeyboardObserver
- [ ] Remove RCT_EXPORT_MODULE from RCTFileRequestHandler
- [ ] Remove RCT_EXPORT_MODULE from RCTHTTPRequestHandler
- [ ] Remove RCT_EXPORT_MODULE from RCTGIFImageDecoder
- [ ] Remove RCT_EXPORT_MODULE from RCTDataRequestHandler
- [ ] Remove RCT_EXPORT_MODULE from RCTFileReaderModule
- [ ] Remove RCT_EXPORT_MODULE from RCTSampleTurboModule
- [ ] Remove RCT_EXPORT_MODULE from RCTBlobManager

## Module Files Reference

| Module Name | File Path |
|------------|-----------|
| RCTActionSheetManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTActionSheetManager.mm` |
| RCTAlertManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTAlertManager.mm` |
| RCTDeviceInfo | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTDeviceInfo.mm` |
| RCTDevMenu | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTDevMenu.mm` |
| RCTUIManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/Modules/RCTUIManager.mm` |
| RCTDevSettings | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTDevSettings.mm` |
| RCTPlatform | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTPlatform.mm` |
| RCTViewManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/Views/RCTViewManager.m` |
| RCTNetworking | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Network/RCTNetworking.mm` |
| RCTPerfMonitor | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTPerfMonitor.mm` |
| RCTImageLoader | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTImageLoader.mm` |
| RCTDevLoadingView | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTDevLoadingView.mm` |
| RCTNativeAnimatedTurboModule | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/NativeAnimation/RCTNativeAnimatedTurboModule.mm` |
| RCTAppState | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTAppState.mm` |
| RCTImageStoreManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTImageStoreManager.mm` |
| RCTRedBox | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTRedBox.mm` |
| RCTLogBox | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTLogBox.mm` |
| RCTAppearance | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTAppearance.mm` |
| RCTLinkingManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm` |
| RCTExceptionsManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTExceptionsManager.mm` |
| RCTLocalAssetImageLoader | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTLocalAssetImageLoader.mm` |
| RCTBundleAssetImageLoader | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTBundleAssetImageLoader.mm` |
| RCTNativeAnimatedModule | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/NativeAnimation/RCTNativeAnimatedModule.mm` |
| RCTAccessibilityManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTAccessibilityManager.mm` |
| RCTPushNotificationManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/PushNotificationIOS/RCTPushNotificationManager.mm` |
| RCTStatusBarManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTStatusBarManager.mm` |
| RCTEventDispatcher | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTEventDispatcher.mm` |
| RCTSettingsManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Settings/RCTSettingsManager.mm` |
| RCTTiming | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTTiming.mm` |
| RCTImageViewManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTImageViewManager.mm` |
| RCTKeyboardObserver | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/React/CoreModules/RCTKeyboardObserver.mm` |
| RCTFileRequestHandler | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Network/RCTFileRequestHandler.mm` |
| RCTHTTPRequestHandler | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Network/RCTHTTPRequestHandler.mm` |
| RCTGIFImageDecoder | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Image/RCTGIFImageDecoder.mm` |
| RCTDataRequestHandler | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Network/RCTDataRequestHandler.mm` |
| RCTFileReaderModule | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Blob/RCTFileReaderModule.mm` |
| RCTSampleTurboModule | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm` |
| RCTBlobManager | `/Users/cipolleschi/fbsource/xplat/js/react-native-github/packages/react-native/Libraries/Blob/RCTBlobManager.mm` |

## Migration Pattern

For each module, replace:

```objc
RCT_EXPORT_MODULE()
```

With:

```objc
+ (NSString *)moduleName
{
  return @"ClassName"; // Use the full class name (e.g., "RCTActionSheetManager")
}
```

**Note:** Some modules use custom names with `RCT_EXPORT_MODULE(CustomName)`. Make sure to preserve the custom name when implementing `+(NSString *)moduleName`.

Examples:
- `RCT_EXPORT_MODULE(PlatformConstants)` → `+ (NSString *)moduleName { return @"PlatformConstants"; }`
- `RCT_EXPORT_MODULE(Appearance)` → `+ (NSString *)moduleName { return @"Appearance"; }`
- `RCT_EXPORT_MODULE(BlobModule)` → `+ (NSString *)moduleName { return @"BlobModule"; }`
- `RCT_EXPORT_MODULE(FileReaderModule)` → `+ (NSString *)moduleName { return @"FileReaderModule"; }`
- `RCT_EXPORT_MODULE()` → `+ (NSString *)moduleName { return @"RCTActionSheetManager"; }` (uses full class name)

## Total Modules: 38
