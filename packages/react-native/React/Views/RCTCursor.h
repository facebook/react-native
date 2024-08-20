/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h> // [macOS]

typedef NS_ENUM(NSInteger, RCTCursor) {
  // [macOS
  RCTCursorAlias,
  RCTCursorAuto,
  RCTCursorAllScroll,
  RCTCursorCell,
  RCTCursorColResize,
  RCTCursorContextMenu,
  RCTCursorCopy,
  RCTCursorCrosshair,
  RCTCursorDefault,
  RCTCursorEResize,
  RCTCursorEWResize,
  RCTCursorGrab,
  RCTCursorGrabbing,
  RCTCursorHelp,
  RCTCursorMove,
  RCTCursorNEResize,
  RCTCursorNESWResize,
  RCTCursorNResize,
  RCTCursorNSResize,
  RCTCursorNWResize,
  RCTCursorNWSEResize,
  RCTCursorNoDrop,
  RCTCursorNone,
  RCTCursorNotAllowed,
  RCTCursorPointer,
  RCTCursorProgress,
  RCTCursorRowResize,
  RCTCursorSResize,
  RCTCursorSEResize,
  RCTCursorSWResize,
  RCTCursorText,
  RCTCursorUrl,
  RCTCursorVerticalText,
  RCTCursorWResize,
  RCTCursorWait,
  RCTCursorZoomIn,
  RCTCursorZoomOut,
  // macOS]
};

#if TARGET_OS_OSX // [macOS
RCT_EXTERN NSCursor *__nullable NSCursorFromRCTCursor(RCTCursor cursor);
#endif // macOS]

