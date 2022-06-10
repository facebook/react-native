/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface RCTWeakProxy : NSObject

@property (nonatomic, weak, readonly) id target;

+ (instancetype)weakProxyWithTarget:(id)target;

@end
