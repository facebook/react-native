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

#include "YGMacros.h"
#include "Yoga.h"

YG_EXTERN_C_BEGIN

typedef struct YGNodeList *YGNodeListRef;

YGNodeListRef YGNodeListNew(const uint32_t initialCapacity);
void YGNodeListFree(const YGNodeListRef list);
uint32_t YGNodeListCount(const YGNodeListRef list);
void YGNodeListAdd(YGNodeListRef *listp, const YGNodeRef node);
void YGNodeListInsert(YGNodeListRef *listp, const YGNodeRef node, const uint32_t index);
void YGNodeListReplace(const YGNodeListRef list, const uint32_t index, const YGNodeRef newNode);
void YGNodeListRemoveAll(const YGNodeListRef list);
YGNodeRef YGNodeListRemove(const YGNodeListRef list, const uint32_t index);
YGNodeRef YGNodeListDelete(const YGNodeListRef list, const YGNodeRef node);
YGNodeRef YGNodeListGet(const YGNodeListRef list, const uint32_t index);
YGNodeListRef YGNodeListClone(YGNodeListRef list);

YG_EXTERN_C_END
