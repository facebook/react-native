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

static RCTUIView<RCTBackedTextInputViewProtocol> *_Nullable RCTFindTextInputWithNativeId(RCTUIView *view, NSString *nativeId) // TODO(macOS GH#774)
{
  if ([view respondsToSelector:@selector(inputAccessoryViewID)] &&
      [view respondsToSelector:@selector(setInputAccessoryView:)]) {
    RCTUIView<RCTBackedTextInputViewProtocol> *typed = (RCTUIView<RCTBackedTextInputViewProtocol> *)view; // TODO(macOS GH#774)
    if (!nativeId || [typed.inputAccessoryViewID isEqualToString:nativeId]) {
      return typed;
    }
  }

  for (RCTUIView *subview in view.subviews) { // TODO(macOS GH#774)
    RCTUIView<RCTBackedTextInputViewProtocol> *result = RCTFindTextInputWithNativeId(subview, nativeId); // TODO(macOS GH#774)
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
  RCTUIView<RCTBackedTextInputViewProtocol> __weak *_textInput; // TODO(macOS GH#774)
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const InputAccessoryProps>();
    _props = defaultProps;
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

- (RCTUIView *)inputAccessoryView // TODO(macOS GH#774)
{
  return _contentView;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<InputAccessoryComponentDescriptor>();
}

- (void)mountChildComponentView:(RCTUIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index // TODO(macOS GH#774)
{
  [_contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(RCTUIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index // TODO(macOS GH#774)
{
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(_props);
  auto const &newInputAccessoryProps = *std::static_pointer_cast<InputAccessoryProps const>(props);

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

Class<RCTComponentViewProtocol> RCTInputAccessoryCls(void)
{
  return RCTInputAccessoryComponentView.class;
}
