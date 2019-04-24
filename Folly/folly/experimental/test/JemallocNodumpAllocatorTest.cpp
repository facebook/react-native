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

#include <folly/experimental/JemallocNodumpAllocator.h>

#include <folly/io/IOBuf.h>
#include <folly/memory/Malloc.h>
#include <folly/portability/GTest.h>

TEST(JemallocNodumpAllocatorTest, Basic) {
  folly::JemallocNodumpAllocator jna;

#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
  if (folly::usingJEMalloc()) {
    EXPECT_NE(0, jna.getArenaIndex());
  }
#endif // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED

  auto ptr = jna.allocate(1024);
  EXPECT_NE(nullptr, ptr);
  jna.deallocate(ptr);
}

TEST(JemallocNodumpAllocatorTest, IOBuf) {
  folly::JemallocNodumpAllocator jna;

#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
  if (folly::usingJEMalloc()) {
    EXPECT_NE(0, jna.getArenaIndex());
  }
#endif // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED

  const size_t size{1024};
  void* ptr = jna.allocate(size);
  EXPECT_NE(nullptr, ptr);
  folly::IOBuf ioBuf(folly::IOBuf::TAKE_OWNERSHIP, ptr, size);
  EXPECT_EQ(size, ioBuf.capacity());
  EXPECT_EQ(ptr, ioBuf.data());
  uint8_t* data = ioBuf.writableData();
  EXPECT_EQ(ptr, data);
  for (auto i = 0u; i < ioBuf.capacity(); ++i) {
    data[i] = 'A';
  }
  uint8_t* p = static_cast<uint8_t*>(ptr);
  for (auto i = 0u; i < size; ++i) {
    EXPECT_EQ('A', p[i]);
  }
}
