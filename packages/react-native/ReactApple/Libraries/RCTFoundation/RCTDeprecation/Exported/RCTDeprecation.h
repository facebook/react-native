/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_DEPRECATED_DECLARATIONS
#define RCT_DEPRECATED_DECLARATIONS 0
#endif

#if RCT_DEPRECATED_DECLARATIONS
#define RCT_DEPRECATED __attribute__((deprecated))
#else
#define RCT_DEPRECATED
#endif
