/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#include <jsi/jsi.h>
#endif

@protocol RCTTurboModuleWithJSIBindings <NSObject>

#ifdef __cplusplus
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime;
#endif

@end
