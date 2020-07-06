/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentAccessibilityProvider.h"

#import <Foundation/Foundation.h>
#import <react/components/text/ParagraphProps.h>
#import <react/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/textlayoutmanager/TextLayoutManager.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTParagraphComponentAccessibilityProvider {
  NSMutableArray<UIAccessibilityElement *> *_accessibilityElements;
  AttributedString _attributedString;
  __weak UIView *_view;
}

- (instancetype)initWithString:(AttributedString)attributedString view:(UIView *)view
{
  if (self = [super init]) {
    _attributedString = attributedString;
    _view = view;
  }
  return self;
}

- (NSArray<UIAccessibilityElement *> *)accessibilityElements
{
  if (_accessibilityElements) {
    return _accessibilityElements;
  }
  // build an array of the accessibleElements
  NSMutableArray *elements = [NSMutableArray new];

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

  // add accessible element for truncation attributed string for automation purposes only
  _accessibilityElements = elements;
  return _accessibilityElements;
}

- (BOOL)isUpToDate:(facebook::react::AttributedString)currentAttributedString
{
  return currentAttributedString == _attributedString;
}

@end
