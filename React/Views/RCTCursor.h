/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTCursor) {
  RCTCursorAuto,
  RCTCursorArrow,
  RCTCursorIBeam,
  RCTCursorCrosshair,
  RCTCursorClosedHand,
  RCTCursorOpenHand,
  RCTCursorPointingHand,
  RCTCursorResizeLeft,
  RCTCursorResizeRight,
  RCTCursorResizeLeftRight,
  RCTCursorResizeUp,
  RCTCursorResizeDown,
  RCTCursorResizeUpDown,
  RCTCursorDisappearingItem,
  RCTCursorIBeamCursorForVerticalLayout,
  RCTCursorOperationNotAllowed,
  RCTCursorDragLink,
  RCTCursorDragCopy,
  RCTCursorContextualMenu,
};

@interface RCTConvert (RCTCursor)

+ (RCTCursor)RCTCursor:(id)json;
#if TARGET_OS_OSX // [macOS
+ (NSCursor *)NSCursor:(RCTCursor)rctCursor;
#endif // macOS]

@end
