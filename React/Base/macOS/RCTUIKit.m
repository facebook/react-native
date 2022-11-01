/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS GH#774)

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

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

CGImageRef UIImageGetCGImageRef(NSImage *image)
{
  return [image CGImageForProposedRect:NULL context:NULL hints:NULL];
}

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

NSData *UIImagePNGRepresentation(NSImage *image) {
  return NSImageDataForFileType(image, NSBitmapImageFileTypePNG, @{});
}

NSData *UIImageJPEGRepresentation(NSImage *image, CGFloat compressionQuality) {
  return NSImageDataForFileType(image,
                                NSBitmapImageFileTypeJPEG,
                                @{NSImageCompressionFactor: @(1.0)});
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


@implementation RCTUIView // TODO(macOS ISS#3536887)
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

static RCTUIView *RCTUIViewCommonInit(RCTUIView *self)
{
  if (self != nil) {
    self.wantsLayer = YES;
    self->_userInteractionEnabled = YES;
    self->_enableFocusRing = YES;
  }
  return self;
}

- (instancetype)initWithFrame:(NSRect)frameRect
{
  return RCTUIViewCommonInit([super initWithFrame:frameRect]);
}

- (instancetype)initWithCoder:(NSCoder *)coder
{
  return RCTUIViewCommonInit([super initWithCoder:coder]);
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event
{
  if (self.acceptsFirstMouse || [super acceptsFirstMouse:event]) {
    return YES;
  }

  // If any RCTUIView view above has acceptsFirstMouse set, then return YES here.
  NSView *view = self;
  while ((view = view.superview)) {
    if ([view isKindOfClass:[RCTUIView class]] && [(RCTUIView *)view acceptsFirstMouse]) {
      return YES;
    }
  }

  return NO;
}

- (BOOL)acceptsFirstResponder
{
  return [self canBecomeFirstResponder];
}

- (BOOL)isFirstResponder {
  return [[self window] firstResponder] == self;
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

- (void)layoutIfNeeded
{
  if ([self needsLayout]) {
    [self layout];
  }
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

// We purposely don't use RCTCursor for the parameter type here because it would introduce an import cycle:
// RCTUIKit > RCTCursor > RCTConvert > RCTUIKit
- (void)setCursor:(NSInteger)cursor
{
  // This method is required to be defined due to [RCTVirtualTextViewManager view] returning a RCTUIView.
}

@end

// RCTUIScrollView

@implementation RCTUIScrollView // TODO(macOS ISS#3536887)

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.scrollEnabled = YES;
  }
  
  return self;
}

- (void)setEnableFocusRing:(BOOL)enableFocusRing {
  if (_enableFocusRing != enableFocusRing) {
    _enableFocusRing = enableFocusRing;
  }

  if (enableFocusRing) {
    // NSTextView has no focus ring by default so let's use the standard Aqua focus ring.
    [self setFocusRingType:NSFocusRingTypeExterior];
  } else {
    [self setFocusRingType:NSFocusRingTypeNone];
  }
}

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

BOOL RCTUIViewSetClipsToBounds(RCTPlatformView *view)
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

@implementation RCTClipView

- (instancetype)initWithFrame:(NSRect)frameRect
{
   if (self = [super initWithFrame:frameRect]) {
    self.constrainScrolling = NO;
    self.drawsBackground = NO;
  }
  
  return self;
}

- (NSRect)constrainBoundsRect:(NSRect)proposedBounds
{
  if (self.constrainScrolling) {
    return NSMakeRect(0, 0, 0, 0);
  }
  
  return [super constrainBoundsRect:proposedBounds];
}

@end
