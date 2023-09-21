/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#define YG_CHECK_CPP_VERSION()
#if (defined(_MSVC_LANG) && !(_MSVC_LANG > 201703L)) || \
    (!defined(_MSVC_LANG) && defined(__cplusplus) && !(__cplusplus > 201703L))
#error "This module must be compiled using '-std=c++20' or an equivalent."
#else
#endif
