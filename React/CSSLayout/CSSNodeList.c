/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "CSSNodeList.h"

struct CSSNodeList {
  int capacity;
  int count;
  void **items;
};

CSSNodeListRef CSSNodeListNew(unsigned int initialCapacity) {
  CSSNodeListRef list = malloc(sizeof(struct CSSNodeList));
  assert(list != NULL);

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = malloc(sizeof(void*) * list->capacity);
  assert(list->items != NULL);

  return list;
}

void CSSNodeListFree(CSSNodeListRef list) {
  free(list);
}

unsigned int CSSNodeListCount(CSSNodeListRef list) {
  return list->count;
}

void CSSNodeListAdd(CSSNodeListRef list, CSSNodeRef node) {
  CSSNodeListInsert(list, node, list->count);
}

void CSSNodeListInsert(CSSNodeListRef list, CSSNodeRef node, unsigned int index) {
  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = realloc(list->items, sizeof(void*) * list->capacity);
    assert(list->items != NULL);
  }

  for (unsigned int i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

CSSNodeRef CSSNodeListRemove(CSSNodeListRef list, unsigned int index) {
  CSSNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (unsigned int i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

CSSNodeRef CSSNodeListDelete(CSSNodeListRef list, CSSNodeRef node) {
  for (unsigned int i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return CSSNodeListRemove(list, i);
    }
  }

  return NULL;
}

CSSNodeRef CSSNodeListGet(CSSNodeListRef list, unsigned int index) {
  return list->items[index];
}
