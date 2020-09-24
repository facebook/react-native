/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"
#import "RCTParagraphComponentAccessibilityProvider.h"

#import <react/renderer/components/text/ParagraphComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/ParagraphState.h>
#import <react/renderer/components/text/RawTextComponentDescriptor.h>
#import <react/renderer/components/text/TextComponentDescriptor.h>
#import <react/renderer/graphics/Geometry.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTParagraphComponentView {
  ParagraphShadowNode::ConcreteStateTeller _stateTeller;
  ParagraphAttributes _paragraphAttributes;
  RCTParagraphComponentAccessibilityProvider *_accessibilityProvider;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ParagraphProps>();
    _props = defaultProps;

    self.isAccessibilityElement = YES;
    self.opaque = NO;
    self.contentMode = UIViewContentModeRedraw;
  }

  return self;
}

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; attributedText = %@>", superDescription, self.attributedText];
}

- (NSAttributedString *_Nullable)attributedText
{
  auto data = _stateTeller.getData();
  if (!data.hasValue()) {
    return nil;
  }

  return RCTNSAttributedStringFromAttributedString(data.value().attributedString);
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
  _stateTeller.setConcreteState(state);
  [self setNeedsDisplay];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _stateTeller.invalidate();
}

- (void)drawRect:(CGRect)rect
{
  auto data = _stateTeller.getData();
  if (!data.hasValue()) {
    return;
  }

  auto textLayoutManager = data.value().layoutManager;
  assert(textLayoutManager && "TextLayoutManager must not be `nullptr`.");

  if (!textLayoutManager) {
    return;
  }

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());

  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:data.value().attributedString
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

  auto data = _stateTeller.getData();

  if (!data.hasValue()) {
    return nil;
  }

  return RCTNSStringFromString(data.value().attributedString.getString());
}

- (NSArray *)accessibilityElements
{
  auto data = _stateTeller.getData().value();
  if (![_accessibilityProvider isUpToDate:data.attributedString]) {
    RCTTextLayoutManager *textLayoutManager =
        (RCTTextLayoutManager *)unwrapManagedObject(data.layoutManager->getNativeTextLayoutManager());
    CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
    _accessibilityProvider = [[RCTParagraphComponentAccessibilityProvider alloc] initWithString:data.attributedString
                                                                                  layoutManager:textLayoutManager
                                                                            paragraphAttributes:data.paragraphAttributes
                                                                                          frame:frame
                                                                                           view:self];
  }

  self.isAccessibilityElement = NO;
  return _accessibilityProvider.accessibilityElements;
}

- (UIAccessibilityTraits)accessibilityTraits
{
  return [super accessibilityTraits] | UIAccessibilityTraitStaticText;
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  auto data = _stateTeller.getData();
  if (!data.hasValue()) {
    return _eventEmitter;
  }

  auto textLayoutManager = data.value().layoutManager;

  assert(textLayoutManager && "TextLayoutManager must not be `nullptr`.");

  if (!textLayoutManager) {
    return _eventEmitter;
  }

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  auto eventEmitter = [nativeTextLayoutManager getEventEmitterWithAttributeString:data.value().attributedString
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

Class<RCTComponentViewProtocol> RCTParagraphCls(void)
{
  return RCTParagraphComponentView.class;
}
