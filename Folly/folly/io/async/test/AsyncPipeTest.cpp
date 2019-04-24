/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/io/async/AsyncPipe.h>
#include <folly/Memory.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GTest.h>

#include <fcntl.h>

using namespace testing;

namespace {

class TestReadCallback : public folly::AsyncReader::ReadCallback {
 public:
  bool isBufferMovable() noexcept override {
    return movable_;
  }
  void setMovable(bool movable) {
    movable_ = movable;
  }

  void readBufferAvailable(
      std::unique_ptr<folly::IOBuf> readBuf) noexcept override {
    readBuffer_.append(std::move(readBuf));
  }

  void readDataAvailable(size_t len) noexcept override {
    readBuffer_.postallocate(len);
  }

  void getReadBuffer(void** bufReturn, size_t* lenReturn) noexcept override {
    auto res = readBuffer_.preallocate(4000, 65000);
    *bufReturn = res.first;
    *lenReturn = res.second;
  }

  void readEOF() noexcept override {}

  void readErr(const folly::AsyncSocketException&) noexcept override {
    error_ = true;
  }

  std::string getData() {
    auto buf = readBuffer_.move();
    buf->coalesce();
    return std::string((char*)buf->data(), buf->length());
  }

  void reset() {
    movable_ = false;
    error_ = false;
    readBuffer_.clear();
  }

  folly::IOBufQueue readBuffer_{folly::IOBufQueue::cacheChainLength()};
  bool error_{false};
  bool movable_{false};
};

class TestWriteCallback : public folly::AsyncWriter::WriteCallback {
 public:
  void writeSuccess() noexcept override {
    writes_++;
  }

  void writeErr(size_t, const folly::AsyncSocketException&) noexcept override {
    error_ = true;
  }

  void reset() {
    writes_ = 0;
    error_ = false;
  }

  uint32_t writes_{0};
  bool error_{false};
};

class AsyncPipeTest : public Test {
 public:
  void reset(bool movable) {
    reader_.reset();
    readCallback_.reset();
    writer_.reset();
    writeCallback_.reset();

    int rc = pipe(pipeFds_);
    EXPECT_EQ(rc, 0);

    EXPECT_EQ(::fcntl(pipeFds_[0], F_SETFL, O_NONBLOCK), 0);
    EXPECT_EQ(::fcntl(pipeFds_[1], F_SETFL, O_NONBLOCK), 0);
    reader_ = folly::AsyncPipeReader::newReader(&eventBase_, pipeFds_[0]);
    writer_ = folly::AsyncPipeWriter::newWriter(&eventBase_, pipeFds_[1]);

    readCallback_.setMovable(movable);
  }

 protected:
  folly::EventBase eventBase_;
  int pipeFds_[2];
  folly::AsyncPipeReader::UniquePtr reader_;
  folly::AsyncPipeWriter::UniquePtr writer_;
  TestReadCallback readCallback_;
  TestWriteCallback writeCallback_;
};

std::unique_ptr<folly::IOBuf> getBuf(const std::string& data) {
  auto buf = folly::IOBuf::copyBuffer(data.c_str(), data.length());
  return buf;
}

} // namespace

TEST_F(AsyncPipeTest, simple) {
  for (int pass = 0; pass < 2; ++pass) {
    reset(pass % 2 != 0);
    reader_->setReadCB(&readCallback_);
    writer_->write(getBuf("hello"), &writeCallback_);
    writer_->closeOnEmpty();
    eventBase_.loop();
    EXPECT_EQ(readCallback_.getData(), "hello");
    EXPECT_FALSE(readCallback_.error_);
    EXPECT_EQ(writeCallback_.writes_, 1);
    EXPECT_FALSE(writeCallback_.error_);
  }
}

TEST_F(AsyncPipeTest, blocked_writes) {
  for (int pass = 0; pass < 2; ++pass) {
    reset(pass % 2 != 0);
    uint32_t writeAttempts = 0;
    do {
      ++writeAttempts;
      writer_->write(getBuf("hello"), &writeCallback_);
    } while (writeCallback_.writes_ == writeAttempts);
    // there is one blocked write
    writer_->closeOnEmpty();

    reader_->setReadCB(&readCallback_);

    eventBase_.loop();
    std::string expected;
    for (uint32_t i = 0; i < writeAttempts; i++) {
      expected += "hello";
    }
    EXPECT_EQ(readCallback_.getData(), expected);
    EXPECT_FALSE(readCallback_.error_);
    EXPECT_EQ(writeCallback_.writes_, writeAttempts);
    EXPECT_FALSE(writeCallback_.error_);
  }
}

TEST_F(AsyncPipeTest, writeOnClose) {
  for (int pass = 0; pass < 2; ++pass) {
    reset(pass % 2 != 0);
    reader_->setReadCB(&readCallback_);
    writer_->write(getBuf("hello"), &writeCallback_);
    writer_->closeOnEmpty();
    writer_->write(getBuf("hello"), &writeCallback_);
    eventBase_.loop();
    EXPECT_EQ(readCallback_.getData(), "hello");
    EXPECT_FALSE(readCallback_.error_);
    EXPECT_EQ(writeCallback_.writes_, 1);
    EXPECT_TRUE(writeCallback_.error_);
  }
}
