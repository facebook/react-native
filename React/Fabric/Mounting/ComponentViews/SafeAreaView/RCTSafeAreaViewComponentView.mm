/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaViewComponentView.h"

#import <react/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <react/components/safeareaview/SafeAreaViewState.h>
#import "RCTConversions.h"

using namespace facebook::react;

static UIScrollView *findScrollView(UIView *view, uint recursionDepth = 0)
{
  if (recursionDepth >= 3) {
    return NULL;
  }
  if ([view isKindOfClass:[UIScrollView class]]) {
    return (UIScrollView *)view;
  }

  if (view.subviews.count >= 1) {
    for (UIView *subview in view.subviews) {
      UIScrollView *scrollView = findScrollView(subview.subviews.firstObject, recursionDepth + 1);
      if (scrollView) {
        return scrollView;
      }
    }
  }

  return NULL;
}

@implementation RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SafeAreaViewProps>();
    _props = defaultProps;
    self.clipsToBounds = YES;
  }

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  UIScrollView *scrollView = findScrollView(self);
  if (scrollView && CGSizeEqualToSize(scrollView.bounds.size, self.bounds.size)) {
    [scrollView setContentInset:self.safeAreaInsets];
  } else {
    if (_state != nullptr) {
      CGSize size = self.bounds.size;
      size.height -= self.safeAreaInsets.bottom;
      auto newState = SafeAreaViewState{RCTSizeFromCGSize(size)};
      _state->updateState(std::move(newState));
    }
  }
}

#pragma mark - RCTComponentViewProtocol

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(state);
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

@end
