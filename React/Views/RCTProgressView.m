/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import "RCTProgressView.h"

@implementation RCTProgressView

#if TARGET_OS_OSX
- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.maxValue = 1.0;
    self.indeterminate = NO;

    // Default track color from NSProgressIndicator.
    self.trackTintColor = [RCTUIColor colorWithRed: 237/255.0 green:237/255.0 blue:237/255.0 alpha:1.0];
  }
  return self;
}

- (void)setProgressImage:(UIImage *)progressImage
{
  progressImage.capInsets = NSEdgeInsetsMake(0, progressImage.size.width-0.5, 0, 0);
  progressImage.resizingMode = NSImageResizingModeStretch;
  _progressImage = progressImage;
}

- (void)setTrackImage:(UIImage *)trackImage
{
  trackImage.capInsets = NSEdgeInsetsMake(0, 0, 0, trackImage.size.width-0.5);
  trackImage.resizingMode = NSImageResizingModeStretch;
  _trackImage = trackImage;
}

- (void)drawRect:(NSRect)dirtyRect
{
  [super drawRect:dirtyRect];

  if (self.progressTintColor == nil && self.progressImage == nil) {
    return;
  }

  // Clear background color
  [[NSColor clearColor] set];
  NSRectFill(dirtyRect);

  // Draw progress line
  NSRect activeRect = [self bounds];
  activeRect.size.width = floor(activeRect.size.width * (self.doubleValue/self.maxValue));
  if (self.progressTintColor) {
    [self.progressTintColor set];
    NSRectFill(activeRect);
  } else {
    [self.progressImage drawInRect:activeRect];
  }

  // Draw empty line
  NSRect passiveRect = [self bounds];
  passiveRect.size.width -= activeRect.size.width;
  passiveRect.origin.x = activeRect.size.width;
  if (self.trackTintColor) {
    [self.trackTintColor set];
    NSRectFill(passiveRect);
  } else {
    [self.trackImage drawInRect:passiveRect];
  }
}
#endif

@end
