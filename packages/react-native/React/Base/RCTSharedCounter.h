/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>

typedef NSUInteger (^NSUIntegerCounter)(void);
typedef uint64_t (^UInt64Counter)(void);

RCT_EXTERN NSUIntegerCounter RCTCreateSharedNSUIntegerCounter(void);
RCT_EXTERN UInt64Counter RCTCreateSharedUInt64Counter(void);
