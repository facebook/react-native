/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS ISS#2323203)

#import "RCTUIKit.h"

#import <React/RCTAssert.h>

#import <objc/runtime.h>

static char RCTGraphicsContextSizeKey;

//
// semantically equivalent functions
//

// UIGraphics.h

CGContextRef UIGraphicsGetCurrentContext(void)
{
	return [[NSGraphicsContext currentContext] CGContext];
}

void UIGraphicsBeginImageContextWithOptions(CGSize size, __unused BOOL opaque, CGFloat scale)
{
	if (scale == 0.0)
	{
		// TODO: Assert. We can't assume a display scale on macOS
		scale = 1.0;
	}

	size_t width = ceilf(size.width * scale);
	size_t height = ceilf(size.height * scale);

	CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
	CGContextRef ctx = CGBitmapContextCreate(NULL, width, height, 8/*bitsPerComponent*/, width * 4/*bytesPerRow*/, colorSpace, kCGImageAlphaPremultipliedFirst);
	CGColorSpaceRelease(colorSpace);

	if (ctx != NULL)
	{
		// flip the context (top left at 0, 0) and scale it
		CGContextTranslateCTM(ctx, 0.0, height);
		CGContextScaleCTM(ctx, scale, -scale);

		NSGraphicsContext *graphicsContext = [NSGraphicsContext graphicsContextWithCGContext:ctx flipped:YES];
		objc_setAssociatedObject(graphicsContext, &RCTGraphicsContextSizeKey, [NSValue valueWithSize:size], OBJC_ASSOCIATION_COPY_NONATOMIC);

		[NSGraphicsContext saveGraphicsState];
		[NSGraphicsContext setCurrentContext:graphicsContext];

		CFRelease(ctx);
	}
}

NSImage *UIGraphicsGetImageFromCurrentImageContext(void)
{
	NSImage *image = nil;
	NSGraphicsContext *graphicsContext = [NSGraphicsContext currentContext];

	NSValue *sizeValue = objc_getAssociatedObject(graphicsContext, &RCTGraphicsContextSizeKey);
	if (sizeValue != nil) {
		CGImageRef cgImage = CGBitmapContextCreateImage([graphicsContext CGContext]);

		if (cgImage != NULL) {
			image = [[NSImage alloc] initWithCGImage:cgImage size:[sizeValue sizeValue]];
			CFRelease(cgImage);
		}
	}

	return image;
}

void UIGraphicsEndImageContext(void)
{
	RCTAssert(objc_getAssociatedObject([NSGraphicsContext currentContext], &RCTGraphicsContextSizeKey), @"The current graphics context is not a React image context!");
	[NSGraphicsContext restoreGraphicsState];
}

//
// functionally equivalent types
//

// UIImage

static NSData *NSImageDataForFileType(NSImage *image, NSBitmapImageFileType fileType, NSDictionary<NSString *, id> *properties)
{
  RCTAssert(image.representations.count == 1, @"Expected only a single representation since UIImage only supports one.");

  NSBitmapImageRep *imageRep = (NSBitmapImageRep *)image.representations.firstObject;
  if (![imageRep isKindOfClass:[NSBitmapImageRep class]]) {
    RCTAssert([imageRep isKindOfClass:[NSBitmapImageRep class]], @"We need an NSBitmapImageRep to create an image.");
    return nil;
  }

  return [imageRep representationUsingType:fileType properties:properties];
}

CGFloat UIImageGetScale(NSImage *image)
{
  if (image == nil) {
    return 0.0;
  }
  
  RCTAssert(image.representations.count == 1, @"The scale can only be derived if the image has one representation.");

  NSImageRep *imageRep = image.representations.firstObject;
  if (imageRep != nil) {
    NSSize imageSize = image.size;
    NSSize repSize = CGSizeMake(imageRep.pixelsWide, imageRep.pixelsHigh);

    return round(fmax(repSize.width / imageSize.width, repSize.height / imageSize.height));
  }

  return 1.0;
}

NSData *UIImagePNGRepresentation(NSImage *image)
{
  return NSImageDataForFileType(image, NSBitmapImageFileTypePNG, @{});
}

NSData *UIImageJPEGRepresentation(NSImage *image, CGFloat compressionQuality)
{
  return NSImageDataForFileType(image, NSBitmapImageFileTypeJPEG, @{NSImageCompressionFactor : @(compressionQuality)});
}

CGImageRef UIImageGetCGImageRef(NSImage *image)
{
  return [image CGImageForProposedRect:NULL context:NULL hints:NULL];
}

// UIBezierPath
UIBezierPath *UIBezierPathWithRoundedRect(CGRect rect, CGFloat cornerRadius)
{
  return [NSBezierPath bezierPathWithRoundedRect:rect xRadius:cornerRadius yRadius:cornerRadius];
}

void UIBezierPathAppendPath(UIBezierPath *path, UIBezierPath *appendPath)
{
  return [path appendBezierPath:appendPath];
}

CGPathRef UIBezierPathCreateCGPathRef(UIBezierPath *bezierPath)
{
  CGPathRef immutablePath = NULL;
  
  // Draw the path elements.
  NSInteger numElements = [bezierPath elementCount];
  if (numElements > 0)
  {
    CGMutablePathRef    path = CGPathCreateMutable();
    NSPoint             points[3];
    BOOL                didClosePath = YES;
    
    for (NSInteger i = 0; i < numElements; i++)
    {
      switch ([bezierPath elementAtIndex:i associatedPoints:points])
      {
        case NSMoveToBezierPathElement:
          CGPathMoveToPoint(path, NULL, points[0].x, points[0].y);
          break;
          
        case NSLineToBezierPathElement:
          CGPathAddLineToPoint(path, NULL, points[0].x, points[0].y);
          didClosePath = NO;
          break;
          
        case NSCurveToBezierPathElement:
          CGPathAddCurveToPoint(path, NULL, points[0].x, points[0].y,
                                points[1].x, points[1].y,
                                points[2].x, points[2].y);
          didClosePath = NO;
          break;
          
        case NSClosePathBezierPathElement:
          CGPathCloseSubpath(path);
          didClosePath = YES;
          break;
      }
    }
    
    // Be sure the path is closed or Quartz may not do valid hit detection.
    if (!didClosePath)
      CGPathCloseSubpath(path);
    
    immutablePath = CGPathCreateCopy(path);
    CGPathRelease(path);
  }
  
  return immutablePath;
}

//
// substantially different types
//

// UIView

@interface UIView ()

@end

@implementation UIView
{
@private
  NSColor *_backgroundColor;
  BOOL _clipsToBounds;
  BOOL _opaque;
  BOOL _userInteractionEnabled;
}

+ (NSSet<NSString *> *)keyPathsForValuesAffectingValueForKey:(NSString *)key
{
  NSSet<NSString *> *keyPaths = [super keyPathsForValuesAffectingValueForKey:key];
  NSString *alternatePath = nil;

  // alpha is a wrapper for alphaValue
  if ([key isEqualToString:@"alpha"]) {
    alternatePath = @"alphaValue";
  // isAccessibilityElement is a wrapper for accessibilityElement
  } else if ([key isEqualToString:@"isAccessibilityElement"]) {
    alternatePath = @"accessibilityElement";
  }

  if (alternatePath != nil) {
    keyPaths = keyPaths != nil ? [keyPaths setByAddingObject:alternatePath] : [NSSet setWithObject:alternatePath];
  }

  return keyPaths;
}

static UIView *UIViewCommonInit(UIView *self)
{
  if (self != nil) {
    self.wantsLayer = YES;
    self->_userInteractionEnabled = YES;

  }
  return self;
}

- (instancetype)initWithFrame:(NSRect)frameRect
{
  return UIViewCommonInit([super initWithFrame:frameRect]);
}

- (instancetype)initWithCoder:(NSCoder *)coder
{
  return UIViewCommonInit([super initWithCoder:coder]);
}

- (BOOL)acceptsFirstResponder
{
  return [self canBecomeFirstResponder];
}

- (void)viewDidMoveToWindow
{
  [self didMoveToWindow];
}

- (BOOL)isFlipped
{
  return YES;
}

- (BOOL)isOpaque
{
  return _opaque;
}

- (CGFloat)alpha
{
  return self.alphaValue;
}

- (void)setAlpha:(CGFloat)alpha
{
  self.alphaValue = alpha;
}


- (CGAffineTransform)transform
{
  return self.layer.affineTransform;
}

- (void)setTransform:(CGAffineTransform)transform
{
  self.layer.affineTransform = transform;
}

- (NSView *)hitTest:(NSPoint)point
{
  return [self hitTest:NSPointToCGPoint(point) withEvent:nil];
}

- (BOOL)wantsUpdateLayer
{
  return [self respondsToSelector:@selector(displayLayer:)];
}

- (void)updateLayer
{
  CALayer *layer = [self layer];
  if (_backgroundColor) {
    // updateLayer will be called when the view's current appearance changes.
    // The layer's backgroundColor is a CGColor which is not appearance aware
    // so it has to be reset from the view's NSColor ivar.
    [layer setBackgroundColor:[_backgroundColor CGColor]];
  }
  [(id<CALayerDelegate>)self displayLayer:layer];
}

- (void)drawRect:(CGRect)rect
{
  if (_backgroundColor) {
    [_backgroundColor set];
    NSRectFill(rect);
  }
  [super drawRect:rect];
}

- (void)layout
{
  if (self.window != nil) {
    [self layoutSubviews];
  }
}

- (BOOL)canBecomeFirstResponder
{
  return [super acceptsFirstResponder];
}

- (BOOL)becomeFirstResponder
{
  return [[self window] makeFirstResponder:self];
}

@synthesize userInteractionEnabled = _userInteractionEnabled;

- (NSView *)hitTest:(CGPoint)point withEvent:(__unused UIEvent *)event
{
  return self.userInteractionEnabled ? [super hitTest:NSPointFromCGPoint(point)] : nil;
}

- (BOOL)pointInside:(CGPoint)point withEvent:(__unused UIEvent *)event
{
  return self.userInteractionEnabled ? NSPointInRect(NSPointFromCGPoint(point), self.bounds) : NO;
}

- (void)insertSubview:(NSView *)view atIndex:(NSInteger)index
{
  NSArray<__kindof NSView *> *subviews = self.subviews;
  if ((NSUInteger)index == subviews.count) {
    [self addSubview:view];
  } else {
    [self addSubview:view positioned:NSWindowBelow relativeTo:subviews[index]];
  }
}

- (void)didMoveToWindow
{
  [super viewDidMoveToWindow];
}

- (void)setNeedsLayout
{
  self.needsLayout = YES;
}

- (void)layoutSubviews
{
  [super layout];
}

- (void)setNeedsDisplay
{
  self.needsDisplay = YES;
}

@synthesize clipsToBounds = _clipsToBounds;

@synthesize backgroundColor = _backgroundColor;

- (void)setBackgroundColor:(NSColor *)backgroundColor
{
  if (_backgroundColor != backgroundColor && ![_backgroundColor isEqual:backgroundColor])
  {
    _backgroundColor = [backgroundColor copy];
    [self setNeedsDisplay:YES];
  }
}

@end

// UIScrollView

@implementation UIScrollView

// UIScrollView properties missing from NSScrollView
- (CGPoint)contentOffset
{
  return self.documentVisibleRect.origin;
}

- (void)setContentOffset:(CGPoint)contentOffset
{
  [self.documentView scrollPoint:contentOffset];
}

- (UIEdgeInsets)contentInset
{
  return super.contentInsets;
}

- (void)setContentInset:(UIEdgeInsets)insets
{
  super.contentInsets = insets;
}

- (CGSize)contentSize
{
  return self.documentView.frame.size;
}

- (void)setContentSize:(CGSize)contentSize
{
  CGRect frame = self.documentView.frame;
  frame.size = contentSize;
  self.documentView.frame = frame;
}

- (BOOL)showsHorizontalScrollIndicator
{
	return self.hasHorizontalScroller;
}

- (void)setShowsHorizontalScrollIndicator:(BOOL)show
{
	self.hasHorizontalScroller = show;
}

- (BOOL)showsVerticalScrollIndicator
{
	return self.hasVerticalScroller;
}

- (void)setShowsVerticalScrollIndicator:(BOOL)show
{
	self.hasVerticalScroller = show;
}

- (UIEdgeInsets)scrollIndicatorInsets
{
	return self.scrollerInsets;
}

- (void)setScrollIndicatorInsets:(UIEdgeInsets)insets
{
	self.scrollerInsets = insets;
}

- (CGFloat)zoomScale
{
  return self.magnification;
}

- (void)setZoomScale:(CGFloat)zoomScale
{
  self.magnification = zoomScale;
}

- (BOOL)alwaysBounceHorizontal
{
  return self.horizontalScrollElasticity != NSScrollElasticityNone;
}

- (void)setAlwaysBounceHorizontal:(BOOL)alwaysBounceHorizontal
{
  self.horizontalScrollElasticity = alwaysBounceHorizontal ? NSScrollElasticityAllowed : NSScrollElasticityNone;
}

- (BOOL)alwaysBounceVertical
{
  return self.verticalScrollElasticity != NSScrollElasticityNone;
}

- (void)setAlwaysBounceVertical:(BOOL)alwaysBounceVertical
{
  self.verticalScrollElasticity = alwaysBounceVertical ? NSScrollElasticityAllowed : NSScrollElasticityNone;
}

@end

BOOL UIViewSetClipsToBounds(RCTPlatformView *view)
{
  // NSViews are always clipped to bounds
  BOOL clipsToBounds = YES;

  // But see if UIView overrides that behavior
  if ([view respondsToSelector:@selector(clipsToBounds)])
  {
    clipsToBounds = [(id)view clipsToBounds];
  }

  return clipsToBounds;
}

static BOOL UIViewIsFieldEditor(RCTPlatformView *view)
{
  if ([view isKindOfClass:[NSText class]]) {
    NSText *textObj = (NSText *) view;
    return [textObj isFieldEditor];
  }
  return NO;
}

static BOOL UIViewDescendantIsFieldEditor(RCTPlatformView *root)
{
  return UIViewHasDescendantPassingPredicate(root, ^BOOL(RCTPlatformView *view) {
    return UIViewIsFieldEditor(view);
  });
}

static RCTPlatformView *UIViewDescendantPassingPredicate_DFS(RCTPlatformView *root, BOOL (^predicate)(RCTPlatformView *view))
{
  if (!root || !predicate) {
    return nil;
  }

  if (predicate(root)) {
    return root;
  }

  for (RCTPlatformView *subview in [root subviews]) {
    RCTPlatformView *passingView = UIViewDescendantPassingPredicate_DFS(subview, predicate);

    if (passingView) {
      return passingView;
    }
  }

  return nil;
}

BOOL UIViewHasDescendantPassingPredicate(RCTPlatformView *root, BOOL (^predicate)(RCTPlatformView *view))
{
  return UIViewDescendantPassingPredicate_DFS(root, predicate) != nil;
}

static void UIViewCalculateKeyViewLoopInternal(RCTPlatformView *root, NSMutableArray *keyViewLoop)
{
  for (RCTPlatformView *view in root.subviews) {
    UIViewCalculateKeyViewLoopInternal(view, keyViewLoop);
  }
  if ([root canBecomeKeyView]) {
    BOOL include = YES;
    
    /*
     
     When dealing with the field editor and the key view loop, we want to take special
     care to include the text control that is being edited, while skipping over the view
     subtree that contains the field editor itself. The field editor manages focus/blur
     events, and shouldn't be included in the key view loop.
     
     A typical construction looks like:
     
     NSTextField <-- Field being edited. We want to include this in the key view loop.
       |
       _NSKeyboardFocusClipView	<-- Field editor's superview. Not included.
         |
         NSTextView <-- The field editor. We do not want this in the key view loop.
     
     */
    if (UIViewDescendantIsFieldEditor(root)) {
      BOOL isEditedControl = [root isKindOfClass:[NSControl class]] ? ([(NSControl *) root currentEditor] != nil) : NO;
      
      if (!isEditedControl) {
        include = NO;
      }
    }
    if (include) {
      [keyViewLoop addObject:root];
    }
  }
}

NSArray *UIViewCalculateKeyViewLoop(RCTPlatformView *root)
{
  NSMutableArray *keyViewLoop = [NSMutableArray array];
  UIViewCalculateKeyViewLoopInternal(root, keyViewLoop);
  // Avoid returning self-referential single-link loops
  if ([keyViewLoop count] == 1 && [keyViewLoop firstObject] == root) {
    return nil;
  }
  return keyViewLoop;
}
