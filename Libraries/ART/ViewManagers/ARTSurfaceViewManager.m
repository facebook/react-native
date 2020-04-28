/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTSurfaceViewManager.h>

#import <React/ARTSurfaceView.h>

@implementation ARTSurfaceViewManager

RCT_EXPORT_MODULE()

- (RCTUIView *)view // TODO(macOS ISS#3536887)
{
  return [ARTSurfaceView new];
}

@end
