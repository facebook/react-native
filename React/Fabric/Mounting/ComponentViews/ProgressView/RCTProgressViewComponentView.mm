/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProgressViewComponentView.h"

#import <react/components/rncore/Props.h>
#import <react/components/rncore/ShadowNodes.h>

#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTProgressViewComponentView {
  UIProgressView *_progressView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ProgressViewProps>();
    _props = defaultProps;

    _progressView = [[UIProgressView alloc] initWithFrame:self.bounds];
    _progressView.progress = defaultProps->progress;

    self.contentView = _progressView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return ProgressViewShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldProgressViewProps = *std::static_pointer_cast<const ProgressViewProps>(oldProps ?: _props);
  const auto &newProgressViewProps = *std::static_pointer_cast<const ProgressViewProps>(props);

  [super updateProps:props oldProps:oldProps];

  // `progress`
  if (oldProgressViewProps.progress != newProgressViewProps.progress) {
    _progressView.progress = newProgressViewProps.progress;
  }

  // `trackTintColor`
  if (oldProgressViewProps.trackTintColor != newProgressViewProps.trackTintColor) {
    _progressView.trackTintColor = RCTUIColorFromSharedColor(newProgressViewProps.trackTintColor);
  }

  // `progressTintColor`
  if (oldProgressViewProps.progressTintColor != newProgressViewProps.progressTintColor) {
    _progressView.progressTintColor = RCTUIColorFromSharedColor(newProgressViewProps.progressTintColor);
  }
}

@end
