/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAccessibilityManager.h"

#import "RCTUIManager.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"

NSString *const RCTAccessibilityManagerDidUpdateMultiplierNotification = @"RCTAccessibilityManagerDidUpdateMultiplierNotification";

static NSString *UIKitCategoryFromJSCategory(NSString *JSCategory)
{
  static NSDictionary *map = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    map = @{@"extraSmall": UIContentSizeCategoryExtraSmall,
            @"small": UIContentSizeCategorySmall,
            @"medium": UIContentSizeCategoryMedium,
            @"large": UIContentSizeCategoryLarge,
            @"extraLarge": UIContentSizeCategoryExtraLarge,
            @"extraExtraLarge": UIContentSizeCategoryExtraExtraLarge,
            @"extraExtraExtraLarge": UIContentSizeCategoryExtraExtraExtraLarge,
            @"accessibilityMedium": UIContentSizeCategoryAccessibilityMedium,
            @"accessibilityLarge": UIContentSizeCategoryAccessibilityLarge,
            @"accessibilityExtraLarge": UIContentSizeCategoryAccessibilityExtraLarge,
            @"accessibilityExtraExtraLarge": UIContentSizeCategoryAccessibilityExtraExtraLarge,
            @"accessibilityExtraExtraExtraLarge": UIContentSizeCategoryAccessibilityExtraExtraExtraLarge};
  });
  return map[JSCategory];
}

@interface RCTAccessibilityManager ()

@property (nonatomic, copy) NSString *contentSizeCategory;
@property (nonatomic, assign) CGFloat multiplier;

@end

@implementation RCTAccessibilityManager

@synthesize bridge = _bridge;
@synthesize multipliers = _multipliers;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if (self = [super init]) {
    _multiplier = 1.0;

    // TODO: can this be moved out of the startup path?
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewContentSizeCategory:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewVoiceOverStatus:)
                                                 name:UIAccessibilityVoiceOverStatusChanged
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(accessibilityAnnouncementDidFinish:)
                                                 name:UIAccessibilityAnnouncementDidFinishNotification
                                               object:nil];

    self.contentSizeCategory = RCTSharedApplication().preferredContentSizeCategory;
    _isVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)didReceiveNewContentSizeCategory:(NSNotification *)note
{
  self.contentSizeCategory = note.userInfo[UIContentSizeCategoryNewValueKey];
}

- (void)didReceiveNewVoiceOverStatus:(__unused NSNotification *)notification
{
  BOOL newIsVoiceOverEnabled = UIAccessibilityIsVoiceOverRunning();
  if (_isVoiceOverEnabled != newIsVoiceOverEnabled) {
    _isVoiceOverEnabled = newIsVoiceOverEnabled;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"voiceOverDidChange"
                                                body:@(_isVoiceOverEnabled)];
#pragma clang diagnostic pop
  }
}

- (void)accessibilityAnnouncementDidFinish:(__unused NSNotification *)notification
{
  NSDictionary *userInfo = notification.userInfo;
  // Response dictionary to populate the event with.
  NSDictionary *response = @{@"announcement": userInfo[UIAccessibilityAnnouncementKeyStringValue],
                              @"success": userInfo[UIAccessibilityAnnouncementKeyWasSuccessful]};

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"announcementDidFinish"
                                              body:response];
#pragma clang diagnostic pop
}

- (void)setContentSizeCategory:(NSString *)contentSizeCategory
{
  if (_contentSizeCategory != contentSizeCategory) {
    _contentSizeCategory = [contentSizeCategory copy];
    [self invalidateMultiplier];
  }
}

- (void)invalidateMultiplier
{
  self.multiplier = [self multiplierForContentSizeCategory:_contentSizeCategory];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTAccessibilityManagerDidUpdateMultiplierNotification object:self];
}

- (CGFloat)multiplierForContentSizeCategory:(NSString *)category
{
  NSNumber *m = self.multipliers[category];
  if (m.doubleValue <= 0.0) {
    RCTLogError(@"Can't determinte multiplier for category %@. Using 1.0.", category);
    m = @1.0;
  }
  return m.doubleValue;
}

- (void)setMultipliers:(NSDictionary<NSString *, NSNumber *> *)multipliers
{
  if (_multipliers != multipliers) {
    _multipliers = [multipliers copy];
    [self invalidateMultiplier];
  }
}

- (NSDictionary<NSString *, NSNumber *> *)multipliers
{
  if (_multipliers == nil) {
    _multipliers = @{UIContentSizeCategoryExtraSmall: @0.823,
                     UIContentSizeCategorySmall: @0.882,
                     UIContentSizeCategoryMedium: @0.941,
                     UIContentSizeCategoryLarge: @1.0,
                     UIContentSizeCategoryExtraLarge: @1.118,
                     UIContentSizeCategoryExtraExtraLarge: @1.235,
                     UIContentSizeCategoryExtraExtraExtraLarge: @1.353,
                     UIContentSizeCategoryAccessibilityMedium: @1.786,
                     UIContentSizeCategoryAccessibilityLarge: @2.143,
                     UIContentSizeCategoryAccessibilityExtraLarge: @2.643,
                     UIContentSizeCategoryAccessibilityExtraExtraLarge: @3.143,
                     UIContentSizeCategoryAccessibilityExtraExtraExtraLarge: @3.571};
  }
  return _multipliers;
}

RCT_EXPORT_METHOD(setAccessibilityContentSizeMultipliers:(NSDictionary *)JSMultipliers)
{
  NSMutableDictionary<NSString *, NSNumber *> *multipliers = [NSMutableDictionary new];
  for (NSString *__nonnull JSCategory in JSMultipliers) {
    NSNumber *m = [RCTConvert NSNumber:JSMultipliers[JSCategory]];
    NSString *UIKitCategory = UIKitCategoryFromJSCategory(JSCategory);
    multipliers[UIKitCategory] = m;
  }
  self.multipliers = multipliers;
}

RCT_EXPORT_METHOD(setAccessibilityFocus:(nonnull NSNumber *)reactTag)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactTag:reactTag];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, view);
  });
}

RCT_EXPORT_METHOD(announceForAccessibility:(NSString *)announcement)
{
  UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, announcement);
}

RCT_EXPORT_METHOD(getMultiplier:(RCTResponseSenderBlock)callback)
{
  if (callback) {
    callback(@[ @(self.multiplier) ]);
  }
}

RCT_EXPORT_METHOD(getCurrentVoiceOverState:(RCTResponseSenderBlock)callback
                  error:(__unused RCTResponseSenderBlock)error)
{
  callback(@[@(_isVoiceOverEnabled)]);
}

@end

@implementation RCTBridge (RCTAccessibilityManager)

- (RCTAccessibilityManager *)accessibilityManager
{
  return [self moduleForClass:[RCTAccessibilityManager class]];
}

@end
