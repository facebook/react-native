/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <yoga/Yoga.h>

typedef struct {
  YGValue x;
  YGValue y;
  CGFloat z;
} RCTTransformOrigin;

static inline BOOL RCTTransformOriginIsDefault(RCTTransformOrigin origin) {
    return origin.x.value == 50.0f && origin.x.unit == YGUnitPercent &&
           origin.y.value == 50.0f && origin.y.unit == YGUnitPercent &&
           origin.z == 0.0f;
}
