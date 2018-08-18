/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/components/view/primitives.h>
#import <fabric/graphics/Color.h>
#import <fabric/graphics/Geometry.h>

inline NSString *_Nullable RCTNSStringFromString(const std::string &string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [NSString stringWithCString:string.c_str() encoding:encoding];
}

inline std::string RCTStringFromNSString(NSString *string, const NSStringEncoding &encoding = NSUTF8StringEncoding) {
  return [string cStringUsingEncoding:encoding];
}

inline UIColor *_Nullable RCTUIColorFromSharedColor(const facebook::react::SharedColor &sharedColor) {
  return sharedColor ? [UIColor colorWithCGColor:sharedColor.get()] : nil;
}

inline CGColorRef RCTCGColorRefFromSharedColor(const facebook::react::SharedColor &sharedColor) {
  return sharedColor ? CGColorCreateCopy(sharedColor.get()) : nil;
}

inline CGPoint RCTCGPointFromPoint(const facebook::react::Point &point) {
  return {point.x, point.y};
}

inline CGSize RCTCGSizeFromSize(const facebook::react::Size &size) {
  return {size.width, size.height};
}

inline CGRect RCTCGRectFromRect(const facebook::react::Rect &rect) {
  return {RCTCGPointFromPoint(rect.origin), RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets RCTUIEdgeInsetsFromEdgeInsets(const facebook::react::EdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}


inline CATransform3D RCTCATransform3DFromTransformMatrix(const facebook::react::Transform &transformMatrix) {
  return {
    (CGFloat)transformMatrix.matrix[0],
    (CGFloat)transformMatrix.matrix[1],
    (CGFloat)transformMatrix.matrix[2],
    (CGFloat)transformMatrix.matrix[3],
    (CGFloat)transformMatrix.matrix[4],
    (CGFloat)transformMatrix.matrix[5],
    (CGFloat)transformMatrix.matrix[6],
    (CGFloat)transformMatrix.matrix[7],
    (CGFloat)transformMatrix.matrix[8],
    (CGFloat)transformMatrix.matrix[9],
    (CGFloat)transformMatrix.matrix[10],
    (CGFloat)transformMatrix.matrix[11],
    (CGFloat)transformMatrix.matrix[12],
    (CGFloat)transformMatrix.matrix[13],
    (CGFloat)transformMatrix.matrix[14],
    (CGFloat)transformMatrix.matrix[15]
  };
}

inline facebook::react::Point RCTPointFromCGPoint(const CGPoint &point) {
  return {point.x, point.y};
}

inline facebook::react::Size RCTSizeFromCGSize(const CGSize &size) {
  return {size.width, size.height};
}

inline facebook::react::Rect RCTRectFromCGRect(const CGRect &rect) {
  return {RCTPointFromCGPoint(rect.origin), RCTSizeFromCGSize(rect.size)};
}

inline facebook::react::EdgeInsets RCTEdgeInsetsFromUIEdgeInsets(const UIEdgeInsets &edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}
