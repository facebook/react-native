/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

RCT_EXTERN_C_BEGIN

int RCTGetRetainCount(id _Nullable object);

void RCTAutoReleasePoolPush(void);
void RCTAutoReleasePoolPop(void);

RCT_EXTERN_C_END
