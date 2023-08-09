/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppearance.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConstants.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

NSString *const RCTAppearanceColorSchemeLight = @"light";
NSString *const RCTAppearanceColorSchemeDark = @"dark";

static BOOL sAppearancePreferenceEnabled = YES;
void RCTEnableAppearancePreference(BOOL enabled)
{
  sAppearancePreferenceEnabled = enabled;
}

static NSString *sColorSchemeOverride = nil;
void RCTOverrideAppearancePreference(NSString *const colorSchemeOverride)
{
  sColorSchemeOverride = colorSchemeOverride;
}

NSString *RCTCurrentOverrideAppearancePreference()
{
  return sColorSchemeOverride;
}

#if !TARGET_OS_OSX // [macOS]
NSString *RCTColorSchemePreference(UITraitCollection *traitCollection)
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    static NSDictionary *appearances;
    static dispatch_once_t onceToken;

    if (sColorSchemeOverride) {
      return sColorSchemeOverride;
    }

    dispatch_once(&onceToken, ^{
      appearances = @{
        @(UIUserInterfaceStyleLight) : RCTAppearanceColorSchemeLight,
        @(UIUserInterfaceStyleDark) : RCTAppearanceColorSchemeDark
      };
    });

    if (!sAppearancePreferenceEnabled) {
      // Return the default if the app doesn't allow different color schemes.
      return RCTAppearanceColorSchemeLight;
    }

    traitCollection = traitCollection ?: [UITraitCollection currentTraitCollection];
    return appearances[@(traitCollection.userInterfaceStyle)] ?: RCTAppearanceColorSchemeLight;
  }
#endif

  // Default to light on older OS version - same behavior as Android.
  return RCTAppearanceColorSchemeLight;
}
#else // [macOS
NSString *RCTColorSchemePreference(NSAppearance *appearance)
{
  static NSDictionary *appearances;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    appearances = @{
                    NSAppearanceNameAqua: RCTAppearanceColorSchemeLight,
                    NSAppearanceNameDarkAqua: RCTAppearanceColorSchemeDark
                    };
  });

  if (!sAppearancePreferenceEnabled) {
    // Return the default if the app doesn't allow different color schemes.
    return RCTAppearanceColorSchemeLight;
  }

  appearance = appearance ?: [NSApp effectiveAppearance];

  NSAppearanceName appearanceName = [appearance bestMatchFromAppearancesWithNames:@[NSAppearanceNameAqua, NSAppearanceNameDarkAqua]];
  return appearances[appearanceName] ?: RCTAppearanceColorSchemeLight;
}
#endif // macOS]

@interface RCTAppearance () <NativeAppearanceSpec>
@end

@implementation RCTAppearance {
  NSString *_currentColorScheme;
}

RCT_EXPORT_MODULE(Appearance)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeAppearanceSpecJSI>(params);
}

#if TARGET_OS_OSX // [macOS on macOS don't lazy init _currentColorScheme because [NSApp effectiveAppearance] cannot be executed on background thread.
- (instancetype)init
{
  if (self = [super init]) {
    _currentColorScheme =  RCTColorSchemePreference(nil);
  }
  return self;
}
#endif // macOS]

RCT_EXPORT_METHOD(setColorScheme : (NSString *)style)
{
#if !TARGET_OS_OSX // [macOS]
  UIUserInterfaceStyle userInterfaceStyle = [RCTConvert UIUserInterfaceStyle:style];
  NSArray<__kindof UIWindow *> *windows = RCTSharedApplication().windows;
  if (@available(iOS 13.0, *)) {
    for (UIWindow *window in windows) {
      window.overrideUserInterfaceStyle = userInterfaceStyle;
    }
  }
#else // [macOS
  NSAppearance *appearance = nil;
  if ([style isEqualToString:@"unspecified"]) {
    if (@available(macOS 11.0, *)) {
      appearance = [NSAppearance currentDrawingAppearance];
    } else {
      appearance = [NSAppearance currentAppearance];
    }
  } else if ([style isEqualToString:@"light"]) {
    appearance = [NSAppearance appearanceNamed:NSAppearanceNameAqua];
  } else if ([style isEqualToString:@"dark"]) {
    appearance = [NSAppearance appearanceNamed:NSAppearanceNameDarkAqua];
  }
  RCTSharedApplication().appearance = appearance;
#endif // macOS]
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getColorScheme)
{
#if !TARGET_OS_OSX // [macOS]
  if (_currentColorScheme == nil) {
    _currentColorScheme = RCTColorSchemePreference(nil);
  }
#endif // [macOS]
  return _currentColorScheme;
}

#if !TARGET_OS_OSX // [macOS]
- (void)appearanceChanged:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
  UITraitCollection *traitCollection = nil;
  if (userInfo) {
    traitCollection = userInfo[RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey];
  }
  NSString *newColorScheme = RCTColorSchemePreference(traitCollection);
#else // [macOS
- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if (object != NSApp || ![keyPath isEqualToString:@"effectiveAppearance"]) {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    return;
  }
  NSString *newColorScheme = RCTColorSchemePreference(nil);
#endif // macOS]
  if (![_currentColorScheme isEqualToString:newColorScheme]) {
    _currentColorScheme = newColorScheme;
    [self sendEventWithName:@"appearanceChanged" body:@{@"colorScheme" : newColorScheme}];
  }
}

#pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"appearanceChanged" ];
}

- (void)startObserving
{
#if !TARGET_OS_OSX // [macOS]
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appearanceChanged:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
  }
#else  // [macOS
  [NSApp addObserver:self
          forKeyPath:@"effectiveAppearance"
             options:NSKeyValueObservingOptionNew
             context:nil];
#endif // macOS]
}

- (void)stopObserving
{
#if !TARGET_OS_OSX // [macOS]
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
#else // [macOS
  [NSApp removeObserver:self forKeyPath:@"effectiveAppearance" context:nil];
#endif // macOS]
}

@end

Class RCTAppearanceCls(void)
{
  return RCTAppearance.class;
}
