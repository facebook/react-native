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

@end
