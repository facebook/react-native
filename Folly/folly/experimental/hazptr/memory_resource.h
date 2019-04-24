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

////////////////////////////////////////////////////////////////////////////////
/// Disclaimer: This is intended only as a partial stand-in for
/// std::pmr::memory_resource (C++17) as needed for developing a
/// hazptr prototype.
////////////////////////////////////////////////////////////////////////////////

#include <memory>

#include <folly/Portability.h>
#include <folly/lang/Align.h>

namespace folly {
namespace hazptr {

class memory_resource {
 public:
  virtual ~memory_resource() = default;
  virtual void* allocate(
      const size_t bytes,
      const size_t alignment = max_align_v) = 0;
  virtual void deallocate(
      void* p,
      const size_t bytes,
      const size_t alignment = max_align_v) = 0;
};

memory_resource* get_default_resource();
void set_default_resource(memory_resource*);
memory_resource* new_delete_resource();

} // namespace hazptr
} // namespace folly
