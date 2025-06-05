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

static BOOL sUseKeyWindowForSystemStyle = NO;
void RCTUseKeyWindowForSystemStyle(BOOL useMainScreen)
{
  sUseKeyWindowForSystemStyle = useMainScreen;
}

NSString *RCTCurrentOverrideAppearancePreference()
{
  return sColorSchemeOverride;
}

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

  if (!traitCollection) {
    traitCollection = [UITraitCollection currentTraitCollection];
  }

  UIUserInterfaceStyle systemStyle = sUseKeyWindowForSystemStyle ? RCTKeyWindow().traitCollection.userInterfaceStyle
                                                                 : traitCollection.userInterfaceStyle;

  return appearances[@(systemStyle)] ?: RCTAppearanceColorSchemeLight;
}

@interface RCTAppearance () <NativeAppearanceSpec>
@end

@implementation RCTAppearance {
  NSString *_currentColorScheme;
  facebook::react::ModuleConstants<JS::NativeAppearance::Constants> _constants;
}

- (instancetype)init
{
  if ((self = [super init])) {
    UITraitCollection *traitCollection = RCTKeyWindow().traitCollection;
    _currentColorScheme = RCTColorSchemePreference(traitCollection);
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appearanceChanged:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)initialize
{
  _constants = facebook::react::typedConstants<JS::NativeAppearance::Constants>({
      .IS_EDGE_TO_EDGE_ENABLED = true
  });
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

- (nonnull facebook::react::ModuleConstants<JS::NativeAppearance::Constants>)getConstants
{
  return _constants;
}

- (nonnull facebook::react::ModuleConstants<JS::NativeAppearance::Constants>)constantsToExport
{
  return (facebook::react::ModuleConstants<JS::NativeAppearance::Constants>)[self getConstants];
}

RCT_EXPORT_METHOD(setColorScheme : (NSString *)style)
{
  UIUserInterfaceStyle userInterfaceStyle = [RCTConvert UIUserInterfaceStyle:style];
  NSMutableArray<UIWindow *> *windows = [NSMutableArray new];
  for (UIWindowScene *scene in RCTSharedApplication().connectedScenes) {
    [windows addObjectsFromArray:scene.windows];
  }

  for (UIWindow *window in windows) {
    window.overrideUserInterfaceStyle = userInterfaceStyle;
  }
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getColorScheme)
{
  return _currentColorScheme;
}

- (void)appearanceChanged:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
  UITraitCollection *traitCollection = nil;
  if (userInfo) {
    traitCollection = userInfo[RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey];
  }
  NSString *newColorScheme = RCTColorSchemePreference(traitCollection);
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
