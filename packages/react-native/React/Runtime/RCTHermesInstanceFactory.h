/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <react/runtime/JSRuntimeFactoryCAPI.h>

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

JSRuntimeFactoryRef jsrt_create_hermes_factory(void);

#ifdef __cplusplus
}
#endif
