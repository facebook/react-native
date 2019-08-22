/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextAttributes.h"
#import "RCTTextRenderer.h"

@implementation RCTTextRenderer
{
  NSTextStorage *_Nullable _textStorage;
  CGRect _contentFrame;
}

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
{
  _textStorage = textStorage;
  _contentFrame = contentFrame;
}

- (void)drawLayer:(CALayer *)layer
        inContext:(CGContextRef)ctx;
{
  if (!_textStorage) {
    return;
  }

  CGRect boundingBox = CGContextGetClipBoundingBox(ctx);
  CGContextSaveGState(ctx);
#if !TARGET_OS_OSX // TODO(macOS ISS#3536887)
  UIGraphicsPushContext(ctx);
#else
  [NSGraphicsContext saveGraphicsState];
#endif // TODO(macOS ISS#3536887)

  NSLayoutManager *layoutManager = _textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange =
  [layoutManager glyphRangeForBoundingRect:boundingBox
                           inTextContainer:textContainer];

  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:_contentFrame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:_contentFrame.origin];

#if !TARGET_OS_OSX // TODO(macOS ISS#3536887)
  UIGraphicsPopContext();
#else
  [NSGraphicsContext restoreGraphicsState];
#endif // TODO(macOS ISS#3536887)
  CGContextRestoreGState(ctx);
}

- (id<CAAction>)actionForLayer:(CALayer *)layer forKey:(NSString *)event
{
  // Disable all implicit animations.
  return (id)[NSNull null];
}

@end
