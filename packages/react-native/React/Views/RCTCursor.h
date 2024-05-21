/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 #import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTCursor) {
  RCTCursorAlias,
  RCTCursorAuto,
  RCTCursorColumnResize,
  RCTCursorContextualMenu,
  RCTCursorCopy,
  RCTCursorCrosshair,
  RCTCursorDefault,
  RCTCursorDisappearingItem,
  RCTCursorEastResize,
  RCTCursorGrab,
  RCTCursorGrabbing,
  RCTCursorNorthResize,
  RCTCursorNoDrop,
  RCTCursorNotAllowed,
  RCTCursorPointer,
  RCTCursorRowResize,
  RCTCursorSouthResize,
  RCTCursorText,
  RCTCursorVerticalText,
  RCTCursorWestResize,
};

#if TARGET_OS_OSX // [macOS
inline static NSCursor *NSCursorFromRCTCursor(RCTCursor cursor)
{
  switch (cursor) {
    case RCTCursorAlias:
      return [NSCursor dragLinkCursor];
    case RCTCursorAuto:
      return [NSCursor arrowCursor];
    case RCTCursorColumnResize:
      return [NSCursor resizeLeftRightCursor];
    case RCTCursorContextualMenu:
      return [NSCursor contextualMenuCursor];
    case RCTCursorCopy:
      return [NSCursor dragCopyCursor];
    case RCTCursorCrosshair:
      return [NSCursor crosshairCursor];
    case RCTCursorDefault:
      return [NSCursor arrowCursor];
    case RCTCursorDisappearingItem:
      return [NSCursor disappearingItemCursor];
    case RCTCursorEastResize:
      return [NSCursor resizeRightCursor];
    case RCTCursorGrab:
      return [NSCursor openHandCursor];
    case RCTCursorGrabbing:
      return [NSCursor closedHandCursor];
    case RCTCursorNorthResize:
      return [NSCursor resizeUpCursor];
    case RCTCursorNoDrop:
      return [NSCursor operationNotAllowedCursor];
    case RCTCursorNotAllowed:
      return [NSCursor operationNotAllowedCursor];
    case RCTCursorPointer:
      return [NSCursor pointingHandCursor];
    case RCTCursorRowResize:
      return [NSCursor resizeUpDownCursor];
    case RCTCursorSouthResize:
      return [NSCursor resizeDownCursor];
    case RCTCursorText:
      return [NSCursor IBeamCursor];
    case RCTCursorVerticalText:
      return [NSCursor IBeamCursorForVerticalLayout];
    case RCTCursorWestResize:
      return [NSCursor resizeLeftCursor];
  }
}
#endif // macOS]

