/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentAccessibilityProvider.h"

#import <Foundation/Foundation.h>
#import <react/components/text/ParagraphProps.h>
#import <react/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/textlayoutmanager/TextLayoutManager.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTParagraphComponentAccessibilityProvider {
  NSMutableArray<UIAccessibilityElement *> *_accessibilityElements;
  AttributedString _attributedString;
  RCTTextLayoutManager *_layoutManager;
  ParagraphAttributes _paragraphAttributes;
  CGRect _frame;
  __weak UIView *_view;
}

- (instancetype)initWithString:(facebook::react::AttributedString)attributedString
                 layoutManager:(RCTTextLayoutManager *)layoutManager
           paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         frame:(CGRect)frame
                          view:(UIView *)view
{
  if (self = [super init]) {
    _attributedString = attributedString;
    _layoutManager = layoutManager;
    _paragraphAttributes = paragraphAttributes;
    _frame = frame;
    _view = view;
  }
  return self;
}

- (NSArray<UIAccessibilityElement *> *)accessibilityElements
{
  if (_accessibilityElements) {
    return _accessibilityElements;
  }

  __block NSInteger numberOfLinks = 0;
  __block NSInteger numberOfButtons = 0;
  __block NSString *truncatedText;
  // build an array of the accessibleElements
  NSMutableArray<UIAccessibilityElement *> *elements = [NSMutableArray new];

  NSString *accessibilityLabel = [_view valueForKey:@"accessibilityLabel"];
  if (!accessibilityLabel.length) {
    accessibilityLabel = RCTNSStringFromString(_attributedString.getString());
  }
  // add first element has the text for the whole textview in order to read out the whole text
  UIAccessibilityElement *firstElement = [[UIAccessibilityElement alloc] initWithAccessibilityContainer:_view];
  firstElement.isAccessibilityElement = YES;
  firstElement.accessibilityTraits = UIAccessibilityTraitStaticText;
  firstElement.accessibilityLabel = accessibilityLabel;
  firstElement.accessibilityFrameInContainerSpace = _view.bounds;
  [firstElement setAccessibilityActivationPoint:CGPointMake(
                                                    firstElement.accessibilityFrame.origin.x + 1.0,
                                                    firstElement.accessibilityFrame.origin.y + 1.0)];
  [elements addObject:firstElement];

  // add additional elements for those parts of text with embedded link so VoiceOver could specially recognize links

  [_layoutManager getRectWithAttributedString:_attributedString
                          paragraphAttributes:_paragraphAttributes
                           enumerateAttribute:RCTTextAttributesAccessibilityRoleAttributeName
                                        frame:_frame
                                   usingBlock:^(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value) {
                                     if (![value isEqualToString:@"button"] && ![value isEqualToString:@"link"]) {
                                       return;
                                     }
                                     if ([value isEqualToString:@"button"] &&
                                         ([fragmentText isEqualToString:@"See Less"] ||
                                          [fragmentText isEqualToString:@"See More"])) {
                                       truncatedText = fragmentText;
                                       return;
                                     }
                                     UIAccessibilityElement *element =
                                         [[UIAccessibilityElement alloc] initWithAccessibilityContainer:self->_view];
                                     element.isAccessibilityElement = YES;
                                     if ([value isEqualToString:@"link"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitLink;
                                       numberOfLinks++;
                                     } else if ([value isEqualToString:@"button"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitButton;
                                       numberOfButtons++;
                                     }
                                     element.accessibilityLabel = fragmentText;
                                     element.accessibilityFrameInContainerSpace = fragmentRect;
                                     [elements addObject:element];
                                   }];

  if (numberOfLinks > 0 || numberOfButtons > 0) {
    __block NSInteger indexOfLink = 1;
    __block NSInteger indexOfButton = 1;
    [elements enumerateObjectsUsingBlock:^(UIAccessibilityElement *element, NSUInteger idx, BOOL *_Nonnull stop) {
      if (idx == 0) {
        return;
      }
      if (element.accessibilityTraits & UIAccessibilityTraitLink) {
        element.accessibilityHint =
            [NSString stringWithFormat:@"Link %ld of %ld.", (long)indexOfLink++, (long)numberOfLinks];
      } else {
        element.accessibilityHint =
            [NSString stringWithFormat:@"Button %ld of %ld.", (long)indexOfButton++, (long)numberOfButtons];
      }
    }];
  }

  if (numberOfLinks > 0 && numberOfButtons > 0) {
    firstElement.accessibilityHint = @"Links and buttons are found, swipe to move to them.";

  } else if (numberOfLinks > 0) {
    NSString *firstElementHint = (numberOfLinks == 1)
        ? @"One link found, swipe to move to the link."
        : [NSString stringWithFormat:@"%ld links found, swipe to move to the first link.", (long)numberOfLinks];
    firstElement.accessibilityHint = firstElementHint;

  } else if (numberOfButtons > 0) {
    NSString *firstElementHint = (numberOfButtons == 1)
        ? @"One button found, swipe to move to the button."
        : [NSString stringWithFormat:@"%ld buttons found, swipe to move to the first button.", (long)numberOfButtons];
    firstElement.accessibilityHint = firstElementHint;
  }

  if (truncatedText && truncatedText.length > 0) {
    firstElement.accessibilityHint = (numberOfLinks > 0 || numberOfButtons > 0)
        ? [NSString stringWithFormat:@"%@ Double tap to %@.", firstElement.accessibilityHint, truncatedText]
        : firstElement.accessibilityHint = [NSString stringWithFormat:@"Double tap to %@.", truncatedText];
  }

  // add accessible element for truncation attributed string for automation purposes only
  _accessibilityElements = elements;
  return _accessibilityElements;
}

- (BOOL)isUpToDate:(facebook::react::AttributedString)currentAttributedString
{
  return currentAttributedString == _attributedString;
}

@end
