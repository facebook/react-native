/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ARTSurfaceViewManager.h"

#import "ARTSurfaceView.h"

@implementation ARTSurfaceViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ARTSurfaceView new];
}

@end
