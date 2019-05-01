/*
 * Copyright 2016-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <folly/experimental/hazptr/debug.h>
#include <folly/experimental/hazptr/hazptr.h>

namespace folly {
namespace hazptr {

class MineMemoryResource : public memory_resource {
 public:
  void* allocate(const size_t sz, const size_t /* align */) override {
    void* p = malloc(sz);
    HAZPTR_DEBUG_PRINT(p << " " << sz);
    return p;
  }

  void deallocate(void* p, const size_t sz, const size_t /* align */) override {
    HAZPTR_DEBUG_PRINT(p << " " << sz);
    free(p);
  }
};

class Node2 : public hazptr_obj_base<Node2, void (*)(Node2*)> {
  char a[200];
};

inline void mineReclaimFnFree(Node2* p) {
  HAZPTR_DEBUG_PRINT(p << " " << sizeof(Node2));
  free(p);
}

inline void mineReclaimFnDelete(Node2* p) {
  HAZPTR_DEBUG_PRINT(p << " " << sizeof(Node2));
  delete p;
}

} // namespace hazptr
} // namespace folly
