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
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#include "CSSLayout.h"
#include "CSSMacros.h"

CSS_EXTERN_C_BEGIN

typedef struct CSSNodeList *CSSNodeListRef;

CSSNodeListRef CSSNodeListNew(const uint32_t initialCapacity);
void CSSNodeListFree(const CSSNodeListRef list);
uint32_t CSSNodeListCount(const CSSNodeListRef list);
void CSSNodeListAdd(CSSNodeListRef *listp, const CSSNodeRef node);
void CSSNodeListInsert(CSSNodeListRef *listp, const CSSNodeRef node, const uint32_t index);
CSSNodeRef CSSNodeListRemove(const CSSNodeListRef list, const uint32_t index);
CSSNodeRef CSSNodeListDelete(const CSSNodeListRef list, const CSSNodeRef node);
CSSNodeRef CSSNodeListGet(const CSSNodeListRef list, const uint32_t index);

CSS_EXTERN_C_END
