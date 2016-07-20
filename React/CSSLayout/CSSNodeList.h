/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_NODE_LIST_H
#define __CSS_NODE_LIST_H

#include <CSSLayout/CSSLayout.h>

CSS_EXTERN_C_BEGIN

typedef struct CSSNodeList * CSSNodeListRef;

CSSNodeListRef CSSNodeListNew(unsigned int initialCapacity);
void CSSNodeListFree(CSSNodeListRef list);
unsigned int CSSNodeListCount(CSSNodeListRef list);
void CSSNodeListAdd(CSSNodeListRef list, CSSNodeRef node);
void CSSNodeListInsert(CSSNodeListRef list, CSSNodeRef node, unsigned int index);
CSSNodeRef CSSNodeListRemove(CSSNodeListRef list, unsigned int index);
CSSNodeRef CSSNodeListDelete(CSSNodeListRef list, CSSNodeRef node);
CSSNodeRef CSSNodeListGet(CSSNodeListRef list, unsigned int index);

CSS_EXTERN_C_END

#endif
