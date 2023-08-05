/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridgeMethod.h>

#ifdef __cplusplus
#import <cxxreact/CxxModule.h>
#endif // __cplusplus

@interface RCTCxxMethod : NSObject <RCTBridgeMethod>

#ifdef __cplusplus
- (instancetype)initWithCxxMethod:(const facebook::xplat::module::CxxModule::Method &)cxxMethod;
#endif // __cplusplus

@end
