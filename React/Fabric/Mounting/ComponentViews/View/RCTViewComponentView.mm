/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <fabric/view/ViewProps.h>
#import <fabric/view/ViewEventHandlers.h>


using namespace facebook::react;

@implementation RCTViewComponentView

- (void)updateProps:(SharedProps)props
           oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<ViewProps>();
  }
  _props = props;

  auto oldViewProps = *std::dynamic_pointer_cast<const ViewProps>(oldProps);
  auto newViewProps = *std::dynamic_pointer_cast<const ViewProps>(props);

  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    self.backgroundColor = [UIColor colorWithCGColor:newViewProps.backgroundColor.get()];
  }

  // TODO: Implement all sutable non-layout <View> props.
}

- (void)updateEventHandlers:(SharedEventHandlers)eventHandlers
{
  assert(std::dynamic_pointer_cast<const ViewEventHandlers>(eventHandlers));
  _eventHandlers = std::static_pointer_cast<const ViewEventHandlers>(eventHandlers);
}

- (void)updateLayoutMetrics:(LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  _layoutMetrics = layoutMetrics;
}

#pragma mark - Accessibility Events

- (BOOL)accessibilityActivate
{
  _eventHandlers->onAccessibilityTap();
  return YES;
}

- (BOOL)accessibilityPerformMagicTap
{
  _eventHandlers->onAccessibilityMagicTap();
  return YES;
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  _eventHandlers->onAccessibilityAction([action.name cStringUsingEncoding:NSASCIIStringEncoding]);
  return YES;
}

@end
