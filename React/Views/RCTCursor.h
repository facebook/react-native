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

@end
