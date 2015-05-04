/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ARTTextManager.h"

#import "ARTText.h"
#import "RCTConvert+ART.h"

@implementation ARTTextManager

RCT_EXPORT_MODULE()

- (ARTRenderable *)node
{
  return [[ARTText alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ARTTextFrame)

@end
