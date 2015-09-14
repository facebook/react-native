/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBorderDrawing.h"

static const CGFloat RCTViewBorderThreshold = 0.001;

BOOL RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets)
{
  return
  ABS(borderInsets.left - borderInsets.right) < RCTViewBorderThreshold &&
  ABS(borderInsets.left - borderInsets.bottom) < RCTViewBorderThreshold &&
  ABS(borderInsets.left - borderInsets.top) < RCTViewBorderThreshold;
}

BOOL RCTCornerRadiiAreEqual(RCTCornerRadii cornerRadii)
{
  return
  ABS(cornerRadii.topLeft - cornerRadii.topRight) < RCTViewBorderThreshold &&
  ABS(cornerRadii.topLeft - cornerRadii.bottomLeft) < RCTViewBorderThreshold &&
  ABS(cornerRadii.topLeft - cornerRadii.bottomRight) < RCTViewBorderThreshold;
}

BOOL RCTBorderColorsAreEqual(RCTBorderColors borderColors)
{
  return
  CGColorEqualToColor(borderColors.left, borderColors.right) &&
  CGColorEqualToColor(borderColors.left, borderColors.top) &&
  CGColorEqualToColor(borderColors.left, borderColors.bottom);
}

RCTCornerInsets RCTGetCornerInsets(RCTCornerRadii cornerRadii,
                                   UIEdgeInsets edgeInsets)
{
  return (RCTCornerInsets) {
    {
      MAX(0, cornerRadii.topLeft - edgeInsets.left),
      MAX(0, cornerRadii.topLeft - edgeInsets.top),
    },
    {
      MAX(0, cornerRadii.topRight - edgeInsets.right),
      MAX(0, cornerRadii.topRight - edgeInsets.top),
    },
    {
      MAX(0, cornerRadii.bottomLeft - edgeInsets.left),
      MAX(0, cornerRadii.bottomLeft - edgeInsets.bottom),
    },
    {
      MAX(0, cornerRadii.bottomRight - edgeInsets.right),
      MAX(0, cornerRadii.bottomRight - edgeInsets.bottom),
    }
  };
}

static void RCTPathAddEllipticArc(CGMutablePathRef path,
                                  const CGAffineTransform *m,
                                  CGPoint origin,
                                  CGSize size,
                                  CGFloat startAngle,
                                  CGFloat endAngle,
                                  BOOL clockwise)
{
  CGFloat xScale = 1, yScale = 1, radius = 0;
  if (size.width != 0) {
    xScale = 1;
    yScale = size.height / size.width;
    radius = size.width;
  } else if (size.height != 0) {
    xScale = size.width / size.height;
    yScale = 1;
    radius = size.height;
  }

  CGAffineTransform t = CGAffineTransformMakeTranslation(origin.x, origin.y);
  t = CGAffineTransformScale(t, xScale, yScale);
  if (m != NULL) {
    t = CGAffineTransformConcat(t, *m);
  }

  CGPathAddArc(path, &t, 0, 0, radius, startAngle, endAngle, clockwise);
}

CGPathRef RCTPathCreateWithRoundedRect(CGRect bounds,
                                       RCTCornerInsets cornerInsets,
                                       const CGAffineTransform *transform)
{
  const CGFloat minX = CGRectGetMinX(bounds);
  const CGFloat minY = CGRectGetMinY(bounds);
  const CGFloat maxX = CGRectGetMaxX(bounds);
  const CGFloat maxY = CGRectGetMaxY(bounds);

  const CGSize topLeft = cornerInsets.topLeft;
  const CGSize topRight = cornerInsets.topRight;
  const CGSize bottomLeft = cornerInsets.bottomLeft;
  const CGSize bottomRight = cornerInsets.bottomRight;

  CGMutablePathRef path = CGPathCreateMutable();
  RCTPathAddEllipticArc(path, transform, (CGPoint){
    minX + topLeft.width, minY + topLeft.height
  }, topLeft, M_PI, 3 * M_PI_2, NO);
  RCTPathAddEllipticArc(path, transform, (CGPoint){
    maxX - topRight.width, minY + topRight.height
  }, topRight, 3 * M_PI_2, 0, NO);
  RCTPathAddEllipticArc(path, transform, (CGPoint){
    maxX - bottomRight.width, maxY - bottomRight.height
  }, bottomRight, 0, M_PI_2, NO);
  RCTPathAddEllipticArc(path, transform, (CGPoint){
    minX + bottomLeft.width, maxY - bottomLeft.height
  }, bottomLeft, M_PI_2, M_PI, NO);
  CGPathCloseSubpath(path);
  return path;
}

static void RCTEllipseGetIntersectionsWithLine(CGRect ellipseBounds,
                                               CGPoint lineStart,
                                               CGPoint lineEnd,
                                               CGPoint intersections[2])
{
  const CGPoint ellipseCenter = {
    CGRectGetMidX(ellipseBounds),
    CGRectGetMidY(ellipseBounds)
  };

  lineStart.x -= ellipseCenter.x;
  lineStart.y -= ellipseCenter.y;
  lineEnd.x -= ellipseCenter.x;
  lineEnd.y -= ellipseCenter.y;

  const CGFloat m = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x);
  const CGFloat a = ellipseBounds.size.width / 2;
  const CGFloat b = ellipseBounds.size.height / 2;
  const CGFloat c = lineStart.y - m * lineStart.x;
  const CGFloat A = (b * b + a * a * m * m);
  const CGFloat B = 2 * a * a * c * m;
  const CGFloat D = sqrt((a * a * (b * b - c * c)) / A + pow(B / (2 * A), 2));

  const CGFloat x_ = -B / (2 * A);
  const CGFloat x1 = x_ + D;
  const CGFloat x2 = x_ - D;
  const CGFloat y1 = m * x1 + c;
  const CGFloat y2 = m * x2 + c;

  intersections[0] = (CGPoint){x1 + ellipseCenter.x, y1 + ellipseCenter.y};
  intersections[1] = (CGPoint){x2 + ellipseCenter.x, y2 + ellipseCenter.y};
}

UIImage *RCTGetBorderImage(RCTCornerRadii cornerRadii,
                           UIEdgeInsets borderInsets,
                           RCTBorderColors borderColors,
                           CGColorRef backgroundColor,
                           BOOL drawToEdge)
{
  const BOOL hasCornerRadii =
  cornerRadii.topLeft > RCTViewBorderThreshold ||
  cornerRadii.topRight > RCTViewBorderThreshold ||
  cornerRadii.bottomLeft > RCTViewBorderThreshold ||
  cornerRadii.bottomRight > RCTViewBorderThreshold;

  const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, borderInsets);

  const UIEdgeInsets edgeInsets = (UIEdgeInsets){
    borderInsets.top + MAX(cornerInsets.topLeft.height, cornerInsets.topRight.height),
    borderInsets.left + MAX(cornerInsets.topLeft.width, cornerInsets.bottomLeft.width),
    borderInsets.bottom + MAX(cornerInsets.bottomLeft.height, cornerInsets.bottomRight.height),
    borderInsets.right + MAX(cornerInsets.bottomRight.width, cornerInsets.topRight.width)
  };

  const CGSize size = (CGSize){
    edgeInsets.left + 1 + edgeInsets.right,
    edgeInsets.top + 1 + edgeInsets.bottom
  };

  const CGFloat alpha = CGColorGetAlpha(backgroundColor);
  const BOOL opaque = (drawToEdge || !hasCornerRadii) && alpha == 1.0;
  UIGraphicsBeginImageContextWithOptions(size, opaque, 0.0);

  CGContextRef ctx = UIGraphicsGetCurrentContext();
  const CGRect rect = {.size = size};

  CGPathRef path;
  if (drawToEdge) {
    path = CGPathCreateWithRect(rect, NULL);
  } else {
    path = RCTPathCreateWithRoundedRect(rect, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL);
  }

  if (backgroundColor) {
    CGContextSetFillColorWithColor(ctx, backgroundColor);
    CGContextAddPath(ctx, path);
    CGContextFillPath(ctx);
  }

  CGContextAddPath(ctx, path);
  CGPathRelease(path);

  CGPathRef insetPath = RCTPathCreateWithRoundedRect(UIEdgeInsetsInsetRect(rect, borderInsets), cornerInsets, NULL);

  CGContextAddPath(ctx, insetPath);
  CGContextEOClip(ctx);

  BOOL hasEqualColors = RCTBorderColorsAreEqual(borderColors);
  if ((drawToEdge || !hasCornerRadii) && hasEqualColors) {

    CGContextSetFillColorWithColor(ctx, borderColors.left);
    CGContextAddRect(ctx, rect);
    CGContextAddPath(ctx, insetPath);
    CGContextEOFillPath(ctx);

  } else {

    CGPoint topLeft = (CGPoint){borderInsets.left, borderInsets.top};
    if (cornerInsets.topLeft.width > 0 && cornerInsets.topLeft.height > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine((CGRect){
        topLeft, {2 * cornerInsets.topLeft.width, 2 * cornerInsets.topLeft.height}
      }, CGPointZero, topLeft, points);
      if (!isnan(points[1].x) && !isnan(points[1].y)) {
        topLeft = points[1];
      }
    }

    CGPoint bottomLeft = (CGPoint){borderInsets.left, size.height - borderInsets.bottom};
    if (cornerInsets.bottomLeft.width > 0 && cornerInsets.bottomLeft.height > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine((CGRect){
        {bottomLeft.x, bottomLeft.y - 2 * cornerInsets.bottomLeft.height},
        {2 * cornerInsets.bottomLeft.width, 2 * cornerInsets.bottomLeft.height}
      }, (CGPoint){0, size.height}, bottomLeft, points);
      if (!isnan(points[1].x) && !isnan(points[1].y)) {
        bottomLeft = points[1];
      }
    }

    CGPoint topRight = (CGPoint){size.width - borderInsets.right, borderInsets.top};
    if (cornerInsets.topRight.width > 0 && cornerInsets.topRight.height > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine((CGRect){
        {topRight.x - 2 * cornerInsets.topRight.width, topRight.y},
        {2 * cornerInsets.topRight.width, 2 * cornerInsets.topRight.height}
      }, (CGPoint){size.width, 0}, topRight, points);
      if (!isnan(points[0].x) && !isnan(points[0].y)) {
        topRight = points[0];
      }
    }

    CGPoint bottomRight = (CGPoint){size.width - borderInsets.right, size.height - borderInsets.bottom};
    if (cornerInsets.bottomRight.width > 0 && cornerInsets.bottomRight.height > 0) {
      CGPoint points[2];
      RCTEllipseGetIntersectionsWithLine((CGRect){
        {bottomRight.x - 2 * cornerInsets.bottomRight.width, bottomRight.y - 2 * cornerInsets.bottomRight.height},
        {2 * cornerInsets.bottomRight.width, 2 * cornerInsets.bottomRight.height}
      }, (CGPoint){size.width, size.height}, bottomRight, points);
      if (!isnan(points[0].x) && !isnan(points[0].y)) {
        bottomRight = points[0];
      }
    }

    // RIGHT
    if (borderInsets.right > 0) {

      const CGPoint points[] = {
        (CGPoint){size.width, 0},
        topRight,
        bottomRight,
        (CGPoint){size.width, size.height},
      };

      CGContextSetFillColorWithColor(ctx, borderColors.right);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);
    }

    // BOTTOM
    if (borderInsets.bottom > 0) {

      const CGPoint points[] = {
        (CGPoint){0, size.height},
        bottomLeft,
        bottomRight,
        (CGPoint){size.width, size.height},
      };

      CGContextSetFillColorWithColor(ctx, borderColors.bottom);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);
    }

    // LEFT
    if (borderInsets.left > 0) {

      const CGPoint points[] = {
        CGPointZero,
        topLeft,
        bottomLeft,
        (CGPoint){0, size.height},
      };

      CGContextSetFillColorWithColor(ctx, borderColors.left);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);
    }

    // TOP
    if (borderInsets.top > 0) {

      const CGPoint points[] = {
        CGPointZero,
        topLeft,
        topRight,
        (CGPoint){size.width, 0},
      };

      CGContextSetFillColorWithColor(ctx, borderColors.top);
      CGContextAddLines(ctx, points, sizeof(points)/sizeof(*points));
      CGContextFillPath(ctx);
    }
  }

  CGPathRelease(insetPath);

  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  return [image resizableImageWithCapInsets:edgeInsets];
}
