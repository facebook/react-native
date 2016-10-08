/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "CSSNodeList.h"

struct CSSNodeList {
  uint32_t capacity;
  uint32_t count;
  void **items;
};

CSSNodeListRef CSSNodeListNew(const uint32_t initialCapacity) {
  const CSSNodeListRef list = malloc(sizeof(struct CSSNodeList));
  CSS_ASSERT(list != NULL, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = malloc(sizeof(void *) * list->capacity);
  CSS_ASSERT(list->items != NULL, "Could not allocate memory for items");

  return list;
}

void CSSNodeListFree(const CSSNodeListRef list) {
  free(list->items);
  free(list);
}

uint32_t CSSNodeListCount(const CSSNodeListRef list) {
  return list->count;
}

void CSSNodeListAdd(const CSSNodeListRef list, const CSSNodeRef node) {
  CSSNodeListInsert(list, node, list->count);
}

void CSSNodeListInsert(const CSSNodeListRef list, const CSSNodeRef node, const uint32_t index) {
  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items = realloc(list->items, sizeof(void *) * list->capacity);
    CSS_ASSERT(list->items != NULL, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

CSSNodeRef CSSNodeListRemove(const CSSNodeListRef list, const uint32_t index) {
  const CSSNodeRef removed = list->items[index];
  list->items[index] = NULL;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = NULL;
  }

  list->count--;
  return removed;
}

CSSNodeRef CSSNodeListDelete(const CSSNodeListRef list, const CSSNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return CSSNodeListRemove(list, i);
    }
  }

  return NULL;
}

CSSNodeRef CSSNodeListGet(const CSSNodeListRef list, const uint32_t index) {
  return list->items[index];
}
