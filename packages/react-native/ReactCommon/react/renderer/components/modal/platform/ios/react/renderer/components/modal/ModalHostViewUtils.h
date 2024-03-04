/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
  CGFloat width;
  CGFloat height;
} RCTSize;

RCTSize RCTModalHostViewScreenSize(void);

#ifdef __cplusplus
}
#endif
