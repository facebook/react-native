/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTFPSGraph.h>

#import <React/RCTAssert.h>

#if RCT_DEV

@interface RCTFPSGraph ()

@property (nonatomic, strong, readonly) CAShapeLayer *graph;
@property (nonatomic, strong, readonly) UILabel *label;

@end

@implementation RCTFPSGraph {
  CAShapeLayer *_graph;
  UILabel *_label;

  CGFloat *_frames;
  UIColor *_color;

  NSTimeInterval _prevTime;
  NSUInteger _frameCount;
  NSUInteger _FPS;
  NSUInteger _maxFPS;
  NSUInteger _minFPS;
  NSUInteger _length;
  NSUInteger _height;
  CGFloat _scale;
}

- (instancetype)initWithFrame:(CGRect)frame color:(UIColor *)color
{
  if ((self = [super initWithFrame:frame])) {
    _frameCount = -1;
    _prevTime = -1;
    _maxFPS = 0;
    _minFPS = 60;
    _length = (NSUInteger)floor(frame.size.width);
    _height = (NSUInteger)floor(frame.size.height);
    _scale = 60.0 / (CGFloat)_height;
    _frames = calloc(sizeof(CGFloat), _length);
    _color = color;

    [self.layer addSublayer:self.graph];
    [self addSubview:self.label];
  }
  return self;
}

- (void)dealloc
{
  free(_frames);
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (CAShapeLayer *)graph
{
  if (!_graph) {
    _graph = [CAShapeLayer new];
    _graph.frame = self.bounds;
    _graph.backgroundColor = [_color colorWithAlphaComponent:0.2].CGColor;
    _graph.fillColor = _color.CGColor;
  }

  return _graph;
}

- (UILabel *)label
{
  if (!_label) {
    _label = [[UILabel alloc] initWithFrame:self.bounds];
    _label.font = [UIFont boldSystemFontOfSize:13];
    _label.textAlignment = NSTextAlignmentCenter;
  }

  return _label;
}

- (void)onTick:(NSTimeInterval)timestamp
{
  _frameCount++;
  if (_prevTime == -1) {
    _prevTime = timestamp;
  } else if (timestamp - _prevTime >= 1) {
    _FPS = round((double)_frameCount / (timestamp - _prevTime));
    _minFPS = MIN(_minFPS, _FPS);
    _maxFPS = MAX(_maxFPS, _FPS);

    dispatch_async(dispatch_get_main_queue(), ^{
      self->_label.text = [NSString stringWithFormat:@"%lu", (unsigned long)self->_FPS];
    });

    CGFloat previousScale = _scale;
    CGFloat targetFps = MAX(_maxFPS, 60.0);
    _scale = targetFps / (CGFloat)_height;
    for (NSUInteger i = 0; i < _length - 1; i++) {
      // Move each Frame back one position and adjust to new scale (if there is a new scale)
      _frames[i] = _frames[i + 1] * previousScale / _scale;
    }
    _frames[_length - 1] = (double)_FPS / _scale;

    CGMutablePathRef path = CGPathCreateMutable();
    CGPathMoveToPoint(path, NULL, 0, (CGFloat)_height);
    for (NSUInteger i = 0; i < _length; i++) {
      CGPathAddLineToPoint(path, NULL, (CGFloat)i, (double)_height - _frames[i]);
    }
    CGPathAddLineToPoint(path, NULL, (CGFloat)_length - 1, (CGFloat)_height);

    _graph.path = path;
    CGPathRelease(path);

    _prevTime = timestamp;
    _frameCount = 0;
  }
}

@end

#endif
