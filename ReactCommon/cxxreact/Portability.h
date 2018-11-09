// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

// Packing uses a push/pop mechanic in MSVC.
#ifdef _MSC_VER
# define RN_PACK_ATTR /**/
# define RN_PACK_PUSH __pragma(pack(push, 1))
# define RN_PACK_POP __pragma(pack(pop))
#elif defined(__clang__) || defined(__GNUC__)
# define RN_PACK_ATTR __attribute__((__packed__))
# define RN_PACK_PUSH /**/
# define RN_PACK_POP /**/
#else
# define RN_PACK_ATTR /**/
# define RN_PACK_PUSH /**/
# define RN_PACK_POP /**/
#endif
