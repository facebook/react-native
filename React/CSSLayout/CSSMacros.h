/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_MACROS_H
#define __CSS_MACROS_H

#ifdef __cplusplus
# define CSS_EXTERN_C_BEGIN extern "C" {
# define CSS_EXTERN_C_END   }
#else
# define CSS_EXTERN_C_BEGIN
# define CSS_EXTERN_C_END
#endif

#endif
