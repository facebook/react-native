/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <yoga/Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTShadowView;

typedef NS_ENUM(NSInteger, RCTDisplayType) {
  RCTDisplayTypeNone,
  RCTDisplayTypeFlex,
  RCTDisplayTypeInline,
};

struct RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE RCTLayoutMetrics RCTLayoutMetrics;

struct RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE RCTLayoutContext RCTLayoutContext;

static inline BOOL RCTLayoutMetricsEqualToLayoutMetrics(RCTLayoutMetrics a, RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

RCT_EXTERN RCTLayoutMetrics RCTLayoutMetricsFromYogaNode(YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
RCT_EXTERN float RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
RCT_EXTERN CGFloat RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `YGValue` to simple `CGFloat` value.
 */
RCT_EXTERN CGFloat RCTCoreGraphicsFloatFromYogaValue(YGValue value, CGFloat baseFloatValue);

/**
 * Converts `YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
RCT_EXTERN YGDirection RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
RCT_EXTERN UIUserInterfaceLayoutDirection RCTUIKitLayoutDirectionFromYogaLayoutDirection(YGDirection direction);

/**
 * Converts `YGDisplay` to `RCTDisplayType` and vise versa.
 */
RCT_EXTERN YGDisplay RCTYogaDisplayTypeFromReactDisplayType(RCTDisplayType displayType);
RCT_EXTERN RCTDisplayType RCTReactDisplayTypeFromYogaDisplayType(YGDisplay displayType);

NS_ASSUME_NONNULL_END
