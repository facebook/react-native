/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import "RCTInspectorPackagerConnection.h"

#if RCT_DEV || RCT_REMOTE_PROFILE

@interface RCTCxxInspectorPackagerConnection : NSObject <RCTInspectorPackagerConnectionProtocol>
@end

#endif
