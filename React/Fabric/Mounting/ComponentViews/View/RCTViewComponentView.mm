/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <fabric/view/ViewProps.h>
#import <fabric/view/ViewEventEmitter.h>


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

- (void)updateEventEmitter:(SharedEventEmitter)eventEmitter
{
  assert(std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<const ViewEventEmitter>(eventEmitter);
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
  _eventEmitter->onAccessibilityTap();
  return YES;
}

- (BOOL)accessibilityPerformMagicTap
{
  _eventEmitter->onAccessibilityMagicTap();
  return YES;
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  _eventEmitter->onAccessibilityAction([action.name cStringUsingEncoding:NSASCIIStringEncoding]);
  return YES;
}

- (SharedEventEmitter)touchEventEmitter
{
  return _eventEmitter;
}

@end
