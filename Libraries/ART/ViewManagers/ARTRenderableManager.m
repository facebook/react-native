/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ARTRenderableManager.h"

#import "RCTConvert+ART.h"

@implementation ARTRenderableManager

RCT_EXPORT_MODULE()

- (ARTRenderable *)node
{
  return [[ARTRenderable alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(strokeWidth, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(strokeCap, CGLineCap)
RCT_EXPORT_VIEW_PROPERTY(strokeJoin, CGLineJoin)
RCT_EXPORT_VIEW_PROPERTY(fill, ARTBrush)
RCT_EXPORT_VIEW_PROPERTY(stroke, CGColor)
RCT_EXPORT_VIEW_PROPERTY(strokeDash, ARTCGFloatArray)

@end
