/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>

#include <CSSLayout/CSSLayout.h>
#include <CSSLayout/CSSMacros.h>

CSS_EXTERN_C_BEGIN

typedef struct CSSNodeList *CSSNodeListRef;

CSSNodeListRef CSSNodeListNew(uint32_t initialCapacity);
void CSSNodeListFree(CSSNodeListRef list);
uint32_t CSSNodeListCount(CSSNodeListRef list);
void CSSNodeListAdd(CSSNodeListRef list, CSSNodeRef node);
void CSSNodeListInsert(CSSNodeListRef list, CSSNodeRef node, uint32_t index);
CSSNodeRef CSSNodeListRemove(CSSNodeListRef list, uint32_t index);
CSSNodeRef CSSNodeListDelete(CSSNodeListRef list, CSSNodeRef node);
CSSNodeRef CSSNodeListGet(CSSNodeListRef list, uint32_t index);

CSS_EXTERN_C_END
