/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTFPSGraph.h"

#import "RCTAssert.h"
#import "RCTDefines.h"

#if RCT_DEV

@implementation RCTFPSGraph
{
  CAShapeLayer *_graph;
  NSString *_name;
  NSTimeInterval _prevTime;
  RCTFPSGraphPosition _position;
  UILabel *_label;

  float *_frames;
  int _frameCount;
  int _maxFPS;
  int _minFPS;
  int _length;
  int _margin;
  int _height;
}

- (instancetype)initWithFrame:(CGRect)frame graphPosition:(RCTFPSGraphPosition)position name:(NSString *)name color:(UIColor *)color
{
  if ((self = [super initWithFrame:frame])) {
    _margin = 2;
    _prevTime = -1;
    _maxFPS = 0;
    _minFPS = 60;
    _length = (frame.size.width - 2 * _margin) / 2;
    _height = frame.size.height - 2 * _margin;
    _frames = malloc(sizeof(float) * _length);
    memset(_frames, 0, sizeof(float) * _length);

    _name = name ?: @"FPS";
    _position = position ?: RCTFPSGraphPositionLeft;

    color = color ?: [UIColor greenColor];
    _graph = [self createGraph:color];
    _label = [self createLabel:color];

    [self addSubview:_label];
    [self.layer addSublayer:_graph];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)dealloc
{
  free(_frames);
}

- (void)layoutSubviews
{
  [super layoutSubviews];
}

- (CAShapeLayer *)createGraph:(UIColor *)color
{
  CGFloat left = _position & RCTFPSGraphPositionLeft ? 0 : _length;
  CAShapeLayer *graph = [CAShapeLayer new];
  graph.frame = CGRectMake(left, 0, 2 * _margin + _length, self.frame.size.height);
  graph.backgroundColor = [color colorWithAlphaComponent:0.2].CGColor;
  graph.fillColor = color.CGColor;
  return graph;
}

- (UILabel *)createLabel:(UIColor *)color
{
  CGFloat left = _position & RCTFPSGraphPositionLeft ? 2 * _margin + _length : 0;
  UILabel *label = [[UILabel alloc] initWithFrame:CGRectMake(left, 0, _length, self.frame.size.height)];
  label.textColor = color;
  label.font = [UIFont systemFontOfSize:9];
  label.minimumScaleFactor = .5;
  label.adjustsFontSizeToFitWidth = YES;
  label.numberOfLines = 3;
  label.lineBreakMode = NSLineBreakByWordWrapping;
  label.textAlignment = NSTextAlignmentCenter;
  return label;
}

- (void)onTick:(NSTimeInterval)timestamp
{
  _frameCount++;
  if (_prevTime == -1) {
    _prevTime = timestamp;
  } else if (timestamp - _prevTime > 1) {
    float fps = round(_frameCount / (timestamp - _prevTime));
    _minFPS = MIN(_minFPS, fps);
    _maxFPS = MAX(_maxFPS, fps);

    _label.text = [NSString stringWithFormat:@"%@\n%d FPS\n(%d - %d)", _name, (int)fps, _minFPS, _maxFPS];

    float scale = 60.0 / _height;
    for (int i = 0; i < _length - 1; i++) {
      _frames[i] = _frames[i + 1];
    }
    _frames[_length - 1] = fps / scale;

    CGMutablePathRef path = CGPathCreateMutable();
    if (_position & RCTFPSGraphPositionLeft) {
      CGPathMoveToPoint(path, NULL, _margin, _margin + _height);
      for (int i = 0; i < _length; i++) {
        CGPathAddLineToPoint(path, NULL, _margin + i, _margin + _height - _frames[i]);
      }
      CGPathAddLineToPoint(path, NULL, _margin + _length - 1, _margin + _height);
    } else {
      CGPathMoveToPoint(path, NULL, _margin + _length - 1, _margin + _height);
      for (int i = 0; i < _length; i++) {
        CGPathAddLineToPoint(path, NULL, _margin + _length - i - 1, _margin + _height - _frames[i]);
      }
      CGPathAddLineToPoint(path, NULL, _margin, _margin + _height);
    }
    _graph.path = path;
    CGPathRelease(path);

    _prevTime = timestamp;
    _frameCount = 0;
  }
}

@end

#endif
