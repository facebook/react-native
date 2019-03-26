/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <fabric/core/Props.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates props of a component view.
 */
@interface RCTUpdatePropsMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
                   oldProps:(facebook::react::SharedProps)oldProps
                   newProps:(facebook::react::SharedProps)newProps;

@end

NS_ASSUME_NONNULL_END
