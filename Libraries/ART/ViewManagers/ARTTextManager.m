/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTTextManager.h>

#import <React/ARTText.h>
#import "RCTConvert+ART.h"

@implementation ARTTextManager

RCT_EXPORT_MODULE()

- (ARTRenderable *)node
{
  return [ARTText new];
}

RCT_EXPORT_VIEW_PROPERTY(alignment, CTTextAlignment)
RCT_REMAP_VIEW_PROPERTY(frame, textFrame, ARTTextFrame)

@end
