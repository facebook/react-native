/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewProtocol.h>
#import <React/UIView+ComponentViewProtocol.h>
#import <fabric/core/EventHandlers.h>
#import <fabric/core/LayoutMetrics.h>
#import <fabric/core/Props.h>
#import <fabric/view/ViewEventHandlers.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for <View> component.
 */
@interface RCTViewComponentView : UIView <RCTComponentViewProtocol> {
@protected
  facebook::react::LayoutMetrics _layoutMetrics;
  facebook::react::SharedProps _props;
  facebook::react::SharedViewEventHandlers _eventHandlers;
}

@end

NS_ASSUME_NONNULL_END
