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
#include <folly/io/Cursor.h>
#include <folly/io/async/AsyncSSLSocket.h>
#include <folly/io/async/AsyncSocket.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

#include <string>
#include <vector>

using std::string;
using namespace testing;

namespace folly {

class MockAsyncSSLSocket : public AsyncSSLSocket {
 public:
  static std::shared_ptr<MockAsyncSSLSocket> newSocket(
      const std::shared_ptr<SSLContext>& ctx,
      EventBase* evb) {
    auto sock = std::shared_ptr<MockAsyncSSLSocket>(
        new MockAsyncSSLSocket(ctx, evb), Destructor());
    sock->ssl_.reset(SSL_new(ctx->getSSLCtx()));
    SSL_set_fd(sock->ssl_.get(), -1);
    return sock;
  }

  // Fake constructor sets the state to established without call to connect
  // or accept
  MockAsyncSSLSocket(const std::shared_ptr<SSLContext>& ctx, EventBase* evb)
      : AsyncSocket(evb), AsyncSSLSocket(ctx, evb) {
    state_ = AsyncSocket::StateEnum::ESTABLISHED;
    sslState_ = AsyncSSLSocket::SSLStateEnum::STATE_ESTABLISHED;
  }

  // mock the calls to SSL_write to see the buffer length and contents
  MOCK_METHOD3(sslWriteImpl, int(SSL* ssl, const void* buf, int n));

  // mock the calls to getRawBytesWritten()
  MOCK_CONST_METHOD0(getRawBytesWritten, size_t());

  // public wrapper for protected interface
  WriteResult testPerformWrite(
      const iovec* vec,
      uint32_t count,
      WriteFlags flags,
      uint32_t* countWritten,
      uint32_t* partialWritten) {
    return performWrite(vec, count, flags, countWritten, partialWritten);
  }

  void checkEor(size_t appEor, size_t rawEor) {
    EXPECT_EQ(appEor, appEorByteNo_);
    EXPECT_EQ(rawEor, minEorRawByteNo_);
  }

  void setAppBytesWritten(size_t n) {
    appBytesWritten_ = n;
  }
};

class AsyncSSLSocketWriteTest : public testing::Test {
 public:
  AsyncSSLSocketWriteTest()
      : sslContext_(new SSLContext()),
        sock_(MockAsyncSSLSocket::newSocket(sslContext_, &eventBase_)) {
    for (int i = 0; i < 500; i++) {
      memcpy(source_ + i * 26, "abcdefghijklmnopqrstuvwxyz", 26);
    }
  }

  // Make an iovec containing chunks of the reference text with requested sizes
  // for each chunk
  std::unique_ptr<iovec[]> makeVec(std::vector<uint32_t> sizes) {
    std::unique_ptr<iovec[]> vec(new iovec[sizes.size()]);
    int i = 0;
    int pos = 0;
    for (auto size : sizes) {
      vec[i].iov_base = (void*)(source_ + pos);
      vec[i++].iov_len = size;
      pos += size;
    }
    return vec;
  }

  // Verify that the given buf/pos matches the reference text
  void verifyVec(const void* buf, int n, int pos) {
    ASSERT_EQ(memcmp(source_ + pos, buf, n), 0);
  }

  // Update a vec on partial write
  void consumeVec(iovec* vec, uint32_t countWritten, uint32_t partialWritten) {
    vec[countWritten].iov_base =
        ((char*)vec[countWritten].iov_base) + partialWritten;
    vec[countWritten].iov_len -= partialWritten;
  }

  EventBase eventBase_;
  std::shared_ptr<SSLContext> sslContext_;
  std::shared_ptr<MockAsyncSSLSocket> sock_;
  char source_[26 * 500];
};

// The entire vec fits in one packet
TEST_F(AsyncSSLSocketWriteTest, write_coalescing1) {
  int n = 3;
  auto vec = makeVec({3, 3, 3});
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 9))
      .WillOnce(Invoke([this](SSL*, const void* buf, int m) {
        verifyVec(buf, m, 0);
        return 9;
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
}

// First packet is full, second two go in one packet
TEST_F(AsyncSSLSocketWriteTest, write_coalescing2) {
  int n = 3;
  auto vec = makeVec({1500, 3, 3});
  int pos = 0;
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 6))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
}

// Two exactly full packets (coalesce ends midway through second chunk)
TEST_F(AsyncSSLSocketWriteTest, write_coalescing3) {
  int n = 3;
  auto vec = makeVec({1000, 1000, 1000});
  int pos = 0;
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .Times(2)
      .WillRepeatedly(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
}

// Partial write success midway through a coalesced vec
TEST_F(AsyncSSLSocketWriteTest, write_coalescing4) {
  int n = 5;
  auto vec = makeVec({300, 300, 300, 300, 300});
  int pos = 0;
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += 1000;
        return 1000; /* 500 bytes "pending" */
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, 3);
  EXPECT_EQ(partialWritten, 100);
  consumeVec(vec.get(), countWritten, partialWritten);
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return 500;
      }));
  sock_->testPerformWrite(
      vec.get() + countWritten,
      n - countWritten,
      WriteFlags::NONE,
      &countWritten,
      &partialWritten);
  EXPECT_EQ(countWritten, 2);
  EXPECT_EQ(partialWritten, 0);
}

// coalesce ends exactly on a buffer boundary
TEST_F(AsyncSSLSocketWriteTest, write_coalescing5) {
  int n = 3;
  auto vec = makeVec({1000, 500, 500});
  int pos = 0;
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, 3);
  EXPECT_EQ(partialWritten, 0);
}

// partial write midway through first chunk
TEST_F(AsyncSSLSocketWriteTest, write_coalescing6) {
  int n = 2;
  auto vec = makeVec({1000, 500});
  int pos = 0;
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += 700;
        return 700;
      }));
  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::NONE, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, 0);
  EXPECT_EQ(partialWritten, 700);
  consumeVec(vec.get(), countWritten, partialWritten);
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 800))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  sock_->testPerformWrite(
      vec.get() + countWritten,
      n - countWritten,
      WriteFlags::NONE,
      &countWritten,
      &partialWritten);
  EXPECT_EQ(countWritten, 2);
  EXPECT_EQ(partialWritten, 0);
}

// Repeat coalescing2 with WriteFlags::EOR
TEST_F(AsyncSSLSocketWriteTest, write_with_eor1) {
  int n = 3;
  auto vec = makeVec({1500, 3, 3});
  int pos = 0;
  const size_t initAppBytesWritten = 500;
  const size_t appEor = initAppBytesWritten + 1506;

  sock_->setAppBytesWritten(initAppBytesWritten);
  EXPECT_FALSE(sock_->isEorTrackingEnabled());
  sock_->setEorTracking(true);
  EXPECT_TRUE(sock_->isEorTrackingEnabled());

  EXPECT_CALL(*(sock_.get()), getRawBytesWritten())
      // rawBytesWritten after writting initAppBytesWritten + 1500
      // + some random SSL overhead
      .WillOnce(Return(3600u))
      // rawBytesWritten after writting last 6 bytes
      // + some random SSL overhead
      .WillOnce(Return(3728u));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([=, &pos](SSL*, const void* buf, int m) {
        // the first 1500 does not have the EOR byte
        sock_->checkEor(0, 0);
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 6))
      .WillOnce(Invoke([=, &pos](SSL*, const void* buf, int m) {
        sock_->checkEor(appEor, 3600 + m);
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));

  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::EOR, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
  sock_->checkEor(0, 0);
}

// coalescing with left over at the last chunk
// WriteFlags::EOR turned on
TEST_F(AsyncSSLSocketWriteTest, write_with_eor2) {
  int n = 3;
  auto vec = makeVec({600, 600, 600});
  int pos = 0;
  const size_t initAppBytesWritten = 500;
  const size_t appEor = initAppBytesWritten + 1800;

  sock_->setAppBytesWritten(initAppBytesWritten);
  sock_->setEorTracking(true);

  EXPECT_CALL(*(sock_.get()), getRawBytesWritten())
      // rawBytesWritten after writting initAppBytesWritten +  1500 bytes
      // + some random SSL overhead
      .WillOnce(Return(3600))
      // rawBytesWritten after writting last 300 bytes
      // + some random SSL overhead
      .WillOnce(Return(4100));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1500))
      .WillOnce(Invoke([=, &pos](SSL*, const void* buf, int m) {
        // the first 1500 does not have the EOR byte
        sock_->checkEor(0, 0);
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 300))
      .WillOnce(Invoke([=, &pos](SSL*, const void* buf, int m) {
        sock_->checkEor(appEor, 3600 + m);
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));

  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::EOR, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
  sock_->checkEor(0, 0);
}

// WriteFlags::EOR set
// One buf in iovec
// Partial write at 1000-th byte
TEST_F(AsyncSSLSocketWriteTest, write_with_eor3) {
  int n = 1;
  auto vec = makeVec({1600});
  int pos = 0;
  static constexpr size_t initAppBytesWritten = 500;
  static constexpr size_t appEor = initAppBytesWritten + 1600;

  sock_->setAppBytesWritten(initAppBytesWritten);
  sock_->setEorTracking(true);

  EXPECT_CALL(*(sock_.get()), getRawBytesWritten())
      // rawBytesWritten after the initAppBytesWritten
      // + some random SSL overhead
      .WillOnce(Return(2000))
      // rawBytesWritten after the initAppBytesWritten + 1000 (with 100
      // overhead)
      // + some random SSL overhead
      .WillOnce(Return(3100));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 1600))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        sock_->checkEor(appEor, 2000 + m);
        verifyVec(buf, m, pos);
        pos += 1000;
        return 1000;
      }));

  uint32_t countWritten = 0;
  uint32_t partialWritten = 0;
  sock_->testPerformWrite(
      vec.get(), n, WriteFlags::EOR, &countWritten, &partialWritten);
  EXPECT_EQ(countWritten, 0);
  EXPECT_EQ(partialWritten, 1000);
  sock_->checkEor(appEor, 2000 + 1600);
  consumeVec(vec.get(), countWritten, partialWritten);

  EXPECT_CALL(*(sock_.get()), getRawBytesWritten())
      .WillOnce(Return(3100))
      .WillOnce(Return(3800));
  EXPECT_CALL(*(sock_.get()), sslWriteImpl(_, _, 600))
      .WillOnce(Invoke([this, &pos](SSL*, const void* buf, int m) {
        sock_->checkEor(appEor, 3100 + m);
        verifyVec(buf, m, pos);
        pos += m;
        return m;
      }));
  sock_->testPerformWrite(
      vec.get() + countWritten,
      n - countWritten,
      WriteFlags::EOR,
      &countWritten,
      &partialWritten);
  EXPECT_EQ(countWritten, n);
  EXPECT_EQ(partialWritten, 0);
  sock_->checkEor(0, 0);
}

} // namespace folly
