/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"

#import <react/components/text/ParagraphComponentDescriptor.h>
#import <react/components/text/ParagraphProps.h>
#import <react/components/text/ParagraphState.h>
#import <react/components/text/RawTextComponentDescriptor.h>
#import <react/components/text/TextComponentDescriptor.h>
#import <react/core/LocalData.h>
#import <react/graphics/Geometry.h>
#import <react/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/textlayoutmanager/TextLayoutManager.h>
#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTParagraphComponentView {
  ParagraphShadowNode::ConcreteState::Shared _state;
  ParagraphAttributes _paragraphAttributes;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ParagraphProps>();
    _props = defaultProps;

    self.isAccessibilityElement = YES;
    self.accessibilityTraits |= UIAccessibilityTraitStaticText;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ParagraphComponentDescriptor>();
}

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {concreteComponentDescriptorProvider<RawTextComponentDescriptor>(),
          concreteComponentDescriptorProvider<TextComponentDescriptor>()};
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &paragraphProps = std::static_pointer_cast<const ParagraphProps>(props);

  assert(paragraphProps);
  _paragraphAttributes = paragraphProps->paragraphAttributes;

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<ParagraphShadowNode::ConcreteState const>(state);
  [self setNeedsDisplay];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
}

- (void)drawRect:(CGRect)rect
{
  if (!_state) {
    return;
  }

  SharedTextLayoutManager textLayoutManager = _state->getData().layoutManager;
  RCTTextLayoutManager *nativeTextLayoutManager =
      (__bridge RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();

  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_state->getData().attributedString
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel = RCTNSStringFromStringNilIfEmpty(_props->accessibilityLabel);
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_state) {
    return nil;
  }

  return RCTNSStringFromString(_state->getData().attributedString.getString());
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_state) {
    return _eventEmitter;
  }

  SharedTextLayoutManager textLayoutManager = _state->getData().layoutManager;
  RCTTextLayoutManager *nativeTextLayoutManager =
      (__bridge RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();
  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  SharedEventEmitter eventEmitter =
      [nativeTextLayoutManager getEventEmitterWithAttributeString:_state->getData().attributedString
                                              paragraphAttributes:_paragraphAttributes
                                                            frame:frame
                                                          atPoint:point];

  if (!eventEmitter) {
    return _eventEmitter;
  }

  assert(std::dynamic_pointer_cast<const TouchEventEmitter>(eventEmitter));
  return std::static_pointer_cast<const TouchEventEmitter>(eventEmitter);
}

@end
