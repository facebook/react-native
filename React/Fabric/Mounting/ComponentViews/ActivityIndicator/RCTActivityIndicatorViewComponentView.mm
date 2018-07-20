/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTActivityIndicatorViewComponentView.h"

#import <fabric/components/activityindicator/ActivityIndicatorViewProps.h>

using namespace facebook::react;

static UIActivityIndicatorViewStyle convertActivityIndicatorViewStyle(const ActivityIndicatorViewSize &size) {
  switch (size) {
    case ActivityIndicatorViewSize::Small:
      return UIActivityIndicatorViewStyleWhite;
    case ActivityIndicatorViewSize::Large:
      return UIActivityIndicatorViewStyleWhiteLarge;
  }
}

@implementation RCTActivityIndicatorViewComponentView {
  UIActivityIndicatorView *_activityIndicatorView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _activityIndicatorView = [[UIActivityIndicatorView alloc] initWithFrame:self.bounds];
    _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    const auto &defaultProps = ActivityIndicatorViewProps();

    if (defaultProps.animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
    _activityIndicatorView.color = [UIColor colorWithCGColor:defaultProps.color.get()];
    _activityIndicatorView.hidesWhenStopped = defaultProps.hidesWhenStopped;
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(defaultProps.size);

    [self addSubview:_activityIndicatorView];
  }

  return self;
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<ActivityIndicatorViewProps>();
  }
  _props = props;

  [super updateProps:props oldProps:oldProps];

  auto oldViewProps = *std::dynamic_pointer_cast<const ActivityIndicatorViewProps>(oldProps);
  auto newViewProps = *std::dynamic_pointer_cast<const ActivityIndicatorViewProps>(props);

  if (oldViewProps.animating != newViewProps.animating) {
    if (newViewProps.animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
  }

  if (oldViewProps.color.get() != newViewProps.color.get()) {
    _activityIndicatorView.color = [UIColor colorWithCGColor:newViewProps.color.get()];
  }

  // TODO: This prop should be deprecated.
  if (oldViewProps.hidesWhenStopped != newViewProps.hidesWhenStopped) {
    _activityIndicatorView.hidesWhenStopped = newViewProps.hidesWhenStopped;
  }

  if (oldViewProps.size != newViewProps.size) {
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(newViewProps.size);
  }
}

@end
