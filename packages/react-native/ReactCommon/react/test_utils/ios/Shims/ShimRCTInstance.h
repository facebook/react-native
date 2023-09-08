/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface ShimRCTInstance : NSObject

@property int initCount;
@property int invalidateCount;

@property NSString *jsModuleName;
@property NSString *method;
@property NSArray *args;

- (void)reset;

@end
