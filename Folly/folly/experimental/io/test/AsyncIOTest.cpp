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

#include <folly/experimental/io/AsyncIO.h>

#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>

#include <cstdio>
#include <cstdlib>
#include <memory>
#include <random>
#include <thread>
#include <vector>

#include <glog/logging.h>

#include <folly/ScopeGuard.h>
#include <folly/String.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>

namespace fs = folly::fs;

using folly::AsyncIO;
using folly::AsyncIOOp;
using folly::AsyncIOQueue;
using folly::errnoStr;

namespace {

constexpr size_t kAlign = 4096; // align reads to 4096 B (for O_DIRECT)

struct TestSpec {
  off_t start;
  size_t size;
};

void waitUntilReadable(int fd) {
  pollfd pfd;
  pfd.fd = fd;
  pfd.events = POLLIN;

  int r;
  do {
    r = poll(&pfd, 1, -1); // wait forever
  } while (r == -1 && errno == EINTR);
  PCHECK(r == 1);
  CHECK_EQ(pfd.revents, POLLIN); // no errors etc
}

folly::Range<AsyncIO::Op**> readerWait(AsyncIO* reader) {
  int fd = reader->pollFd();
  if (fd == -1) {
    return reader->wait(1);
  } else {
    waitUntilReadable(fd);
    return reader->pollCompleted();
  }
}

// Temporary file that is NOT kept open but is deleted on exit.
// Generate random-looking but reproduceable data.
class TemporaryFile {
 public:
  explicit TemporaryFile(size_t size);
  ~TemporaryFile();

  const fs::path path() const {
    return path_;
  }

 private:
  fs::path path_;
};

TemporaryFile::TemporaryFile(size_t size)
    : path_(fs::temp_directory_path() / fs::unique_path()) {
  CHECK_EQ(size % sizeof(uint32_t), 0);
  size /= sizeof(uint32_t);
  const uint32_t seed = 42;
  std::mt19937 rnd(seed);

  const size_t bufferSize = 1U << 16;
  uint32_t buffer[bufferSize];

  FILE* fp = ::fopen(path_.c_str(), "wb");
  PCHECK(fp != nullptr);
  while (size) {
    size_t n = std::min(size, bufferSize);
    for (size_t i = 0; i < n; ++i) {
      buffer[i] = rnd();
    }
    size_t written = ::fwrite(buffer, sizeof(uint32_t), n, fp);
    PCHECK(written == n);
    size -= written;
  }
  PCHECK(::fclose(fp) == 0);
}

TemporaryFile::~TemporaryFile() {
  try {
    fs::remove(path_);
  } catch (const fs::filesystem_error& e) {
    LOG(ERROR) << "fs::remove: " << folly::exceptionStr(e);
  }
}

TemporaryFile tempFile(6 << 20); // 6MiB

typedef std::unique_ptr<char, void (*)(void*)> ManagedBuffer;
ManagedBuffer allocateAligned(size_t size) {
  void* buf;
  int rc = posix_memalign(&buf, kAlign, size);
  CHECK_EQ(rc, 0) << errnoStr(rc);
  return ManagedBuffer(reinterpret_cast<char*>(buf), free);
}

void testReadsSerially(
    const std::vector<TestSpec>& specs,
    AsyncIO::PollMode pollMode) {
  AsyncIO aioReader(1, pollMode);
  AsyncIO::Op op;
  int fd = ::open(tempFile.path().c_str(), O_DIRECT | O_RDONLY);
  PCHECK(fd != -1);
  SCOPE_EXIT {
    ::close(fd);
  };

  for (size_t i = 0; i < specs.size(); i++) {
    auto buf = allocateAligned(specs[i].size);
    op.pread(fd, buf.get(), specs[i].size, specs[i].start);
    aioReader.submit(&op);
    EXPECT_EQ((i + 1), aioReader.totalSubmits());
    EXPECT_EQ(aioReader.pending(), 1);
    auto ops = readerWait(&aioReader);
    EXPECT_EQ(1, ops.size());
    EXPECT_TRUE(ops[0] == &op);
    EXPECT_EQ(aioReader.pending(), 0);
    ssize_t res = op.result();
    EXPECT_LE(0, res) << folly::errnoStr(-res);
    EXPECT_EQ(specs[i].size, res);
    op.reset();
  }
}

void testReadsParallel(
    const std::vector<TestSpec>& specs,
    AsyncIO::PollMode pollMode,
    bool multithreaded) {
  AsyncIO aioReader(specs.size(), pollMode);
  std::unique_ptr<AsyncIO::Op[]> ops(new AsyncIO::Op[specs.size()]);
  std::vector<ManagedBuffer> bufs;
  bufs.reserve(specs.size());

  int fd = ::open(tempFile.path().c_str(), O_DIRECT | O_RDONLY);
  PCHECK(fd != -1);
  SCOPE_EXIT {
    ::close(fd);
  };

  std::vector<std::thread> threads;
  if (multithreaded) {
    threads.reserve(specs.size());
  }
  for (size_t i = 0; i < specs.size(); i++) {
    bufs.push_back(allocateAligned(specs[i].size));
  }
  auto submit = [&](size_t i) {
    ops[i].pread(fd, bufs[i].get(), specs[i].size, specs[i].start);
    aioReader.submit(&ops[i]);
  };
  for (size_t i = 0; i < specs.size(); i++) {
    if (multithreaded) {
      threads.emplace_back([&submit, i] { submit(i); });
    } else {
      submit(i);
    }
  }
  for (auto& t : threads) {
    t.join();
  }
  std::vector<bool> pending(specs.size(), true);

  size_t remaining = specs.size();
  while (remaining != 0) {
    EXPECT_EQ(remaining, aioReader.pending());
    auto completed = readerWait(&aioReader);
    size_t nrRead = completed.size();
    EXPECT_NE(nrRead, 0);
    remaining -= nrRead;

    for (size_t i = 0; i < nrRead; i++) {
      int id = completed[i] - ops.get();
      EXPECT_GE(id, 0);
      EXPECT_LT(id, specs.size());
      EXPECT_TRUE(pending[id]);
      pending[id] = false;
      ssize_t res = ops[id].result();
      EXPECT_LE(0, res) << folly::errnoStr(-res);
      EXPECT_EQ(specs[id].size, res);
    }
  }
  EXPECT_EQ(specs.size(), aioReader.totalSubmits());

  EXPECT_EQ(aioReader.pending(), 0);
  for (size_t i = 0; i < pending.size(); i++) {
    EXPECT_FALSE(pending[i]);
  }
}

void testReadsQueued(
    const std::vector<TestSpec>& specs,
    AsyncIO::PollMode pollMode) {
  size_t readerCapacity = std::max(specs.size() / 2, size_t(1));
  AsyncIO aioReader(readerCapacity, pollMode);
  AsyncIOQueue aioQueue(&aioReader);
  std::unique_ptr<AsyncIO::Op[]> ops(new AsyncIO::Op[specs.size()]);
  std::vector<ManagedBuffer> bufs;

  int fd = ::open(tempFile.path().c_str(), O_DIRECT | O_RDONLY);
  PCHECK(fd != -1);
  SCOPE_EXIT {
    ::close(fd);
  };
  for (size_t i = 0; i < specs.size(); i++) {
    bufs.push_back(allocateAligned(specs[i].size));
    ops[i].pread(fd, bufs[i].get(), specs[i].size, specs[i].start);
    aioQueue.submit(&ops[i]);
  }
  std::vector<bool> pending(specs.size(), true);

  size_t remaining = specs.size();
  while (remaining != 0) {
    if (remaining >= readerCapacity) {
      EXPECT_EQ(readerCapacity, aioReader.pending());
      EXPECT_EQ(remaining - readerCapacity, aioQueue.queued());
    } else {
      EXPECT_EQ(remaining, aioReader.pending());
      EXPECT_EQ(0, aioQueue.queued());
    }
    auto completed = readerWait(&aioReader);
    size_t nrRead = completed.size();
    EXPECT_NE(nrRead, 0);
    remaining -= nrRead;

    for (size_t i = 0; i < nrRead; i++) {
      int id = completed[i] - ops.get();
      EXPECT_GE(id, 0);
      EXPECT_LT(id, specs.size());
      EXPECT_TRUE(pending[id]);
      pending[id] = false;
      ssize_t res = ops[id].result();
      EXPECT_LE(0, res) << folly::errnoStr(-res);
      EXPECT_EQ(specs[id].size, res);
    }
  }
  EXPECT_EQ(specs.size(), aioReader.totalSubmits());
  EXPECT_EQ(aioReader.pending(), 0);
  EXPECT_EQ(aioQueue.queued(), 0);
  for (size_t i = 0; i < pending.size(); i++) {
    EXPECT_FALSE(pending[i]);
  }
}

void testReads(const std::vector<TestSpec>& specs, AsyncIO::PollMode pollMode) {
  testReadsSerially(specs, pollMode);
  testReadsParallel(specs, pollMode, false);
  testReadsParallel(specs, pollMode, true);
  testReadsQueued(specs, pollMode);
}

} // namespace

TEST(AsyncIO, ZeroAsyncDataNotPollable) {
  testReads({{0, 0}}, AsyncIO::NOT_POLLABLE);
}

TEST(AsyncIO, ZeroAsyncDataPollable) {
  testReads({{0, 0}}, AsyncIO::POLLABLE);
}

TEST(AsyncIO, SingleAsyncDataNotPollable) {
  testReads({{0, kAlign}}, AsyncIO::NOT_POLLABLE);
  testReads({{0, kAlign}}, AsyncIO::NOT_POLLABLE);
}

TEST(AsyncIO, SingleAsyncDataPollable) {
  testReads({{0, kAlign}}, AsyncIO::POLLABLE);
  testReads({{0, kAlign}}, AsyncIO::POLLABLE);
}

TEST(AsyncIO, MultipleAsyncDataNotPollable) {
  testReads(
      {{kAlign, 2 * kAlign}, {kAlign, 2 * kAlign}, {kAlign, 4 * kAlign}},
      AsyncIO::NOT_POLLABLE);
  testReads(
      {{kAlign, 2 * kAlign}, {kAlign, 2 * kAlign}, {kAlign, 4 * kAlign}},
      AsyncIO::NOT_POLLABLE);

  testReads(
      {{0, 5 * 1024 * 1024}, {kAlign, 5 * 1024 * 1024}}, AsyncIO::NOT_POLLABLE);

  testReads(
      {
          {kAlign, 0},
          {kAlign, kAlign},
          {kAlign, 2 * kAlign},
          {kAlign, 20 * kAlign},
          {kAlign, 1024 * 1024},
      },
      AsyncIO::NOT_POLLABLE);
}

TEST(AsyncIO, MultipleAsyncDataPollable) {
  testReads(
      {{kAlign, 2 * kAlign}, {kAlign, 2 * kAlign}, {kAlign, 4 * kAlign}},
      AsyncIO::POLLABLE);
  testReads(
      {{kAlign, 2 * kAlign}, {kAlign, 2 * kAlign}, {kAlign, 4 * kAlign}},
      AsyncIO::POLLABLE);

  testReads(
      {{0, 5 * 1024 * 1024}, {kAlign, 5 * 1024 * 1024}}, AsyncIO::NOT_POLLABLE);

  testReads(
      {
          {kAlign, 0},
          {kAlign, kAlign},
          {kAlign, 2 * kAlign},
          {kAlign, 20 * kAlign},
          {kAlign, 1024 * 1024},
      },
      AsyncIO::NOT_POLLABLE);
}

TEST(AsyncIO, ManyAsyncDataNotPollable) {
  {
    std::vector<TestSpec> v;
    for (int i = 0; i < 1000; i++) {
      v.push_back({off_t(kAlign * i), kAlign});
    }
    testReads(v, AsyncIO::NOT_POLLABLE);
  }
}

TEST(AsyncIO, ManyAsyncDataPollable) {
  {
    std::vector<TestSpec> v;
    for (int i = 0; i < 1000; i++) {
      v.push_back({off_t(kAlign * i), kAlign});
    }
    testReads(v, AsyncIO::POLLABLE);
  }
}

TEST(AsyncIO, NonBlockingWait) {
  AsyncIO aioReader(1, AsyncIO::NOT_POLLABLE);
  AsyncIO::Op op;
  int fd = ::open(tempFile.path().c_str(), O_DIRECT | O_RDONLY);
  PCHECK(fd != -1);
  SCOPE_EXIT {
    ::close(fd);
  };
  size_t size = 2 * kAlign;
  auto buf = allocateAligned(size);
  op.pread(fd, buf.get(), size, 0);
  aioReader.submit(&op);
  EXPECT_EQ(aioReader.pending(), 1);

  folly::Range<AsyncIO::Op**> completed;
  while (completed.empty()) {
    // poll without blocking until the read request completes.
    completed = aioReader.wait(0);
  }
  EXPECT_EQ(completed.size(), 1);

  EXPECT_TRUE(completed[0] == &op);
  ssize_t res = op.result();
  EXPECT_LE(0, res) << folly::errnoStr(-res);
  EXPECT_EQ(size, res);
  EXPECT_EQ(aioReader.pending(), 0);
}

TEST(AsyncIO, Cancel) {
  constexpr size_t kNumOpsBatch1 = 10;
  constexpr size_t kNumOpsBatch2 = 10;

  AsyncIO aioReader(kNumOpsBatch1 + kNumOpsBatch2, AsyncIO::NOT_POLLABLE);
  int fd = ::open(tempFile.path().c_str(), O_DIRECT | O_RDONLY);
  PCHECK(fd != -1);
  SCOPE_EXIT {
    ::close(fd);
  };

  size_t completed = 0;

  std::vector<std::unique_ptr<AsyncIO::Op>> ops;
  std::vector<ManagedBuffer> bufs;
  const auto schedule = [&](size_t n) {
    for (size_t i = 0; i < n; ++i) {
      const size_t size = 2 * kAlign;
      bufs.push_back(allocateAligned(size));

      ops.push_back(std::make_unique<AsyncIO::Op>());
      auto& op = *ops.back();

      op.setNotificationCallback([&](AsyncIOOp*) { ++completed; });
      op.pread(fd, bufs.back().get(), size, 0);
      aioReader.submit(&op);
    }
  };

  // Mix completed and canceled operations for this test.
  // In order to achieve that, schedule in two batches and do partial
  // wait() after the first one.

  schedule(kNumOpsBatch1);
  EXPECT_EQ(aioReader.pending(), kNumOpsBatch1);
  EXPECT_EQ(completed, 0);

  auto result = aioReader.wait(1);
  EXPECT_GE(result.size(), 1);
  EXPECT_EQ(completed, result.size());
  EXPECT_EQ(aioReader.pending(), kNumOpsBatch1 - result.size());

  schedule(kNumOpsBatch2);
  EXPECT_EQ(aioReader.pending(), ops.size() - result.size());
  EXPECT_EQ(completed, result.size());

  auto canceled = aioReader.cancel();
  EXPECT_EQ(canceled.size(), ops.size() - result.size());
  EXPECT_EQ(aioReader.pending(), 0);
  EXPECT_EQ(completed, result.size());

  size_t foundCompleted = 0;
  for (auto& op : ops) {
    if (op->state() == AsyncIOOp::State::COMPLETED) {
      ++foundCompleted;
    } else {
      EXPECT_TRUE(op->state() == AsyncIOOp::State::CANCELED) << *op;
    }
  }
  EXPECT_EQ(foundCompleted, completed);
}
