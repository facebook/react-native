/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#ifdef __cplusplus
#import <Foundation/Foundation.h>

#import <React/RCTBridgeMethod.h>
#import <cxxreact/CxxModule.h>

@interface RCTCxxMethod : NSObject <RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
#endif
