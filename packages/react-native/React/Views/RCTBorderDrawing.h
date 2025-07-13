/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBorderStyle.h>
#import <React/RCTDefines.h>

typedef struct {
  CGFloat topLeftHorizontal;
  CGFloat topLeftVertical;
  CGFloat topRightHorizontal;
  CGFloat topRightVertical;
  CGFloat bottomLeftHorizontal;
  CGFloat bottomLeftVertical;
  CGFloat bottomRightHorizontal;
  CGFloat bottomRightVertical;
} RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} RCTCornerInsets;

typedef struct {
  UIColor *top;
  UIColor *left;
  UIColor *bottom;
  UIColor *right;
} RCTBorderColors;

/**
 * Determine the largest border inset value.
 */
RCT_EXTERN CGFloat RCTMaxBorderInset(UIEdgeInsets borderInsets);

/**
 * Determine if the border widths, colors and radii are all equal.
 */
RCT_EXTERN BOOL RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
RCT_EXTERN BOOL RCTCornerRadiiAreEqualAndSymmetrical(RCTCornerRadii cornerRadii);
RCT_EXTERN BOOL RCTBorderColorsAreEqual(RCTBorderColors borderColors);

/**
 * Convert RCTCornerRadii to RCTCornerInsets by applying border insets.
 * Effectively, returns radius - inset, with a lower bound of 0.0.
 */
RCT_EXTERN RCTCornerInsets RCTGetCornerInsets(RCTCornerRadii cornerRadii, UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
RCT_EXTERN CGPathRef RCTPathCreateWithRoundedRect(
    CGRect bounds,
    RCTCornerInsets cornerInsets,
    const CGAffineTransform *transform,
    const BOOL inverted);

/**
 * Draw a CSS-compliant border as an image. You can determine if it's scalable
 * by inspecting the image's `capInsets`.
 *
 * `borderInsets` defines the border widths for each edge.
 */
RCT_EXTERN UIImage *RCTGetBorderImage(
    RCTBorderStyle borderStyle,
    CGSize viewSize,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets borderInsets,
    RCTBorderColors borderColors,
    UIColor *backgroundColor,
    BOOL drawToEdge);
