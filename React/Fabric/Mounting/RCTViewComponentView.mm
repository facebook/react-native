/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <fabric/view/ViewProps.h>

using namespace facebook::react;

@implementation RCTViewComponentView

- (void)updateProps:(facebook::react::SharedProps)props
           oldProps:(facebook::react::SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = std::make_shared<ViewProps>();
  }

  auto oldViewProps = *std::dynamic_pointer_cast<const ViewProps>(oldProps);
  auto newViewProps = *std::dynamic_pointer_cast<const ViewProps>(props);

  if (oldViewProps.getBackgroundColor() != newViewProps.getBackgroundColor()) {
    self.backgroundColor = [UIColor colorWithCGColor:newViewProps.getBackgroundColor().get()];
  }

  // TODO: Implement all sutable non-layout <View> props.
}

@end
