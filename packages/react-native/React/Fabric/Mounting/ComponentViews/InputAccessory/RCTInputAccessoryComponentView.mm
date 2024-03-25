/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInputAccessoryComponentView.h"

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTConversions.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>
#import <react/renderer/components/inputaccessory/InputAccessoryComponentDescriptor.h>
#import <react/renderer/components/rncore/Props.h>
#import "RCTInputAccessoryContentView.h"

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

static UIView<RCTBackedTextInputViewProtocol> *_Nullable RCTFindTextInputWithNativeId(UIView *view, NSString *nativeId)
{
  if ([view respondsToSelector:@selector(inputAccessoryViewID)] &&
      [view respondsToSelector:@selector(setInputAccessoryView:)]) {
    UIView<RCTBackedTextInputViewProtocol> *typed = (UIView<RCTBackedTextInputViewProtocol> *)view;
    if (!nativeId || [typed.inputAccessoryViewID isEqualToString:nativeId]) {
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

@implementation RCTInputAccessoryComponentView {
  InputAccessoryShadowNode::ConcreteState::Shared _state;
  RCTInputAccessoryContentView *_contentView;
  RCTSurfaceTouchHandler *_touchHandler;
  UIView<RCTBackedTextInputViewProtocol> __weak *_textInput;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = InputAccessoryShadowNode::defaultSharedProps();
    _contentView = [RCTInputAccessoryContentView new];
    _touchHandler = [RCTSurfaceTouchHandler new];
    [_touchHandler attachToView:_contentView];
  }

  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_textInput) {
    if (self.nativeId) {
      _textInput = RCTFindTextInputWithNativeId(self.window, self.nativeId);
      _textInput.inputAccessoryView = _contentView;
    } else {
      _textInput = RCTFindTextInputWithNativeId(_contentView, nil);
    }

    if (!self.nativeId) {
      [self becomeFirstResponder];
    }
  }
}

- (BOOL)canBecomeFirstResponder
{
  return true;
}

- (UIView *)inputAccessoryView
{
  return _contentView;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<InputAccessoryComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldInputAccessoryProps = static_cast<const InputAccessoryProps &>(*_props);
  const auto &newInputAccessoryProps = static_cast<const InputAccessoryProps &>(*props);

  if (newInputAccessoryProps.backgroundColor != oldInputAccessoryProps.backgroundColor) {
    _contentView.backgroundColor = RCTUIColorFromSharedColor(newInputAccessoryProps.backgroundColor);
  }

  [super updateProps:props oldProps:oldProps];
  self.hidden = true;
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState
{
  _state = std::static_pointer_cast<InputAccessoryShadowNode::ConcreteState const>(state);
  CGSize oldScreenSize = RCTCGSizeFromSize(_state->getData().viewportSize);
  CGSize viewportSize = RCTViewportSize();
  viewportSize.height = std::nan("");
  if (oldScreenSize.width != viewportSize.width) {
    auto stateData = InputAccessoryState{RCTSizeFromCGSize(viewportSize)};
    _state->updateState(std::move(stateData));
  }
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
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

Class<RCTComponentViewProtocol> RCTInputAccessoryCls(void)
{
  return RCTInputAccessoryComponentView.class;
}
