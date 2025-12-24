/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTClipPathUtils.h"

#import "RCTBasicShapeUtils.h"
#import <React/RCTConversions.h>

using namespace facebook::react;

@implementation RCTClipPathUtils

+ (RCTCornerRadii)adjustCornerRadiiForGeometryBox:(GeometryBox)geometryBox
                                       cornerRadii:(RCTCornerRadii)cornerRadii
                                     layoutMetrics:(const LayoutMetrics &)layoutMetrics
                                         yogaStyle:(const facebook::yoga::Style &)yogaStyle
{	
	RCTCornerRadii adjustedRadii = cornerRadii;
  
  switch (geometryBox) {
    case GeometryBox::MarginBox: {
      // Margin-box: extend border-radius by margin amount
			adjustedRadii.topLeftHorizontal += layoutMetrics.marginInsets.left;
      adjustedRadii.topLeftVertical += layoutMetrics.marginInsets.top;
      adjustedRadii.topRightHorizontal += layoutMetrics.marginInsets.right;
      adjustedRadii.topRightVertical += layoutMetrics.marginInsets.top;
      adjustedRadii.bottomLeftHorizontal += layoutMetrics.marginInsets.left;
      adjustedRadii.bottomLeftVertical += layoutMetrics.marginInsets.bottom;
      adjustedRadii.bottomRightHorizontal += layoutMetrics.marginInsets.right;
      adjustedRadii.bottomRightVertical += layoutMetrics.marginInsets.bottom;
      break;
    }
    case GeometryBox::BorderBox:
    case GeometryBox::StrokeBox:
    case GeometryBox::ViewBox:
      // Border-box: use border-radius as-is (this is the reference)
      break;
      
    case GeometryBox::PaddingBox: {
      // Padding-box: reduce border-radius by border width
      adjustedRadii.topLeftHorizontal = MAX(0.0f, cornerRadii.topLeftHorizontal - layoutMetrics.borderWidth.left);
      adjustedRadii.topLeftVertical = MAX(0.0f, cornerRadii.topLeftVertical - layoutMetrics.borderWidth.top);
      adjustedRadii.topRightHorizontal = MAX(0.0f, cornerRadii.topRightHorizontal - layoutMetrics.borderWidth.right);
      adjustedRadii.topRightVertical = MAX(0.0f, cornerRadii.topRightVertical - layoutMetrics.borderWidth.top);
      adjustedRadii.bottomLeftHorizontal = MAX(0.0f, cornerRadii.bottomLeftHorizontal - layoutMetrics.borderWidth.left);
      adjustedRadii.bottomLeftVertical = MAX(0.0f, cornerRadii.bottomLeftVertical - layoutMetrics.borderWidth.bottom);
      adjustedRadii.bottomRightHorizontal = MAX(0.0f, cornerRadii.bottomRightHorizontal - layoutMetrics.borderWidth.right);
      adjustedRadii.bottomRightVertical = MAX(0.0f, cornerRadii.bottomRightVertical - layoutMetrics.borderWidth.bottom);
      break;
    }
    case GeometryBox::ContentBox:
    case GeometryBox::FillBox: {
      // Content-box: reduce border-radius by border width + padding
      adjustedRadii.topLeftHorizontal = MAX(0.0f, cornerRadii.topLeftHorizontal - layoutMetrics.borderWidth.left - layoutMetrics.paddingInsets.left);
      adjustedRadii.topLeftVertical = MAX(0.0f, cornerRadii.topLeftVertical - layoutMetrics.borderWidth.top - layoutMetrics.paddingInsets.top);
      adjustedRadii.topRightHorizontal = MAX(0.0f, cornerRadii.topRightHorizontal - layoutMetrics.borderWidth.right - layoutMetrics.paddingInsets.right);
      adjustedRadii.topRightVertical = MAX(0.0f, cornerRadii.topRightVertical - layoutMetrics.borderWidth.top - layoutMetrics.paddingInsets.top);
      adjustedRadii.bottomLeftHorizontal = MAX(0.0f, cornerRadii.bottomLeftHorizontal - layoutMetrics.borderWidth.left - layoutMetrics.paddingInsets.left);
      adjustedRadii.bottomLeftVertical = MAX(0.0f, cornerRadii.bottomLeftVertical - layoutMetrics.borderWidth.bottom - layoutMetrics.paddingInsets.bottom);
      adjustedRadii.bottomRightHorizontal = MAX(0.0f, cornerRadii.bottomRightHorizontal - layoutMetrics.borderWidth.right - layoutMetrics.paddingInsets.right);
      adjustedRadii.bottomRightVertical = MAX(0.0f, cornerRadii.bottomRightVertical - layoutMetrics.borderWidth.bottom - layoutMetrics.paddingInsets.bottom);
      break;
    }
  }
  
  return adjustedRadii;
}

+ (CGRect)getGeometryBoxRect:(GeometryBox)geometryBox
               layoutMetrics:(const LayoutMetrics &)layoutMetrics
                   yogaStyle:(const facebook::yoga::Style &)yogaStyle
                      bounds:(CGRect)bounds
{
  switch (geometryBox) {
    case GeometryBox::ContentBox:
    case GeometryBox::FillBox:
      return RCTCGRectFromRect(layoutMetrics.getContentFrame());
    case GeometryBox::PaddingBox:
      return RCTCGRectFromRect(layoutMetrics.getPaddingFrame());
    case GeometryBox::BorderBox:
    case GeometryBox::StrokeBox:
    case GeometryBox::ViewBox:
      return bounds;
    case GeometryBox::MarginBox:
      return CGRectMake(
        bounds.origin.x - layoutMetrics.marginInsets.left,
        bounds.origin.y - layoutMetrics.marginInsets.top,
        bounds.size.width + layoutMetrics.marginInsets.left + layoutMetrics.marginInsets.right,
        bounds.size.height + layoutMetrics.marginInsets.top + layoutMetrics.marginInsets.bottom
      );
  }
  
  return bounds;
}

+ (CALayer *)createClipPathLayer:(const ClipPath &)clipPath
                   layoutMetrics:(const LayoutMetrics &)layoutMetrics
                       yogaStyle:(const facebook::yoga::Style &)yogaStyle
                          bounds:(CGRect)bounds
                     cornerRadii:(RCTCornerRadii)cornerRadii
{
  CGRect box = bounds;
  if (clipPath.geometryBox.has_value()) {
    box = [self getGeometryBoxRect:clipPath.geometryBox.value()
                     layoutMetrics:layoutMetrics
                         yogaStyle:yogaStyle
                            bounds:bounds];
  }
  
  UIBezierPath *path = nil;
  if (clipPath.shape.has_value()) {
    path = [RCTBasicShapeUtils createPathFromBasicShape:clipPath.shape.value() bounds:box];
  } else if (clipPath.geometryBox.has_value()) {
    // For geometry box only (no shape), create a rounded rectangle using border radius
    // Adjust corner radii based on the geometry box type
    RCTCornerRadii adjustedRadii = [self adjustCornerRadiiForGeometryBox:clipPath.geometryBox.value()
                                                             cornerRadii:cornerRadii
                                                           layoutMetrics:layoutMetrics
                                                               yogaStyle:yogaStyle];
    RCTCornerInsets cornerInsets = RCTGetCornerInsets(adjustedRadii, UIEdgeInsetsZero);
    CGPathRef cgPath = RCTPathCreateWithRoundedRect(box, cornerInsets, nil, NO);
    path = [UIBezierPath bezierPathWithCGPath:cgPath];
    CGPathRelease(cgPath);
  }

  if (path == nil) {
    return nil;
  }

  CAShapeLayer *maskLayer = [CAShapeLayer layer];
  maskLayer.path = path.CGPath;
  if (path.usesEvenOddFillRule) {
    maskLayer.fillRule = kCAFillRuleEvenOdd;
  }
  return maskLayer;
}

@end
