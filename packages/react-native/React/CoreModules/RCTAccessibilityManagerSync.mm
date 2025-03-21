/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAccessibilityManagerSync.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTEventDispatcherProtocol.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTAccessibilityManagerSync () <NativeAccessibilityManagerSyncSpec>
@end

@implementation RCTAccessibilityManagerSync

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(voiceVoiceOverStatusDidChange:)
                                                 name:UIAccessibilityVoiceOverStatusDidChangeNotification
                                               object:nil];

    _isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
    ;
  }
  return self;
}

- (void)voiceVoiceOverStatusDidChange:(__unused NSNotification *)notification
{
  NSNumber *isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning() ? @1 : @0;
  [self _setIsVoiceOverEnabled:isVoiceOverEnabled];
}

- (void)_setIsVoiceOverEnabled:(BOOL)isVoiceOverEnabled
{
  if (_isVoiceOverEnabled != isVoiceOverEnabled) {
    _isVoiceOverEnabled = isVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"screenReaderChanged"
                                                                          body:@(_isVoiceOverEnabled)];
#pragma clang diagnostic pop
  }
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getCurrentVoiceOverState)
{
  return _isVoiceOverEnabled ? @1 : @0;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAccessibilityManagerSyncSpecJSI>(params);
}

@end

Class RCTAccessibilityManagerSyncCls(void)
{
  return RCTAccessibilityManagerSync.class;
}
