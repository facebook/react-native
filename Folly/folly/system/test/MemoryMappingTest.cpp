/*
 * Copyright 2013-present Facebook, Inc.
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

#include <cstdlib>

#include <folly/FileUtil.h>
#include <folly/Random.h>
#include <folly/portability/GTest.h>
#include <folly/portability/SysMman.h>
#include <folly/system/MemoryMapping.h>

static constexpr double kSomeDouble = 3.14;

namespace folly {

TEST(MemoryMapping, Basic) {
  File f = File::temporary();
  {
    MemoryMapping m(File(f.fd()), 0, sizeof(double), MemoryMapping::writable());
    double* d = m.asWritableRange<double>().data();
    *d = 37 * kSomeDouble;
  }
  {
    MemoryMapping m(File(f.fd()), 0, 3);
    EXPECT_EQ(0, m.asRange<int>().size()); // not big enough
  }
  {
    MemoryMapping m(File(f.fd()), 0, sizeof(double));
    const double* d = m.asRange<double>().data();
    EXPECT_EQ(*d, 37 * kSomeDouble);
  }
}

TEST(MemoryMapping, Move) {
  File f = File::temporary();
  {
    MemoryMapping m(
        File(f.fd()), 0, sizeof(double) * 2, MemoryMapping::writable());
    double* d = m.asWritableRange<double>().data();
    d[0] = 37 * kSomeDouble;
    MemoryMapping m2(std::move(m));
    double* d2 = m2.asWritableRange<double>().data();
    d2[1] = 39 * kSomeDouble;
  }
  {
    MemoryMapping m(File(f.fd()), 0, sizeof(double));
    const double* d = m.asRange<double>().data();
    EXPECT_EQ(d[0], 37 * kSomeDouble);
    MemoryMapping m2(std::move(m));
    const double* d2 = m2.asRange<double>().data();
    EXPECT_EQ(d2[1], 39 * kSomeDouble);
  }
}

TEST(MemoryMapping, DoublyMapped) {
  File f = File::temporary();
  // two mappings of the same memory, different addresses.
  MemoryMapping mw(File(f.fd()), 0, sizeof(double), MemoryMapping::writable());
  MemoryMapping mr(File(f.fd()), 0, sizeof(double));

  double* dw = mw.asWritableRange<double>().data();
  const double* dr = mr.asRange<double>().data();

  // Show that it's truly the same value, even though the pointers differ
  EXPECT_NE(dw, dr);
  *dw = 42 * kSomeDouble;
  EXPECT_EQ(*dr, 42 * kSomeDouble);
  *dw = 43 * kSomeDouble;
  EXPECT_EQ(*dr, 43 * kSomeDouble);
}

namespace {

void writeStringToFileOrDie(const std::string& str, int fd) {
  const char* b = str.c_str();
  size_t count = str.size();
  ssize_t total_bytes = 0;
  ssize_t r;
  do {
    r = write(fd, b, count);
    if (r == -1) {
      if (errno == EINTR) {
        continue;
      }
      PCHECK(r) << "write";
    }

    total_bytes += r;
    b += r;
    count -= r;
  } while (r != 0 && count);
}

} // namespace

TEST(MemoryMapping, Simple) {
  File f = File::temporary();
  writeStringToFileOrDie("hello", f.fd());

  {
    MemoryMapping m(File(f.fd()));
    EXPECT_EQ("hello", m.data());
  }
  {
    MemoryMapping m(File(f.fd()), 1, 2);
    EXPECT_EQ("el", m.data());
  }
}

TEST(MemoryMapping, LargeFile) {
  std::string fileData;
  size_t fileSize = sysconf(_SC_PAGESIZE) * 3 + 10;
  fileData.reserve(fileSize);
  for (size_t i = 0; i < fileSize; i++) {
    fileData.push_back(0xff & Random::rand32());
  }

  File f = File::temporary();
  writeStringToFileOrDie(fileData, f.fd());

  {
    MemoryMapping m(File(f.fd()));
    EXPECT_EQ(fileData, m.data());
  }
  {
    size_t size = sysconf(_SC_PAGESIZE) * 2;
    StringPiece s(fileData.data() + 9, size - 9);
    MemoryMapping m(File(f.fd()), 9, size - 9);
    EXPECT_EQ(s.toString(), m.data());
  }
}

TEST(MemoryMapping, ZeroLength) {
  File f = File::temporary();
  MemoryMapping m(File(f.fd()));
  EXPECT_TRUE(m.mlock(MemoryMapping::LockMode::MUST_LOCK));
  EXPECT_TRUE(m.mlocked());
  EXPECT_EQ(0, m.data().size());
}

TEST(MemoryMapping, Advise) {
  File f = File::temporary();
  size_t kPageSize = 4096;
  size_t size = kPageSize + 10; // unaligned file size
  PCHECK(ftruncateNoInt(f.fd(), size) == 0) << size;

  MemoryMapping m(File(f.fd()));

  // NOTE: advise crashes on bad input.

  m.advise(MADV_NORMAL, 0, kPageSize);
  m.advise(MADV_NORMAL, 1, kPageSize);
  m.advise(MADV_NORMAL, 0, 2);
  m.advise(MADV_NORMAL, 1, 2);

  m.advise(MADV_NORMAL, kPageSize, 0);
  m.advise(MADV_NORMAL, kPageSize, 1);
  m.advise(MADV_NORMAL, kPageSize, size - kPageSize);

  auto off = kPageSize + 1;
  m.advise(MADV_NORMAL, off, size - off);

  EXPECT_DEATH(m.advise(MADV_NORMAL, off, size - off + 1), "");
}

} // namespace folly
