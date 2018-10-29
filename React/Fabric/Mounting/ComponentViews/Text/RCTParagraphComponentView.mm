/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"

#import <fabric/components/text/ParagraphLocalData.h>
#import <fabric/components/text/ParagraphProps.h>
#import <fabric/core/LocalData.h>
#import <fabric/graphics/Geometry.h>
#import <fabric/textlayoutmanager/TextLayoutManager.h>
#import <fabric/textlayoutmanager/RCTTextLayoutManager.h>
#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTParagraphComponentView {
  SharedParagraphLocalData _paragraphLocalData;
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

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &paragraphProps = std::static_pointer_cast<const ParagraphProps>(props);

  [super updateProps:props oldProps:oldProps];

  assert(paragraphProps);
  _paragraphAttributes = paragraphProps->paragraphAttributes;
}

- (void)updateLocalData:(SharedLocalData)localData
           oldLocalData:(SharedLocalData)oldLocalData
{
  _paragraphLocalData = std::static_pointer_cast<const ParagraphLocalData>(localData);
  assert(_paragraphLocalData);
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  if (!_paragraphLocalData) {
    return;
  }

  SharedTextLayoutManager textLayoutManager =
    _paragraphLocalData->getTextLayoutManager();
  RCTTextLayoutManager *nativeTextLayoutManager =
    (__bridge RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();

  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_paragraphLocalData->getAttributedString()
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *superAccessibilityLabel =
    RCTNSStringFromStringNilIfEmpty(_props->accessibilityLabel);
  if (superAccessibilityLabel) {
    return superAccessibilityLabel;
  }

  if (!_paragraphLocalData) {
    return nil;
  }

  return RCTNSStringFromString(_paragraphLocalData->getAttributedString().getString());
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_paragraphLocalData) {
    return _eventEmitter;
  }

  SharedTextLayoutManager textLayoutManager = _paragraphLocalData->getTextLayoutManager();
  RCTTextLayoutManager *nativeTextLayoutManager = (__bridge RCTTextLayoutManager *)textLayoutManager->getNativeTextLayoutManager();
  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  SharedShadowNode textShadowNode = [nativeTextLayoutManager getParentShadowNodeWithAttributeString:_paragraphLocalData->getAttributedString()
                                                                                paragraphAttributes:_paragraphAttributes
                                                                                              frame:frame
                                                                                            atPoint:point];

  if (!textShadowNode) {
    return _eventEmitter;
  }

  SharedEventEmitter eventEmitter = textShadowNode->getEventEmitter();
  assert(std::dynamic_pointer_cast<const TouchEventEmitter>(eventEmitter));
  return std::static_pointer_cast<const TouchEventEmitter>(eventEmitter);
}

 @end
