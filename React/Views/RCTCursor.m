/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTCursor.h>

@implementation RCTConvert (RCTCursor)

RCT_ENUM_CONVERTER(
    RCTCursor,
    (@{
      @"alias" : @(RCTCursorDragLink),
      @"auto" : @(RCTCursorAuto),
      @"col-resize" : @(RCTCursorResizeLeftRight),
      @"context-menu" : @(RCTCursorContextualMenu),
      @"copy" : @(RCTCursorDragCopy),
      @"crosshair" : @(RCTCursorCrosshair),
      @"default" : @(RCTCursorArrow),
      @"disappearing-item" : @(RCTCursorDisappearingItem),
      @"e-resize" : @(RCTCursorResizeRight),
      @"grab" : @(RCTCursorOpenHand),
      @"grabbing" : @(RCTCursorClosedHand),
      @"n-resize" : @(RCTCursorResizeUp),
      @"no-drop" : @(RCTCursorOperationNotAllowed),
      @"not-allowed" : @(RCTCursorOperationNotAllowed),
      @"pointer" : @(RCTCursorPointingHand),
      @"row-resize" : @(RCTCursorResizeUpDown),
      @"s-resize" : @(RCTCursorResizeDown),
      @"text" : @(RCTCursorIBeam),
      @"vertical-text" : @(RCTCursorIBeamCursorForVerticalLayout),
      @"w-resize" : @(RCTCursorResizeLeft),
    }),
    RCTCursorAuto,
    integerValue)

#if TARGET_OS_OSX // [macOS
+ (NSCursor *)NSCursor:(RCTCursor)rctCursor
{
  NSCursor *cursor;

  switch (rctCursor) {
    case RCTCursorArrow:
      cursor = [NSCursor arrowCursor];
      break;
    case RCTCursorClosedHand:
      cursor = [NSCursor closedHandCursor];
      break;
    case RCTCursorContextualMenu:
      cursor = [NSCursor contextualMenuCursor];
      break;
    case RCTCursorCrosshair:
      cursor = [NSCursor crosshairCursor];
      break;
    case RCTCursorDisappearingItem:
      cursor = [NSCursor disappearingItemCursor];
      break;
    case RCTCursorDragCopy:
      cursor = [NSCursor dragCopyCursor];
      break;
    case RCTCursorDragLink:
      cursor = [NSCursor dragLinkCursor];
      break;
    case RCTCursorIBeam:
      cursor = [NSCursor IBeamCursor];
      break;
    case RCTCursorIBeamCursorForVerticalLayout:
      cursor = [NSCursor IBeamCursorForVerticalLayout];
      break;
    case RCTCursorOpenHand:
      cursor = [NSCursor openHandCursor];
      break;
    case RCTCursorOperationNotAllowed:
      cursor = [NSCursor operationNotAllowedCursor];
      break;
    case RCTCursorPointingHand:
      cursor = [NSCursor pointingHandCursor];
      break;
    case RCTCursorResizeDown:
      cursor = [NSCursor resizeDownCursor];
      break;
    case RCTCursorResizeLeft:
      cursor = [NSCursor resizeLeftCursor];
      break;
    case RCTCursorResizeLeftRight:
      cursor = [NSCursor resizeLeftRightCursor];
      break;
    case RCTCursorResizeRight:
      cursor = [NSCursor resizeRightCursor];
      break;
    case RCTCursorResizeUp:
      cursor = [NSCursor resizeUpCursor];
      break;
    case RCTCursorResizeUpDown:
      cursor = [NSCursor resizeUpDownCursor];
      break;
  }

  return cursor;
}
#endif // macOS]

@end
