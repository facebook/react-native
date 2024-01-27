/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"
#import "RCTParagraphComponentAccessibilityProvider.h"

#if !TARGET_OS_OSX // [macOS]
#import <MobileCoreServices/UTCoreTypes.h>
#endif // [macOS]

#import <react/renderer/components/text/ParagraphComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/ParagraphState.h>
#import <react/renderer/components/text/RawTextComponentDescriptor.h>
#import <react/renderer/components/text/TextComponentDescriptor.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

#if !TARGET_OS_OSX // [macOS]
@interface RCTParagraphComponentView () <UIEditMenuInteractionDelegate>

@property (nonatomic, nullable) UIEditMenuInteraction *editMenuInteraction API_AVAILABLE(ios(16.0));

@end
#endif // [macOS]

@implementation RCTParagraphComponentView {
  ParagraphShadowNode::ConcreteState::Shared _state;
  ParagraphAttributes _paragraphAttributes;
  RCTParagraphComponentAccessibilityProvider *_accessibilityProvider;
#if !TARGET_OS_OSX // [macOS]
  UILongPressGestureRecognizer *_longPressGestureRecognizer;
#endif // [macOS]
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ParagraphProps>();
    _props = defaultProps;

#if !TARGET_OS_OSX  // [macOS]
    self.contentMode = UIViewContentModeRedraw;
    self.opaque = NO;
#endif  // [macOS]
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
  if (!_state) {
    return nil;
  }

  return RCTNSAttributedStringFromAttributedString(_state->getData().attributedString);
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ParagraphComponentDescriptor>();
}

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {
      concreteComponentDescriptorProvider<RawTextComponentDescriptor>(),
      concreteComponentDescriptorProvider<TextComponentDescriptor>()};
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldParagraphProps = static_cast<const ParagraphProps &>(*_props);
  const auto &newParagraphProps = static_cast<const ParagraphProps &>(*props);

  _paragraphAttributes = newParagraphProps.paragraphAttributes;

  if (newParagraphProps.isSelectable != oldParagraphProps.isSelectable) {
#if !TARGET_OS_OSX // [macOS]
    if (newParagraphProps.isSelectable) {
      [self enableContextMenu];
    } else {
      [self disableContextMenu];
    }
#endif // [macOS]
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _state = std::static_pointer_cast<ParagraphShadowNode::ConcreteState const>(state);
  [self setNeedsDisplay];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _accessibilityProvider = nil;
}

- (void)drawRect:(CGRect)rect
{
  if (!_state) {
    return;
  }

  auto textLayoutManager = _state->getData().paragraphLayoutManager.getTextLayoutManager();
  auto nsTextStorage = _state->getData().paragraphLayoutManager.getHostTextStorage();

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());

  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  [nativeTextLayoutManager drawAttributedString:_state->getData().attributedString
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame
                                    textStorage:unwrapManagedObject(nsTextStorage)];
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  return self.attributedText.string;
}

- (BOOL)isAccessibilityElement
{
  // All accessibility functionality of the component is implemented in `accessibilityElements` method below.
  // Hence to avoid calling all other methods from `UIAccessibilityContainer` protocol (most of them have default
  // implementations), we return here `NO`.
  return NO;
}

#if !TARGET_OS_OSX // [macOS]
- (NSArray *)accessibilityElements
{
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);

  // If the component is not `accessible`, we return an empty array.
  // We do this because logically all nested <Text> components represent the content of the <Paragraph> component;
  // in other words, all nested <Text> components individually have no sense without the <Paragraph>.
  if (!_state || !paragraphProps.accessible) {
    return [NSArray new];
  }

  auto &data = _state->getData();

  if (![_accessibilityProvider isUpToDate:data.attributedString]) {
    auto textLayoutManager = data.paragraphLayoutManager.getTextLayoutManager();
    RCTTextLayoutManager *nativeTextLayoutManager =
        (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
    CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
    _accessibilityProvider = [[RCTParagraphComponentAccessibilityProvider alloc] initWithString:data.attributedString
                                                                                  layoutManager:nativeTextLayoutManager
                                                                            paragraphAttributes:data.paragraphAttributes
                                                                                          frame:frame
                                                                                           view:self];
  }

  return _accessibilityProvider.accessibilityElements;
}

- (UIAccessibilityTraits)accessibilityTraits
{
  return [super accessibilityTraits] | UIAccessibilityTraitStaticText;
}
#endif // [macOS]

#pragma mark - RCTTouchableComponentViewProtocol

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  if (!_state) {
    return _eventEmitter;
  }

  auto textLayoutManager = _state->getData().paragraphLayoutManager.getTextLayoutManager();

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  auto eventEmitter = [nativeTextLayoutManager getEventEmitterWithAttributeString:_state->getData().attributedString
                                                              paragraphAttributes:_paragraphAttributes
                                                                            frame:frame
                                                                          atPoint:point];

  if (!eventEmitter) {
    return _eventEmitter;
  }

  assert(std::dynamic_pointer_cast<const TouchEventEmitter>(eventEmitter));
  return std::static_pointer_cast<const TouchEventEmitter>(eventEmitter);
}

#pragma mark - Context Menu

#if !TARGET_OS_OSX // [macOS]
- (void)enableContextMenu
{
  _longPressGestureRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self
                                                                              action:@selector(handleLongPress:)];

  if (@available(iOS 16.0, *)) {
    _editMenuInteraction = [[UIEditMenuInteraction alloc] initWithDelegate:self];
    [self addInteraction:_editMenuInteraction];
  }
  [self addGestureRecognizer:_longPressGestureRecognizer];
}

- (void)disableContextMenu
{
  [self removeGestureRecognizer:_longPressGestureRecognizer];
  if (@available(iOS 16.0, *)) {
    [self removeInteraction:_editMenuInteraction];
    _editMenuInteraction = nil;
  }
  _longPressGestureRecognizer = nil;
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture
{
  if (@available(iOS 16.0, macCatalyst 16.0, *)) {
    CGPoint location = [gesture locationInView:self];
    UIEditMenuConfiguration *config = [UIEditMenuConfiguration configurationWithIdentifier:nil sourcePoint:location];
    if (_editMenuInteraction) {
      [_editMenuInteraction presentEditMenuWithConfiguration:config];
    }
  } else {
    UIMenuController *menuController = [UIMenuController sharedMenuController];

    if (menuController.isMenuVisible) {
      return;
    }

    [menuController showMenuFromView:self rect:self.bounds];
  }
}
#endif // [macOS]

- (BOOL)canBecomeFirstResponder
{
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);
  return paragraphProps.isSelectable;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);

  if (paragraphProps.isSelectable && action == @selector(copy:)) {
    return YES;
  }

#if !TARGET_OS_OSX // [macOS]
  return [self.nextResponder canPerformAction:action withSender:sender];
#else  // [macOS
  return NO;
#endif // macOS]
}

- (void)copy:(id)sender
{
  NSAttributedString *attributedText = self.attributedText;

  NSMutableDictionary *item = [NSMutableDictionary new];

  NSData *rtf = [attributedText dataFromRange:NSMakeRange(0, attributedText.length)
                           documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                        error:nil];

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:attributedText.string forKey:(id)kUTTypeUTF8PlainText];

#if !TARGET_OS_OSX // [macOS]
  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.items = @[ item ];
#else // [macOS
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setData:rtf forType:NSPasteboardTypeRTFD];
#endif // macOS]
}

@end

Class<RCTComponentViewProtocol> RCTParagraphCls(void)
{
  return RCTParagraphComponentView.class;
}
