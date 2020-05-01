/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/ARTGroup.h>

@implementation ARTGroup

- (void)renderLayerTo:(CGContextRef)context
{
  if (!CGRectIsEmpty(self.clipping)) {
    CGContextClipToRect(context, self.clipping);
  }

  for (UIView *subview in self.subviews) {
    if ([subview respondsToSelector:@selector(renderTo:)]) {
      [(ARTNode *)subview renderTo:context];
    } else {
      // This is needed for legacy interop layer. Legacy interop layer
      // is superview of the view that it is bridging, that's why we need
      // to grab its first subview.
      [(ARTNode *)subview.subviews.firstObject renderTo:context];
    }
  }
}

@end
