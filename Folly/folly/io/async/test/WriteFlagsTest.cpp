/*
 * Copyright 2017-present Facebook, Inc.
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
#include <folly/io/async/AsyncTransport.h>

//#include <folly/io/async/test/MockAsyncTransport.h>
#include <folly/portability/GTest.h>

using namespace testing;

namespace folly {

TEST(WriteFlagsTest, isSet) {
  WriteFlags flags = WriteFlags::NONE;
  ASSERT_FALSE(isSet(flags, WriteFlags::CORK));
  ASSERT_FALSE(isSet(flags, WriteFlags::EOR));

  flags = WriteFlags::CORK;
  ASSERT_TRUE(isSet(flags, WriteFlags::CORK));
  ASSERT_FALSE(isSet(flags, WriteFlags::EOR));

  flags = static_cast<WriteFlags>(
      static_cast<uint32_t>(WriteFlags::CORK) |
      static_cast<uint32_t>(WriteFlags::EOR));
  ASSERT_TRUE(isSet(flags, WriteFlags::CORK));
  ASSERT_TRUE(isSet(flags, WriteFlags::EOR));
}

TEST(WriteFlagsTest, unionOperator) {
  WriteFlags flags = WriteFlags::CORK | WriteFlags::NONE;
  ASSERT_EQ(flags, WriteFlags::CORK);

  flags = static_cast<WriteFlags>(
      static_cast<uint32_t>(WriteFlags::CORK) |
      static_cast<uint32_t>(WriteFlags::EOR));
  ASSERT_EQ(flags, WriteFlags::CORK | WriteFlags::EOR);
}

TEST(WriteFlagsTest, intersectionOperator) {
  ASSERT_EQ(WriteFlags::NONE & WriteFlags::CORK, WriteFlags::NONE);

  WriteFlags flags =
      WriteFlags::CORK | WriteFlags::EOR | WriteFlags::WRITE_SHUTDOWN;
  ASSERT_EQ(flags & WriteFlags::CORK, WriteFlags::CORK);
  ASSERT_EQ(flags & WriteFlags::EOR, WriteFlags::EOR);
  ASSERT_EQ(flags & WriteFlags::WRITE_SHUTDOWN, WriteFlags::WRITE_SHUTDOWN);
}

TEST(WriteFlagsTest, exclusionOperator) {
  ASSERT_FALSE(isSet(~WriteFlags::CORK, WriteFlags::CORK));
  ASSERT_TRUE(isSet(~WriteFlags::CORK, WriteFlags::EOR));
  ASSERT_TRUE(isSet(~WriteFlags::CORK, WriteFlags::WRITE_SHUTDOWN));

  ASSERT_FALSE(isSet(~WriteFlags::EOR, WriteFlags::EOR));
  ASSERT_TRUE(isSet(~WriteFlags::EOR, WriteFlags::CORK));
  ASSERT_TRUE(isSet(~WriteFlags::EOR, WriteFlags::WRITE_SHUTDOWN));
}

TEST(WriteFlagsTest, unsetOperator) {
  WriteFlags flags =
      WriteFlags::CORK | WriteFlags::EOR | WriteFlags::WRITE_SHUTDOWN;
  ASSERT_TRUE(isSet(flags, WriteFlags::CORK));
  ASSERT_TRUE(isSet(flags, WriteFlags::EOR));
  ASSERT_TRUE(isSet(flags, WriteFlags::WRITE_SHUTDOWN));

  flags = WriteFlags::CORK;
  ASSERT_TRUE(isSet(flags, WriteFlags::CORK));
  ASSERT_FALSE(isSet(flags, WriteFlags::EOR));
  ASSERT_FALSE(isSet(flags, WriteFlags::WRITE_SHUTDOWN));
}

TEST(WriteFlagsTest, compoundAssignmentUnionOperator) {
  WriteFlags flags = WriteFlags::NONE;
  flags |= WriteFlags::CORK;
  ASSERT_EQ(flags, WriteFlags::CORK);

  flags = WriteFlags::CORK;
  flags |= WriteFlags::EOR;
  ASSERT_EQ(flags, WriteFlags::CORK | WriteFlags::EOR);

  flags = WriteFlags::CORK | WriteFlags::EOR;
  flags |= WriteFlags::CORK;
  ASSERT_EQ(flags, WriteFlags::CORK | WriteFlags::EOR);
}

TEST(WriteFlagsTest, compoundAssignmentIntersectionOperator) {
  WriteFlags flags = WriteFlags::CORK | WriteFlags::EOR;
  flags &= WriteFlags::CORK;
  ASSERT_EQ(flags, WriteFlags::CORK);

  flags = WriteFlags::CORK | WriteFlags::EOR;
  flags &= WriteFlags::EOR;
  ASSERT_EQ(flags, WriteFlags::EOR);

  flags = WriteFlags::NONE;
  flags &= WriteFlags::EOR;
  ASSERT_EQ(flags, WriteFlags::NONE);
}

} // namespace folly
