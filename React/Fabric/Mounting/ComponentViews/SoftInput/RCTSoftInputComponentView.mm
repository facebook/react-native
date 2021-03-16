/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSoftInputComponentView.h"

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTConversions.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <react/renderer/components/softinput/SoftInputComponentDescriptor.h>
#import <react/renderer/components/rncore/Props.h>
#import "RCTSoftInputContentView.h"

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

static UIView<RCTBackedTextInputViewProtocol> *_Nullable RCTFindTextInputWithNativeId(UIView *view, NSString *nativeId)
{
  if ([view respondsToSelector:@selector(softInputViewID)] &&
      [view respondsToSelector:@selector(setInputView:)]) {
    UIView<RCTBackedTextInputViewProtocol> *typed = (UIView<RCTBackedTextInputViewProtocol> *)view;
    if (!nativeId || [typed.softInputViewID isEqualToString:nativeId]) {
      return typed;
    }
  }

  for (UIView *subview in view.subviews) {
    UIView<RCTBackedTextInputViewProtocol> *result = RCTFindTextInputWithNativeId(subview, nativeId);
    if (result) {
      return result;
    }
  }

  return nil;
}

@implementation RCTSoftInputComponentView {
  SoftInputShadowNode::ConcreteState::Shared _state;
  RCTSoftInputContentView *_contentView;
  RCTSurfaceTouchHandler *_touchHandler;
  UIView<RCTBackedTextInputViewProtocol> __weak *_textInput;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SoftInputProps>();
    _props = defaultProps;
    _contentView = [RCTSoftInputContentView new];
    _touchHandler = [RCTSurfaceTouchHandler new];
    [_touchHandler attachToView:_contentView];
  }

  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_textInput) {
    _textInput = RCTFindTextInputWithNativeId(self.window, self.nativeId);
    if (_textInput.showSoftInputOnFocus) {
      _textInput.inputView = _contentView;
    } else {
      _textInput.inputView = [[UIView alloc] init];
    }
  }
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (UIView *)inputView
{
  return _contentView;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SoftInputComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  [super updateProps:props oldProps:oldProps];
  self.hidden = true;
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState
{
  _state = std::static_pointer_cast<SoftInputShadowNode::ConcreteState const>(state);
  CGSize oldScreenSize = RCTCGSizeFromSize(_state->getData().viewportSize);
  CGSize viewportSize = RCTViewportSize();
  viewportSize.height = std::nan("");
  if (oldScreenSize.width != viewportSize.width) {
    auto stateData = SoftInputState{RCTSizeFromCGSize(viewportSize)};
    _state->updateState(std::move(stateData));
  }
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  [_contentView setFrame:RCTCGRectFromRect(layoutMetrics.getContentFrame())];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _textInput = nil;
}

@end

Class<RCTComponentViewProtocol> RCTSoftInputCls(void)
{
  return RCTSoftInputComponentView.class;
}
