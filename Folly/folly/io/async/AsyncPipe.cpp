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

#include <folly/FileUtil.h>
#include <folly/io/async/AsyncSocketException.h>

using folly::IOBuf;
using folly::IOBufQueue;
using std::string;
using std::unique_ptr;

namespace folly {

AsyncPipeReader::~AsyncPipeReader() {
  close();
}

void AsyncPipeReader::failRead(const AsyncSocketException& ex) {
  VLOG(5) << "AsyncPipeReader(this=" << this << ", fd=" << fd_
          << "): failed while reading: " << ex.what();

  DCHECK(readCallback_ != nullptr);
  AsyncReader::ReadCallback* callback = readCallback_;
  readCallback_ = nullptr;
  callback->readErr(ex);
  close();
}

void AsyncPipeReader::close() {
  unregisterHandler();
  if (fd_ >= 0) {
    changeHandlerFD(-1);

    if (closeCb_) {
      closeCb_(fd_);
    } else {
      ::close(fd_);
    }
    fd_ = -1;
  }
}

void AsyncPipeReader::handlerReady(uint16_t events) noexcept {
  DestructorGuard dg(this);
  CHECK(events & EventHandler::READ);

  VLOG(5) << "AsyncPipeReader::handlerReady() this=" << this << ", fd=" << fd_;
  assert(readCallback_ != nullptr);

  while (readCallback_) {
    // - What API does callback support?
    const auto movable = readCallback_->isBufferMovable(); // noexcept

    // Get the buffer to read into.
    void* buf = nullptr;
    size_t buflen = 0;
    std::unique_ptr<IOBuf> ioBuf;

    if (movable) {
      ioBuf = IOBuf::create(readCallback_->maxBufferSize());
      buf = ioBuf->writableBuffer();
      buflen = ioBuf->capacity();
    } else {
      try {
        readCallback_->getReadBuffer(&buf, &buflen);
      } catch (const std::exception& ex) {
        AsyncSocketException aex(
            AsyncSocketException::BAD_ARGS,
            string("ReadCallback::getReadBuffer() "
                   "threw exception: ") +
                ex.what());
        failRead(aex);
        return;
      } catch (...) {
        AsyncSocketException aex(
            AsyncSocketException::BAD_ARGS,
            string("ReadCallback::getReadBuffer() "
                   "threw non-exception type"));
        failRead(aex);
        return;
      }
      if (buf == nullptr || buflen == 0) {
        AsyncSocketException aex(
            AsyncSocketException::INVALID_STATE,
            string("ReadCallback::getReadBuffer() "
                   "returned empty buffer"));
        failRead(aex);
        return;
      }
    }

    // Perform the read
    ssize_t bytesRead = folly::readNoInt(fd_, buf, buflen);

    if (bytesRead > 0) {
      if (movable) {
        ioBuf->append(std::size_t(bytesRead));
        readCallback_->readBufferAvailable(std::move(ioBuf));
      } else {
        readCallback_->readDataAvailable(size_t(bytesRead));
      }
      // Fall through and continue around the loop if the read
      // completely filled the available buffer.
      // Note that readCallback_ may have been uninstalled or changed inside
      // readDataAvailable().
      if (static_cast<size_t>(bytesRead) < buflen) {
        return;
      }
    } else if (bytesRead < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
      // No more data to read right now.
      return;
    } else if (bytesRead < 0) {
      AsyncSocketException ex(
          AsyncSocketException::INVALID_STATE, "read failed", errno);
      failRead(ex);
      return;
    } else {
      assert(bytesRead == 0);
      // EOF

      unregisterHandler();
      AsyncReader::ReadCallback* callback = readCallback_;
      readCallback_ = nullptr;
      callback->readEOF();
      return;
    }
    // Max reads per loop?
  }
}

void AsyncPipeWriter::write(
    unique_ptr<folly::IOBuf> buf,
    AsyncWriter::WriteCallback* callback) {
  if (closed()) {
    if (callback) {
      AsyncSocketException ex(
          AsyncSocketException::NOT_OPEN, "attempt to write to closed pipe");
      callback->writeErr(0, ex);
    }
    return;
  }
  bool wasEmpty = (queue_.empty());
  folly::IOBufQueue iobq;
  iobq.append(std::move(buf));
  std::pair<folly::IOBufQueue, AsyncWriter::WriteCallback*> p(
      std::move(iobq), callback);
  queue_.emplace_back(std::move(p));
  if (wasEmpty) {
    handleWrite();
  } else {
    CHECK(!queue_.empty());
    CHECK(isHandlerRegistered());
  }
}

void AsyncPipeWriter::writeChain(
    folly::AsyncWriter::WriteCallback* callback,
    std::unique_ptr<folly::IOBuf>&& buf,
    WriteFlags) {
  write(std::move(buf), callback);
}

void AsyncPipeWriter::closeOnEmpty() {
  VLOG(5) << "close on empty";
  if (queue_.empty()) {
    closeNow();
  } else {
    closeOnEmpty_ = true;
    CHECK(isHandlerRegistered());
  }
}

void AsyncPipeWriter::closeNow() {
  VLOG(5) << "close now";
  if (!queue_.empty()) {
    failAllWrites(AsyncSocketException(
        AsyncSocketException::NOT_OPEN, "closed with pending writes"));
  }
  if (fd_ >= 0) {
    unregisterHandler();
    changeHandlerFD(-1);
    if (closeCb_) {
      closeCb_(fd_);
    } else {
      close(fd_);
    }
    fd_ = -1;
  }
}

void AsyncPipeWriter::failAllWrites(const AsyncSocketException& ex) {
  DestructorGuard dg(this);
  while (!queue_.empty()) {
    // the first entry of the queue could have had a partial write, but needs to
    // be tracked.
    if (queue_.front().second) {
      queue_.front().second->writeErr(0, ex);
    }
    queue_.pop_front();
  }
}

void AsyncPipeWriter::handlerReady(uint16_t events) noexcept {
  CHECK(events & EventHandler::WRITE);

  handleWrite();
}

void AsyncPipeWriter::handleWrite() {
  DestructorGuard dg(this);
  assert(!queue_.empty());
  do {
    auto& front = queue_.front();
    folly::IOBufQueue& curQueue = front.first;
    DCHECK(!curQueue.empty());
    // someday, support writev.  The logic for partial writes is a bit complex
    const IOBuf* head = curQueue.front();
    CHECK(head->length());
    ssize_t rc = folly::writeNoInt(fd_, head->data(), head->length());
    if (rc < 0) {
      if (errno == EAGAIN || errno == EWOULDBLOCK) {
        // pipe is full
        VLOG(5) << "write blocked";
        registerHandler(EventHandler::WRITE);
        return;
      } else {
        failAllWrites(AsyncSocketException(
            AsyncSocketException::INTERNAL_ERROR, "write failed", errno));
        closeNow();
        return;
      }
    } else if (rc == 0) {
      registerHandler(EventHandler::WRITE);
      return;
    }
    curQueue.trimStart(size_t(rc));
    if (curQueue.empty()) {
      auto cb = front.second;
      queue_.pop_front();
      if (cb) {
        cb->writeSuccess();
      }
    } else {
      VLOG(5) << "partial write blocked";
    }
  } while (!queue_.empty());

  if (closeOnEmpty_) {
    closeNow();
  } else {
    unregisterHandler();
  }
}

} // namespace folly
