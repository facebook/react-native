/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

@interface HermesRuntimeFactory : NSObject

+ (NSValue *)createJSRuntimeFactory;

@end
