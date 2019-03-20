/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#define _CONCAT(A, B) A##B
#define CONCAT(A, B) _CONCAT(A, B)

#if !defined(PIC_MODIFIER)
#define PIC_MODIFIER
#endif

#define SYMBOL_NAME(name) CONCAT(__USER_LABEL_PREFIX__, name)
#define SYMBOL_NAME_PIC(name) CONCAT(SYMBOL_NAME(name), PIC_MODIFIER)
