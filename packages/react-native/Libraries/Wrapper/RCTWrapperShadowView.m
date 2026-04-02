/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperShadowView.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTBridge.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTUIManager.h>

#import "RCTWrapperView.h"

@implementation RCTWrapperShadowView {
  __weak RCTBridge *_bridge;
  RCTWrapperMeasureBlock _measureBlock;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    YGNodeSetMeasureFunc(self.yogaNode, RCTWrapperShadowViewMeasure);
  }

  return self;
}

static YGSize RCTWrapperShadowViewMeasure(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode)
{
  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = width;
      maximumSize.width = width;
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = width;
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = height;
      maximumSize.height = height;
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = height;
      break;
  }

  RCTWrapperShadowView *shadowView = (__bridge RCTWrapperShadowView *)YGNodeGetContext(node);
  CGSize size = [shadowView measureWithMinimumSize:minimumSize maximumSize:maximumSize];

  return (YGSize){RCTYogaFloatFromCoreGraphicsFloat(size.width), RCTYogaFloatFromCoreGraphicsFloat(size.height)};
}

- (CGSize)measureWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  dispatch_time_t timeout = dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC);

  if (!_measureBlock) {
    RCTBridge *bridge = _bridge;
    __block RCTWrapperMeasureBlock measureBlock;
    NSNumber *reactTag = self.reactTag;

    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    dispatch_async(dispatch_get_main_queue(), ^{
      RCTUIManager *uiManager = bridge.uiManager;
      RCTWrapperView *view = (RCTWrapperView *)[uiManager viewForReactTag:reactTag];
      measureBlock = view.measureBlock;

      dispatch_semaphore_signal(semaphore);
    });

    if (dispatch_semaphore_wait(semaphore, timeout)) {
      RCTLogError(@"Unable to retrieve `measureBlock` for view (%@) because the main thread is busy.", self);
    }

    _measureBlock = measureBlock;
  }

  if (!_measureBlock) {
    return maximumSize;
  }

  __block CGSize size = maximumSize;

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

  dispatch_async(dispatch_get_main_queue(), ^{
    size = self->_measureBlock(minimumSize, maximumSize);
    dispatch_semaphore_signal(semaphore);
  });

  if (dispatch_semaphore_wait(semaphore, timeout)) {
    RCTLogError(@"Unable to compute layout for view (%@) because the main thread is busy.", self);
  }

  return size;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (CGSize)intrinsicContentSize
{
  return _intrinsicContentSize;
}

- (void)setIntrinsicContentSize:(CGSize)size
{
  _intrinsicContentSize = size;
  YGNodeMarkDirty(self.yogaNode);
}

@end

#endif // RCT_REMOVE_LEGACY_ARCH
