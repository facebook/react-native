/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import <Foundation/Foundation.h>
#import "RCTCursor.h"

#if defined(__MAC_OS_X_VERSION_MAX_ALLOWED) && __MAC_OS_X_VERSION_MAX_ALLOWED >= 150000 /* __MAC_15_0 */
#define RCT_MAC_OS_15_SDK_AVAILABLE
#endif // __MAC_OS_X_VERSION_MAX_ALLOWED

#if TARGET_OS_OSX
NSCursor *NSCursorFromRCTCursor(RCTCursor cursor)
{
  NSCursor *resolvedCursor = nil;
  switch (cursor) {
    case RCTCursorAuto:
      break;
    case RCTCursorAlias:
      resolvedCursor = [NSCursor dragLinkCursor];
      break;
    case RCTCursorAllScroll:
      // Not supported
      break;
    case RCTCursorCell:
      // Not supported
      break;
    case RCTCursorColResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor columnResizeCursor];
      } else {
        resolvedCursor = [NSCursor resizeLeftRightCursor];
      }
#else
      resolvedCursor = [NSCursor resizeLeftRightCursor];
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorContextMenu:
      resolvedCursor = [NSCursor contextualMenuCursor];
      break;
    case RCTCursorCopy:
      resolvedCursor = [NSCursor dragCopyCursor];
      break;
    case RCTCursorCrosshair:
      resolvedCursor = [NSCursor crosshairCursor];
      break;
    case RCTCursorDefault:
      resolvedCursor = [NSCursor arrowCursor];
      break;
    case RCTCursorEResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionRight
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      } else {
        resolvedCursor = [NSCursor resizeRightCursor];
      }
#else
      resolvedCursor = [NSCursor resizeRightCursor];
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorEWResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionLeft
                                                    inDirections:NSCursorFrameResizeDirectionsAll];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorGrab:
      resolvedCursor = [NSCursor openHandCursor];
      break;
    case RCTCursorGrabbing:
      resolvedCursor = [NSCursor closedHandCursor];
      break;
    case RCTCursorHelp:
      // Not supported
      break;
    case RCTCursorMove:
      // Not supported
      break;
    case RCTCursorNEResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTopRight
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNESWResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTopRight
                                                    inDirections:NSCursorFrameResizeDirectionsAll];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNResize:
      resolvedCursor = [NSCursor resizeUpCursor];
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTop
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      } else {
        resolvedCursor = [NSCursor resizeUpCursor];
      }
#else
      resolvedCursor = [NSCursor resizeUpCursor];
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNSResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTop
                                                    inDirections:NSCursorFrameResizeDirectionsAll];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNWResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTopLeft
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNWSEResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionTopLeft
                                                    inDirections:NSCursorFrameResizeDirectionsAll];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorNoDrop:
      resolvedCursor = [NSCursor operationNotAllowedCursor];
      break;
    case RCTCursorNone:
      resolvedCursor = [[NSCursor alloc] initWithImage:[[NSImage alloc] initWithSize:NSMakeSize(1, 1)] hotSpot:NSZeroPoint];
      break;
    case RCTCursorNotAllowed:
      resolvedCursor = [NSCursor operationNotAllowedCursor];
      break;
    case RCTCursorPointer:
      resolvedCursor = [NSCursor pointingHandCursor];
      break;
    case RCTCursorProgress:
      // Not supported
      break;
    case RCTCursorRowResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor rowResizeCursor];
      } else {
        resolvedCursor = [NSCursor resizeUpDownCursor];
      }
#else
      resolvedCursor = [NSCursor resizeUpDownCursor];
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorSResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionBottom
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      } else {
        resolvedCursor = [NSCursor resizeDownCursor];
      }
#else
      resolvedCursor = [NSCursor resizeDownCursor];
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorSEResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionBottomRight
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorSWResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionBottomLeft
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorText:
      resolvedCursor = [NSCursor IBeamCursor];
      break;
    case RCTCursorUrl:
      // Not supported
      break;
    case RCTCursorVerticalText:
      resolvedCursor = [NSCursor IBeamCursorForVerticalLayout];
      break;
    case RCTCursorWResize:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor frameResizeCursorFromPosition:NSCursorFrameResizePositionLeft
                                                    inDirections:NSCursorFrameResizeDirectionsOutward];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorWait:
      // Not supported
      break;
    case RCTCursorZoomIn:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor zoomInCursor];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
    case RCTCursorZoomOut:
#ifdef RCT_MAC_OS_15_SDK_AVAILABLE
      if (@available(macOS 15.0, *)) {
        resolvedCursor = [NSCursor zoomOutCursor];
      }
#endif // RCT_MAC_OS_15_SDK_AVAILABLE
      break;
  }
  return resolvedCursor;
}
#endif // TARGET_OS_OSX

