/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAccessibilityManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUIManager.h"

NSString *const RCTAccessibilityManagerDidUpdateMultiplierNotification =
    @"RCTAccessibilityManagerDidUpdateMultiplierNotification";

@implementation RCTAccessibilityManager
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

static void *AccessibilityVoiceOverChangeContext = &AccessibilityVoiceOverChangeContext;

+ (BOOL)requiresMainQueueSetup 
{
  return NO;
}

- (instancetype)init 
{
  if (self = [super init]) {
    [[NSWorkspace sharedWorkspace] addObserver:self
                                    forKeyPath:@"voiceOverEnabled"
                                       options:(NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld)
                                       context:AccessibilityVoiceOverChangeContext];
    _isVoiceOverEnabled = [[NSWorkspace sharedWorkspace] isVoiceOverEnabled];
  }
  return self;
}

- (void)dealloc
{
  [[NSWorkspace sharedWorkspace] removeObserver:self
                                     forKeyPath:@"voiceOverEnabled"
                                        context:AccessibilityVoiceOverChangeContext];
}

RCT_EXPORT_METHOD(getCurrentVoiceOverState:(RCTResponseSenderBlock)callback
                  error:(__unused RCTResponseSenderBlock)error)
{
  BOOL isVoiceOverEnabled = [[NSWorkspace sharedWorkspace] isVoiceOverEnabled];
  callback(@[ @(isVoiceOverEnabled) ]);
}

RCT_EXPORT_METHOD(setAccessibilityFocus:(nonnull NSNumber *)reactTag)
{
   dispatch_async(dispatch_get_main_queue(), ^{
    NSView *view = [self.bridge.uiManager viewForReactTag:reactTag];
    [[view window] makeFirstResponder:view];
  });
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
  if (context == AccessibilityVoiceOverChangeContext) {
    BOOL newIsVoiceOverEnabled = [[NSWorkspace sharedWorkspace] isVoiceOverEnabled];
    if (_isVoiceOverEnabled != newIsVoiceOverEnabled) {
      _isVoiceOverEnabled = newIsVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [_bridge.eventDispatcher sendDeviceEventWithName:@"screenReaderChanged"
                                                  body:@(_isVoiceOverEnabled)];
#pragma clang diagnostic pop
    }
  } else {
    [super observeValueForKeyPath:keyPath
                         ofObject:object
                           change:change
                          context:context];
  }
}

@end
