/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <fabric/core/LocalData.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates local data of a component view.
 */
@interface RCTUpdateLocalDataMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
               oldLocalData:(facebook::react::SharedLocalData)oldLocalData
               newLocalData:(facebook::react::SharedLocalData)newLocalData;

@end

NS_ASSUME_NONNULL_END
