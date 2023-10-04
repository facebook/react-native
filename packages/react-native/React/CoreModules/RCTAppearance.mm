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

  return appearances[@(traitCollection.userInterfaceStyle)] ?: RCTAppearanceColorSchemeLight;
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

- (instancetype)init
{
  if ((self = [super init])) {
#if !TARGET_OS_OSX // [macOS]
    UITraitCollection *traitCollection = RCTSharedApplication().delegate.window.traitCollection;
    _currentColorScheme = RCTColorSchemePreference(traitCollection);
#else // [macOS
	NSAppearance *appearance = RCTSharedApplication().appearance;
	_currentColorScheme = RCTColorSchemePreference(appearance);
#endif // macOS]
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appearanceChanged:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
  }
  return self;
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

RCT_EXPORT_METHOD(setColorScheme : (NSString *)style)
{
#if !TARGET_OS_OSX // [macOS]
  UIUserInterfaceStyle userInterfaceStyle = [RCTConvert UIUserInterfaceStyle:style];
  NSArray<__kindof UIWindow *> *windows = RCTSharedApplication().windows;

  for (UIWindow *window in windows) {
    window.overrideUserInterfaceStyle = userInterfaceStyle;
  }
#else // [macOS
  NSAppearance *appearance = nil;
  if ([style isEqualToString:@"light"]) {
    appearance = [NSAppearance appearanceNamed:NSAppearanceNameAqua];
  } else if ([style isEqualToString:@"dark"]) {
    appearance = [NSAppearance appearanceNamed:NSAppearanceNameDarkAqua];
  }
  RCTSharedApplication().appearance = appearance;
#endif // macOS]
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getColorScheme)
{
  return _currentColorScheme;
}


- (void)appearanceChanged:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
#if !TARGET_OS_OSX // [macOS]
  UITraitCollection *traitCollection = nil;
  if (userInfo) {
    traitCollection = userInfo[RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey];
  }
  NSString *newColorScheme = RCTColorSchemePreference(traitCollection);
#else // [macOS
  NSAppearance *appearance = nil;
  if (userInfo) {
    appearance = userInfo[RCTUserInterfaceStyleDidChangeNotificationAppearanceKey];
  }
  NSString *newColorScheme = RCTColorSchemePreference(appearance);
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
}

- (void)stopObserving
{
}

- (void)invalidate
{
  [super invalidate];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end

Class RCTAppearanceCls(void)
{
  return RCTAppearance.class;
}
