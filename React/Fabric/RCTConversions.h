/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/graphics/Geometry.h>

inline CGPoint RCTCGPointFromPoint(facebook::react::Point point) {
  return {point.x, point.y};
}

inline CGSize RCTCGSizeFromSize(facebook::react::Size size) {
  return {size.width, size.height};
}

inline CGRect RCTCGRectFromRect(facebook::react::Rect rect) {
  return {RCTCGPointFromPoint(rect.origin), RCTCGSizeFromSize(rect.size)};
}

inline UIEdgeInsets RCTUIEdgeInsetsFromEdgeInsets(facebook::react::EdgeInsets edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}

inline facebook::react::Point RCTPointFromCGPoint(CGPoint point) {
  return {point.x, point.y};
}

inline facebook::react::Size RCTSizeFromCGSize(CGSize size) {
  return {size.width, size.height};
}

inline facebook::react::Rect RCTRectFromCGRect(CGRect rect) {
  return {RCTPointFromCGPoint(rect.origin), RCTSizeFromCGSize(rect.size)};
}

inline facebook::react::EdgeInsets RCTEdgeInsetsFromUIEdgeInsets(UIEdgeInsets edgeInsets) {
  return {edgeInsets.top, edgeInsets.left, edgeInsets.bottom, edgeInsets.right};
}
