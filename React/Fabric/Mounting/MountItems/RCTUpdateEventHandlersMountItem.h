/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <fabric/core/EventHandlers.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates event handlers of a component view.
 */
@interface RCTUpdateEventHandlersMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
              eventHandlers:(facebook::react::SharedEventHandlers)eventHandlers;

@end

NS_ASSUME_NONNULL_END
