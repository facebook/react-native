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

  __block NSInteger numOfLink = 0;
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
  [elements addObject:firstElement];

  // add additional elements for those parts of text with embedded link so VoiceOver could specially recognize links

  [_layoutManager getRectWithAttributedString:_attributedString
                          paragraphAttributes:_paragraphAttributes
                           enumerateAttribute:RCTTextAttributesAccessibilityRoleAttributeName
                                        frame:_frame
                                   usingBlock:^(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value) {
                                     UIAccessibilityElement *element =
                                         [[UIAccessibilityElement alloc] initWithAccessibilityContainer:self->_view];
                                     element.isAccessibilityElement = YES;
                                     if ([value isEqualToString:@"link"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitLink;
                                       numOfLink++;
                                     }
                                     element.accessibilityLabel = fragmentText;
                                     element.accessibilityFrameInContainerSpace = fragmentRect;
                                     [elements addObject:element];
                                   }];

  if (numOfLink > 0) {
    [elements enumerateObjectsUsingBlock:^(UIAccessibilityElement *element, NSUInteger idx, BOOL *_Nonnull stop) {
      element.accessibilityHint = [NSString stringWithFormat:@"Link %ld of %ld.", (unsigned long)idx, (long)numOfLink];
    }];

    NSString *firstElementHint = (numOfLink == 1)
        ? @"One link found, swipe right to move to the link."
        : [NSString stringWithFormat:@"%ld links found, swipe right to move to the first link.", (long)numOfLink];

    firstElement.accessibilityHint = firstElementHint;
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
