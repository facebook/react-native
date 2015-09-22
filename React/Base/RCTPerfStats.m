/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPerfStats.h"

#import "RCTDefines.h"
#import "RCTUtils.h"

#if RCT_DEV

@interface RCTPerfStats() <RCTBridgeModule>

@end

@implementation RCTPerfStats
{
  UIView *_container;
}

RCT_EXPORT_MODULE()

- (void)dealloc
{
  [self hide];
}

- (UIView *)container
{
  if (!_container) {
    _container = [UIView new];
    _container.backgroundColor = [UIColor colorWithRed:0 green:0 blue:34/255.0 alpha:1];
    _container.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleWidth;
  }
  return _container;
}

- (RCTFPSGraph *)jsGraph
{
  if (!_jsGraph && _container) {
    UIColor *jsColor = [UIColor colorWithRed:0 green:1 blue:0 alpha:1];
    _jsGraph = [[RCTFPSGraph alloc] initWithFrame:CGRectMake(2, 2, 124, 34)
                                    graphPosition:RCTFPSGraphPositionRight
                                             name:@"[ JS ]"
                                            color:jsColor];
    _jsGraph.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  }
  return _jsGraph;
}

- (RCTFPSGraph *)uiGraph
{
  if (!_uiGraph && _container) {
    UIColor *uiColor = [UIColor colorWithRed:0 green:1 blue:1 alpha:1];
    _uiGraph = [[RCTFPSGraph alloc] initWithFrame:CGRectMake(2, 2, 124, 34)
                                    graphPosition:RCTFPSGraphPositionLeft
                                             name:@"[ UI ]"
                                            color:uiColor];
  }
  return _uiGraph;
}

- (void)show
{
  if (RCTRunningInAppExtension()) {
    return;
  }
  
  UIView *targetView = RCTSharedApplication().delegate.window.rootViewController.view;

  targetView.frame = (CGRect){
    targetView.frame.origin,
    {
      targetView.frame.size.width,
      targetView.frame.size.height - 38,
    }
  };

  self.container.frame = (CGRect){{0, targetView.frame.size.height}, {targetView.frame.size.width, 38}};
  self.jsGraph.frame = (CGRect){
    {
      targetView.frame.size.width - self.uiGraph.frame.size.width - self.uiGraph.frame.origin.x,
      self.uiGraph.frame.origin.x,
    },
    self.uiGraph.frame.size,
  };

  [self.container addSubview:self.jsGraph];
  [self.container addSubview:self.uiGraph];
  [targetView addSubview:self.container];
}

- (void)hide
{
  UIView *targetView = _container.superview;

  targetView.frame = (CGRect){
    targetView.frame.origin,
    {
      targetView.frame.size.width,
      targetView.frame.size.height + _container.frame.size.height
    }
  };

  [_container removeFromSuperview];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

@end

@implementation RCTBridge (RCTPerfStats)

- (RCTPerfStats *)perfStats
{
  return self.modules[RCTBridgeModuleNameForClass([RCTPerfStats class])];
}

@end

#else

@implementation RCTPerfStats

- (void)show {}
- (void)hide {}

@end

@implementation RCTBridge (RCTPerfStats)

- (RCTPerfStats *)perfStats
{
  return nil;
}

@end

#endif
