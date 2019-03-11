/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <react/events/EventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates event handlers of a component view.
 */
@interface RCTUpdateEventEmitterMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
              eventEmitter:(facebook::react::SharedEventEmitter)eventEmitter;

@end

NS_ASSUME_NONNULL_END
