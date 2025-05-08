/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

NS_ASSUME_NONNULL_BEGIN

// Forward declarations for umbrella headers.
// In implementations, import `<react/runtime/JSRuntimeFactoryCAPI.h>` to obtain the actual type.
typedef void *JSRuntimeFactoryRef;

@protocol RCTJSRuntimeConfiguratorProtocol

- (JSRuntimeFactoryRef)createJSRuntimeFactory;

@end

NS_ASSUME_NONNULL_END
