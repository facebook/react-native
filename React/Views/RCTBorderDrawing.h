/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

typedef struct {
  CGFloat topLeft;
  CGFloat topRight;
  CGFloat bottomLeft;
  CGFloat bottomRight;
} RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} RCTCornerInsets;

typedef struct {
  CGColorRef top;
  CGColorRef left;
  CGColorRef bottom;
  CGColorRef right;
} RCTBorderColors;

/**
 * Determine if the border widths, colors and radii are all equal.
 */
BOOL RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
BOOL RCTCornerRadiiAreEqual(RCTCornerRadii cornerRadii);
BOOL RCTBorderColorsAreEqual(RCTBorderColors borderColors);

/**
 * Convert RCTCornerRadii to RCTCornerInsets by applying border insets.
 */
RCTCornerInsets RCTGetCornerInsets(RCTCornerRadii cornerRadii,
                                   UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
CGPathRef RCTPathCreateWithRoundedRect(CGRect bounds,
                                       RCTCornerInsets cornerInsets,
                                       const CGAffineTransform *transform);

/**
 * Draw a CSS-compliant border as a scalable image.
 */
UIImage *RCTGetBorderImage(RCTCornerRadii cornerRadii,
                           UIEdgeInsets borderInsets,
                           RCTBorderColors borderColors,
                           CGColorRef backgroundColor,
                           BOOL drawToEdge);
