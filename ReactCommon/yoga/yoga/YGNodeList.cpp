/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "YGNodeList.h"

struct YGNodeList {
  uint32_t capacity;
  uint32_t count;
  YGNodeRef *items;
};

YGNodeListRef YGNodeListNew(const uint32_t initialCapacity) {
  const YGNodeListRef list =
      (const YGNodeListRef)malloc(sizeof(struct YGNodeList));
  YGAssert(list != nullptr, "Could not allocate memory for list");

  list->capacity = initialCapacity;
  list->count = 0;
  list->items = (YGNodeRef*)malloc(sizeof(YGNodeRef) * list->capacity);
  YGAssert(list->items != nullptr, "Could not allocate memory for items");

  return list;
}

void YGNodeListFree(const YGNodeListRef list) {
  if (list) {
    free(list->items);
    free(list);
  }
}

uint32_t YGNodeListCount(const YGNodeListRef list) {
  if (list) {
    return list->count;
  }
  return 0;
}

void YGNodeListAdd(YGNodeListRef *listp, const YGNodeRef node) {
  if (!*listp) {
    *listp = YGNodeListNew(4);
  }
  YGNodeListInsert(listp, node, (*listp)->count);
}

void YGNodeListInsert(YGNodeListRef *listp, const YGNodeRef node, const uint32_t index) {
  if (!*listp) {
    *listp = YGNodeListNew(4);
  }
  YGNodeListRef list = *listp;

  if (list->count == list->capacity) {
    list->capacity *= 2;
    list->items =
        (YGNodeRef*)realloc(list->items, sizeof(YGNodeRef) * list->capacity);
    YGAssert(list->items != nullptr, "Could not extend allocation for items");
  }

  for (uint32_t i = list->count; i > index; i--) {
    list->items[i] = list->items[i - 1];
  }

  list->count++;
  list->items[index] = node;
}

void YGNodeListReplace(YGNodeListRef list, const uint32_t index, const YGNodeRef newNode) {
  list->items[index] = newNode;
}

void YGNodeListRemoveAll(const YGNodeListRef list) {
  for (uint32_t i = 0; i < list->count; i++) {
    list->items[i] = nullptr;
  }
  list->count = 0;
}

YGNodeRef YGNodeListRemove(const YGNodeListRef list, const uint32_t index) {
  const YGNodeRef removed = list->items[index];
  list->items[index] = nullptr;

  for (uint32_t i = index; i < list->count - 1; i++) {
    list->items[i] = list->items[i + 1];
    list->items[i + 1] = nullptr;
  }

  list->count--;
  return removed;
}

YGNodeRef YGNodeListDelete(const YGNodeListRef list, const YGNodeRef node) {
  for (uint32_t i = 0; i < list->count; i++) {
    if (list->items[i] == node) {
      return YGNodeListRemove(list, i);
    }
  }

  return nullptr;
}

YGNodeRef YGNodeListGet(const YGNodeListRef list, const uint32_t index) {
  if (YGNodeListCount(list) > 0) {
    return list->items[index];
  }

  return nullptr;
}

YGNodeListRef YGNodeListClone(const YGNodeListRef oldList) {
  if (!oldList) {
    return nullptr;
  }
  const uint32_t count = oldList->count;
  if (count == 0) {
    return nullptr;
  }
  const YGNodeListRef newList = YGNodeListNew(count);
  memcpy(newList->items, oldList->items, sizeof(YGNodeRef) * count);
  newList->count = count;
  return newList;
}
