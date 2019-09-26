/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenterStub.h"

@implementation RCTBridge (RCTSurfacePresenterStub)

- (id<RCTSurfacePresenterStub>)surfacePresenter
{
  return objc_getAssociatedObject(self, @selector(surfacePresenter));
}

@end
