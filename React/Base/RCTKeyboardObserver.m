/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTKeyboardObserver.h"

#import "RCTEventDispatcher.h"

static NSDictionary *RCTParseKeyboardNotification(NSNotification *notification);

@implementation RCTKeyboardObserver

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

#define ADD_KEYBOARD_HANDLER(NAME, SELECTOR) \
    [nc addObserver:self selector:@selector(SELECTOR:) name:NAME object:nil]

    ADD_KEYBOARD_HANDLER(UIKeyboardWillShowNotification, keyboardWillShow);
    ADD_KEYBOARD_HANDLER(UIKeyboardDidShowNotification, keyboardDidShow);
    ADD_KEYBOARD_HANDLER(UIKeyboardWillHideNotification, keyboardWillHide);
    ADD_KEYBOARD_HANDLER(UIKeyboardDidHideNotification, keyboardDidHide);
    ADD_KEYBOARD_HANDLER(UIKeyboardWillChangeFrameNotification, keyboardWillChangeFrame);
    ADD_KEYBOARD_HANDLER(UIKeyboardDidChangeFrameNotification, keyboardDidChangeFrame);

#undef ADD_KEYBOARD_HANDLER
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#define IMPLEMENT_KEYBOARD_HANDLER(EVENT) \
- (void)EVENT:(NSNotification *)notification \
{ \
  [_bridge.eventDispatcher \
    sendDeviceEventWithName:@#EVENT \
    body:RCTParseKeyboardNotification(notification)]; \
}

IMPLEMENT_KEYBOARD_HANDLER(keyboardWillShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillChangeFrame)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidChangeFrame)

@end

NS_INLINE NSDictionary *RCTRectDictionaryValue(CGRect rect)
{
  return @{
    @"screenX": @(rect.origin.x),
    @"screenY": @(rect.origin.y),
    @"width": @(rect.size.width),
    @"height": @(rect.size.height),
  };
}

static NSString *RCTAnimationNameForCurve(UIViewAnimationCurve curve)
{
  switch (curve) {
    case UIViewAnimationCurveEaseIn:
      return @"easeIn";
    case UIViewAnimationCurveEaseInOut:
      return @"easeInEaseOut";
    case UIViewAnimationCurveEaseOut:
      return @"easeOut";
    case UIViewAnimationCurveLinear:
      return @"linear";
    default:
      return @"keyboard";
  }
}

static NSDictionary *RCTParseKeyboardNotification(NSNotification *notification)
{
  NSDictionary *userInfo = notification.userInfo;
  CGRect beginFrame = [userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];

  return @{
    @"startCoordinates": RCTRectDictionaryValue(beginFrame),
    @"endCoordinates": RCTRectDictionaryValue(endFrame),
    @"duration": @(duration * 1000.0), // ms
    @"easing": RCTAnimationNameForCurve(curve),
  };
}
