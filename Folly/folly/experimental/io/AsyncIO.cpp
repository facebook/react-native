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

#include <sys/eventfd.h>
#include <cerrno>
#include <ostream>
#include <stdexcept>
#include <string>

#include <boost/intrusive/parent_from_member.hpp>
#include <glog/logging.h>

#include <folly/Exception.h>
#include <folly/Format.h>
#include <folly/Likely.h>
#include <folly/String.h>
#include <folly/portability/Unistd.h>

namespace folly {

AsyncIOOp::AsyncIOOp(NotificationCallback cb)
    : cb_(std::move(cb)), state_(State::UNINITIALIZED), result_(-EINVAL) {
  memset(&iocb_, 0, sizeof(iocb_));
}

void AsyncIOOp::reset(NotificationCallback cb) {
  CHECK_NE(state_, State::PENDING);
  cb_ = std::move(cb);
  state_ = State::UNINITIALIZED;
  result_ = -EINVAL;
  memset(&iocb_, 0, sizeof(iocb_));
}

AsyncIOOp::~AsyncIOOp() {
  CHECK_NE(state_, State::PENDING);
}

void AsyncIOOp::start() {
  DCHECK_EQ(state_, State::INITIALIZED);
  state_ = State::PENDING;
}

void AsyncIOOp::complete(ssize_t result) {
  DCHECK_EQ(state_, State::PENDING);
  state_ = State::COMPLETED;
  result_ = result;
  if (cb_) {
    cb_(this);
  }
}

void AsyncIOOp::cancel() {
  DCHECK_EQ(state_, State::PENDING);
  state_ = State::CANCELED;
}

ssize_t AsyncIOOp::result() const {
  CHECK_EQ(state_, State::COMPLETED);
  return result_;
}

void AsyncIOOp::pread(int fd, void* buf, size_t size, off_t start) {
  init();
  io_prep_pread(&iocb_, fd, buf, size, start);
}

void AsyncIOOp::pread(int fd, Range<unsigned char*> range, off_t start) {
  pread(fd, range.begin(), range.size(), start);
}

void AsyncIOOp::preadv(int fd, const iovec* iov, int iovcnt, off_t start) {
  init();
  io_prep_preadv(&iocb_, fd, iov, iovcnt, start);
}

void AsyncIOOp::pwrite(int fd, const void* buf, size_t size, off_t start) {
  init();
  io_prep_pwrite(&iocb_, fd, const_cast<void*>(buf), size, start);
}

void AsyncIOOp::pwrite(int fd, Range<const unsigned char*> range, off_t start) {
  pwrite(fd, range.begin(), range.size(), start);
}

void AsyncIOOp::pwritev(int fd, const iovec* iov, int iovcnt, off_t start) {
  init();
  io_prep_pwritev(&iocb_, fd, iov, iovcnt, start);
}

void AsyncIOOp::init() {
  CHECK_EQ(state_, State::UNINITIALIZED);
  state_ = State::INITIALIZED;
}

AsyncIO::AsyncIO(size_t capacity, PollMode pollMode) : capacity_(capacity) {
  CHECK_GT(capacity_, 0);
  completed_.reserve(capacity_);
  if (pollMode == POLLABLE) {
    pollFd_ = eventfd(0, EFD_NONBLOCK);
    checkUnixError(pollFd_, "AsyncIO: eventfd creation failed");
  }
}

AsyncIO::~AsyncIO() {
  CHECK_EQ(pending_, 0);
  if (ctx_) {
    int rc = io_queue_release(ctx_);
    CHECK_EQ(rc, 0) << "io_queue_release: " << errnoStr(-rc);
  }
  if (pollFd_ != -1) {
    CHECK_ERR(close(pollFd_));
  }
}

void AsyncIO::decrementPending() {
  auto p = pending_.fetch_add(-1, std::memory_order_acq_rel);
  DCHECK_GE(p, 1);
}

void AsyncIO::initializeContext() {
  if (!ctxSet_.load(std::memory_order_acquire)) {
    std::lock_guard<std::mutex> lock(initMutex_);
    if (!ctxSet_.load(std::memory_order_relaxed)) {
      int rc = io_queue_init(capacity_, &ctx_);
      // returns negative errno
      if (rc == -EAGAIN) {
        long aio_nr, aio_max;
        std::unique_ptr<FILE, int (*)(FILE*)> fp(
            fopen("/proc/sys/fs/aio-nr", "r"), fclose);
        PCHECK(fp);
        CHECK_EQ(fscanf(fp.get(), "%ld", &aio_nr), 1);

        std::unique_ptr<FILE, int (*)(FILE*)> aio_max_fp(
            fopen("/proc/sys/fs/aio-max-nr", "r"), fclose);
        PCHECK(aio_max_fp);
        CHECK_EQ(fscanf(aio_max_fp.get(), "%ld", &aio_max), 1);

        LOG(ERROR) << "No resources for requested capacity of " << capacity_;
        LOG(ERROR) << "aio_nr " << aio_nr << ", aio_max_nr " << aio_max;
      }

      checkKernelError(rc, "AsyncIO: io_queue_init failed");
      DCHECK(ctx_);
      ctxSet_.store(true, std::memory_order_release);
    }
  }
}

void AsyncIO::submit(Op* op) {
  CHECK_EQ(op->state(), Op::State::INITIALIZED);
  initializeContext(); // on demand

  // We can increment past capacity, but we'll clean up after ourselves.
  auto p = pending_.fetch_add(1, std::memory_order_acq_rel);
  if (p >= capacity_) {
    decrementPending();
    throw std::range_error("AsyncIO: too many pending requests");
  }
  iocb* cb = &op->iocb_;
  cb->data = nullptr; // unused
  if (pollFd_ != -1) {
    io_set_eventfd(cb, pollFd_);
  }
  int rc = io_submit(ctx_, 1, &cb);
  if (rc < 0) {
    decrementPending();
    throwSystemErrorExplicit(-rc, "AsyncIO: io_submit failed");
  }
  submitted_++;
  DCHECK_EQ(rc, 1);
  op->start();
}

Range<AsyncIO::Op**> AsyncIO::wait(size_t minRequests) {
  CHECK(ctx_);
  CHECK_EQ(pollFd_, -1) << "wait() only allowed on non-pollable object";
  auto p = pending_.load(std::memory_order_acquire);
  CHECK_LE(minRequests, p);
  return doWait(WaitType::COMPLETE, minRequests, p, completed_);
}

Range<AsyncIO::Op**> AsyncIO::cancel() {
  CHECK(ctx_);
  auto p = pending_.load(std::memory_order_acquire);
  return doWait(WaitType::CANCEL, p, p, canceled_);
}

Range<AsyncIO::Op**> AsyncIO::pollCompleted() {
  CHECK(ctx_);
  CHECK_NE(pollFd_, -1) << "pollCompleted() only allowed on pollable object";
  uint64_t numEvents;
  // This sets the eventFd counter to 0, see
  // http://www.kernel.org/doc/man-pages/online/pages/man2/eventfd.2.html
  ssize_t rc;
  do {
    rc = ::read(pollFd_, &numEvents, 8);
  } while (rc == -1 && errno == EINTR);
  if (UNLIKELY(rc == -1 && errno == EAGAIN)) {
    return Range<Op**>(); // nothing completed
  }
  checkUnixError(rc, "AsyncIO: read from event fd failed");
  DCHECK_EQ(rc, 8);

  DCHECK_GT(numEvents, 0);
  DCHECK_LE(numEvents, pending_);

  // Don't reap more than numEvents, as we've just reset the counter to 0.
  return doWait(WaitType::COMPLETE, numEvents, numEvents, completed_);
}

Range<AsyncIO::Op**> AsyncIO::doWait(
    WaitType type,
    size_t minRequests,
    size_t maxRequests,
    std::vector<Op*>& result) {
  io_event events[maxRequests];

  // Unfortunately, Linux AIO doesn't implement io_cancel, so even for
  // WaitType::CANCEL we have to wait for IO completion.
  size_t count = 0;
  do {
    int ret;
    do {
      // GOTCHA: io_getevents() may returns less than min_nr results if
      // interrupted after some events have been read (if before, -EINTR
      // is returned).
      ret = io_getevents(
          ctx_,
          minRequests - count,
          maxRequests - count,
          events + count,
          /* timeout */ nullptr); // wait forever
    } while (ret == -EINTR);
    // Check as may not be able to recover without leaking events.
    CHECK_GE(ret, 0) << "AsyncIO: io_getevents failed with error "
                     << errnoStr(-ret);
    count += ret;
  } while (count < minRequests);
  DCHECK_LE(count, maxRequests);

  result.clear();
  for (size_t i = 0; i < count; ++i) {
    DCHECK(events[i].obj);
    Op* op = boost::intrusive::get_parent_from_member(
        events[i].obj, &AsyncIOOp::iocb_);
    decrementPending();
    switch (type) {
      case WaitType::COMPLETE:
        op->complete(events[i].res);
        break;
      case WaitType::CANCEL:
        op->cancel();
        break;
    }
    result.push_back(op);
  }

  return range(result);
}

AsyncIOQueue::AsyncIOQueue(AsyncIO* asyncIO) : asyncIO_(asyncIO) {}

AsyncIOQueue::~AsyncIOQueue() {
  CHECK_EQ(asyncIO_->pending(), 0);
}

void AsyncIOQueue::submit(AsyncIOOp* op) {
  submit([op]() { return op; });
}

void AsyncIOQueue::submit(OpFactory op) {
  queue_.push_back(op);
  maybeDequeue();
}

void AsyncIOQueue::onCompleted(AsyncIOOp* /* op */) {
  maybeDequeue();
}

void AsyncIOQueue::maybeDequeue() {
  while (!queue_.empty() && asyncIO_->pending() < asyncIO_->capacity()) {
    auto& opFactory = queue_.front();
    auto op = opFactory();
    queue_.pop_front();

    // Interpose our completion callback
    auto& nextCb = op->notificationCallback();
    op->setNotificationCallback([this, nextCb](AsyncIOOp* op2) {
      this->onCompleted(op2);
      if (nextCb) {
        nextCb(op2);
      }
    });

    asyncIO_->submit(op);
  }
}

// debugging helpers:

namespace {

#define X(c) \
  case c:    \
    return #c

const char* asyncIoOpStateToString(AsyncIOOp::State state) {
  switch (state) {
    X(AsyncIOOp::State::UNINITIALIZED);
    X(AsyncIOOp::State::INITIALIZED);
    X(AsyncIOOp::State::PENDING);
    X(AsyncIOOp::State::COMPLETED);
    X(AsyncIOOp::State::CANCELED);
  }
  return "<INVALID AsyncIOOp::State>";
}

const char* iocbCmdToString(short int cmd_short) {
  io_iocb_cmd cmd = static_cast<io_iocb_cmd>(cmd_short);
  switch (cmd) {
    X(IO_CMD_PREAD);
    X(IO_CMD_PWRITE);
    X(IO_CMD_FSYNC);
    X(IO_CMD_FDSYNC);
    X(IO_CMD_POLL);
    X(IO_CMD_NOOP);
    X(IO_CMD_PREADV);
    X(IO_CMD_PWRITEV);
  };
  return "<INVALID io_iocb_cmd>";
}

#undef X

std::string fd2name(int fd) {
  std::string path = folly::to<std::string>("/proc/self/fd/", fd);
  char link[PATH_MAX];
  const ssize_t length =
      std::max<ssize_t>(readlink(path.c_str(), link, PATH_MAX), 0);
  return path.assign(link, length);
}

std::ostream& operator<<(std::ostream& os, const iocb& cb) {
  os << folly::format(
      "data={}, key={}, opcode={}, reqprio={}, fd={}, f={}, ",
      cb.data,
      cb.key,
      iocbCmdToString(cb.aio_lio_opcode),
      cb.aio_reqprio,
      cb.aio_fildes,
      fd2name(cb.aio_fildes));

  switch (cb.aio_lio_opcode) {
    case IO_CMD_PREAD:
    case IO_CMD_PWRITE:
      os << folly::format(
          "buf={}, offset={}, nbytes={}, ",
          cb.u.c.buf,
          cb.u.c.offset,
          cb.u.c.nbytes);
      break;
    default:
      os << "[TODO: write debug string for "
         << iocbCmdToString(cb.aio_lio_opcode) << "] ";
      break;
  }

  return os;
}

} // namespace

std::ostream& operator<<(std::ostream& os, const AsyncIOOp& op) {
  os << "{" << op.state_ << ", ";

  if (op.state_ != AsyncIOOp::State::UNINITIALIZED) {
    os << op.iocb_;
  }

  if (op.state_ == AsyncIOOp::State::COMPLETED) {
    os << "result=" << op.result_;
    if (op.result_ < 0) {
      os << " (" << errnoStr(-op.result_) << ')';
    }
    os << ", ";
  }

  return os << "}";
}

std::ostream& operator<<(std::ostream& os, AsyncIOOp::State state) {
  return os << asyncIoOpStateToString(state);
}

} // namespace folly
