/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ARTNodeManager.h"

#import "ARTNode.h"

@implementation ARTNodeManager

RCT_EXPORT_MODULE()

- (ARTNode *)node
{
  return [ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (RCTShadowView *)shadowView
{
  return nil;
}

RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
