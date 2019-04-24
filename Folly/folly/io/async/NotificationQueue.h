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

#pragma once

#include <sys/types.h>

#include <algorithm>
#include <iterator>
#include <memory>
#include <stdexcept>
#include <utility>

#include <boost/intrusive/slist.hpp>
#include <folly/Exception.h>
#include <folly/FileUtil.h>
#include <folly/Likely.h>
#include <folly/ScopeGuard.h>
#include <folly/SpinLock.h>
#include <folly/io/async/DelayedDestruction.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventHandler.h>
#include <folly/io/async/Request.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>

#include <glog/logging.h>

#if __linux__ && !__ANDROID__
#define FOLLY_HAVE_EVENTFD
#include <folly/io/async/EventFDWrapper.h>
#endif

namespace folly {

/**
 * A producer-consumer queue for passing messages between EventBase threads.
 *
 * Messages can be added to the queue from any thread.  Multiple consumers may
 * listen to the queue from multiple EventBase threads.
 *
 * A NotificationQueue may not be destroyed while there are still consumers
 * registered to receive events from the queue.  It is the user's
 * responsibility to ensure that all consumers are unregistered before the
 * queue is destroyed.
 *
 * MessageT should be MoveConstructible (i.e., must support either a move
 * constructor or a copy constructor, or both).  Ideally it's move constructor
 * (or copy constructor if no move constructor is provided) should never throw
 * exceptions.  If the constructor may throw, the consumers could end up
 * spinning trying to move a message off the queue and failing, and then
 * retrying.
 */
template <typename MessageT>
class NotificationQueue {
  struct Node : public boost::intrusive::slist_base_hook<
                    boost::intrusive::cache_last<true>> {
    template <typename MessageTT>
    Node(MessageTT&& msg, std::shared_ptr<RequestContext> ctx)
        : msg_(std::forward<MessageTT>(msg)), ctx_(std::move(ctx)) {}
    MessageT msg_;
    std::shared_ptr<RequestContext> ctx_;
  };

 public:
  /**
   * A callback interface for consuming messages from the queue as they arrive.
   */
  class Consumer : public DelayedDestruction, private EventHandler {
   public:
    enum : uint16_t { kDefaultMaxReadAtOnce = 10 };

    Consumer()
        : queue_(nullptr),
          destroyedFlagPtr_(nullptr),
          maxReadAtOnce_(kDefaultMaxReadAtOnce) {}

    // create a consumer in-place, without the need to build new class
    template <typename TCallback>
    static std::unique_ptr<Consumer, DelayedDestruction::Destructor> make(
        TCallback&& callback);

    /**
     * messageAvailable() will be invoked whenever a new
     * message is available from the pipe.
     */
    virtual void messageAvailable(MessageT&& message) noexcept = 0;

    /**
     * Begin consuming messages from the specified queue.
     *
     * messageAvailable() will be called whenever a message is available.  This
     * consumer will continue to consume messages until stopConsuming() is
     * called.
     *
     * A Consumer may only consume messages from a single NotificationQueue at
     * a time.  startConsuming() should not be called if this consumer is
     * already consuming.
     */
    void startConsuming(EventBase* eventBase, NotificationQueue* queue) {
      init(eventBase, queue);
      registerHandler(READ | PERSIST);
    }

    /**
     * Same as above but registers this event handler as internal so that it
     * doesn't count towards the pending reader count for the IOLoop.
     */
    void startConsumingInternal(
        EventBase* eventBase,
        NotificationQueue* queue) {
      init(eventBase, queue);
      registerInternalHandler(READ | PERSIST);
    }

    /**
     * Stop consuming messages.
     *
     * startConsuming() may be called again to resume consumption of messages
     * at a later point in time.
     */
    void stopConsuming();

    /**
     * Consume messages off the queue until it is empty. No messages may be
     * added to the queue while it is draining, so that the process is bounded.
     * To that end, putMessage/tryPutMessage will throw an std::runtime_error,
     * and tryPutMessageNoThrow will return false.
     *
     * @returns true if the queue was drained, false otherwise. In practice,
     * this will only fail if someone else is already draining the queue.
     */
    bool consumeUntilDrained(size_t* numConsumed = nullptr) noexcept;

    /**
     * Get the NotificationQueue that this consumer is currently consuming
     * messages from.  Returns nullptr if the consumer is not currently
     * consuming events from any queue.
     */
    NotificationQueue* getCurrentQueue() const {
      return queue_;
    }

    /**
     * Set a limit on how many messages this consumer will read each iteration
     * around the event loop.
     *
     * This helps rate-limit how much work the Consumer will do each event loop
     * iteration, to prevent it from starving other event handlers.
     *
     * A limit of 0 means no limit will be enforced.  If unset, the limit
     * defaults to kDefaultMaxReadAtOnce (defined to 10 above).
     */
    void setMaxReadAtOnce(uint32_t maxAtOnce) {
      maxReadAtOnce_ = maxAtOnce;
    }
    uint32_t getMaxReadAtOnce() const {
      return maxReadAtOnce_;
    }

    EventBase* getEventBase() {
      return base_;
    }

    void handlerReady(uint16_t events) noexcept override;

   protected:
    void destroy() override;

    ~Consumer() override {}

   private:
    /**
     * Consume messages off the the queue until
     *   - the queue is empty (1), or
     *   - until the consumer is destroyed, or
     *   - until the consumer is uninstalled, or
     *   - an exception is thrown in the course of dequeueing, or
     *   - unless isDrain is true, until the maxReadAtOnce_ limit is hit
     *
     * (1) Well, maybe. See logic/comments around "wasEmpty" in implementation.
     */
    void consumeMessages(bool isDrain, size_t* numConsumed = nullptr) noexcept;

    void setActive(bool active, bool shouldLock = false) {
      if (!queue_) {
        active_ = active;
        return;
      }
      if (shouldLock) {
        queue_->spinlock_.lock();
      }
      if (!active_ && active) {
        ++queue_->numActiveConsumers_;
      } else if (active_ && !active) {
        --queue_->numActiveConsumers_;
      }
      active_ = active;
      if (shouldLock) {
        queue_->spinlock_.unlock();
      }
    }
    void init(EventBase* eventBase, NotificationQueue* queue);

    NotificationQueue* queue_;
    bool* destroyedFlagPtr_;
    uint32_t maxReadAtOnce_;
    EventBase* base_;
    bool active_{false};
  };

  class SimpleConsumer {
   public:
    explicit SimpleConsumer(NotificationQueue& queue) : queue_(queue) {
      ++queue_.numConsumers_;
    }

    ~SimpleConsumer() {
      --queue_.numConsumers_;
    }

    int getFd() const {
      return queue_.eventfd_ >= 0 ? queue_.eventfd_ : queue_.pipeFds_[0];
    }

    template <typename F>
    void consumeUntilDrained(F&& foreach);

   private:
    NotificationQueue& queue_;
  };

  enum class FdType {
    PIPE,
#ifdef FOLLY_HAVE_EVENTFD
    EVENTFD,
#endif
  };

  /**
   * Create a new NotificationQueue.
   *
   * If the maxSize parameter is specified, this sets the maximum queue size
   * that will be enforced by tryPutMessage().  (This size is advisory, and may
   * be exceeded if producers explicitly use putMessage() instead of
   * tryPutMessage().)
   *
   * The fdType parameter determines the type of file descriptor used
   * internally to signal message availability.  The default (eventfd) is
   * preferable for performance and because it won't fail when the queue gets
   * too long.  It is not available on on older and non-linux kernels, however.
   * In this case the code will fall back to using a pipe, the parameter is
   * mostly for testing purposes.
   */
  explicit NotificationQueue(
      uint32_t maxSize = 0,
#ifdef FOLLY_HAVE_EVENTFD
      FdType fdType = FdType::EVENTFD)
#else
      FdType fdType = FdType::PIPE)
#endif
      : eventfd_(-1),
        pipeFds_{-1, -1},
        advisoryMaxQueueSize_(maxSize),
        pid_(pid_t(getpid())) {

#ifdef FOLLY_HAVE_EVENTFD
    if (fdType == FdType::EVENTFD) {
      eventfd_ = eventfd(0, EFD_CLOEXEC | EFD_NONBLOCK);
      if (eventfd_ == -1) {
        if (errno == ENOSYS || errno == EINVAL) {
          // eventfd not availalble
          LOG(ERROR) << "failed to create eventfd for NotificationQueue: "
                     << errno << ", falling back to pipe mode (is your kernel "
                     << "> 2.6.30?)";
          fdType = FdType::PIPE;
        } else {
          // some other error
          folly::throwSystemError(
              "Failed to create eventfd for "
              "NotificationQueue",
              errno);
        }
      }
    }
#endif
    if (fdType == FdType::PIPE) {
      if (pipe(pipeFds_)) {
        folly::throwSystemError(
            "Failed to create pipe for NotificationQueue", errno);
      }
      try {
        // put both ends of the pipe into non-blocking mode
        if (fcntl(pipeFds_[0], F_SETFL, O_RDONLY | O_NONBLOCK) != 0) {
          folly::throwSystemError(
              "failed to put NotificationQueue pipe read "
              "endpoint into non-blocking mode",
              errno);
        }
        if (fcntl(pipeFds_[1], F_SETFL, O_WRONLY | O_NONBLOCK) != 0) {
          folly::throwSystemError(
              "failed to put NotificationQueue pipe write "
              "endpoint into non-blocking mode",
              errno);
        }
      } catch (...) {
        ::close(pipeFds_[0]);
        ::close(pipeFds_[1]);
        throw;
      }
    }
  }

  ~NotificationQueue() {
    std::unique_ptr<Node> data;
    while (!queue_.empty()) {
      data.reset(&queue_.front());
      queue_.pop_front();
    }
    if (eventfd_ >= 0) {
      ::close(eventfd_);
      eventfd_ = -1;
    }
    if (pipeFds_[0] >= 0) {
      ::close(pipeFds_[0]);
      pipeFds_[0] = -1;
    }
    if (pipeFds_[1] >= 0) {
      ::close(pipeFds_[1]);
      pipeFds_[1] = -1;
    }
  }

  /**
   * Set the advisory maximum queue size.
   *
   * This maximum queue size affects calls to tryPutMessage().  Message
   * producers can still use the putMessage() call to unconditionally put a
   * message on the queue, ignoring the configured maximum queue size.  This
   * can cause the queue size to exceed the configured maximum.
   */
  void setMaxQueueSize(uint32_t max) {
    advisoryMaxQueueSize_ = max;
  }

  /**
   * Attempt to put a message on the queue if the queue is not already full.
   *
   * If the queue is full, a std::overflow_error will be thrown.  The
   * setMaxQueueSize() function controls the maximum queue size.
   *
   * If the queue is currently draining, an std::runtime_error will be thrown.
   *
   * This method may contend briefly on a spinlock if many threads are
   * concurrently accessing the queue, but for all intents and purposes it will
   * immediately place the message on the queue and return.
   *
   * tryPutMessage() may throw std::bad_alloc if memory allocation fails, and
   * may throw any other exception thrown by the MessageT move/copy
   * constructor.
   */
  template <typename MessageTT>
  void tryPutMessage(MessageTT&& message) {
    putMessageImpl(std::forward<MessageTT>(message), advisoryMaxQueueSize_);
  }

  /**
   * No-throw versions of the above.  Instead returns true on success, false on
   * failure.
   *
   * Only std::overflow_error (the common exception case) and std::runtime_error
   * (which indicates that the queue is being drained) are prevented from being
   * thrown. User code must still catch std::bad_alloc errors.
   */
  template <typename MessageTT>
  bool tryPutMessageNoThrow(MessageTT&& message) {
    return putMessageImpl(
        std::forward<MessageTT>(message), advisoryMaxQueueSize_, false);
  }

  /**
   * Unconditionally put a message on the queue.
   *
   * This method is like tryPutMessage(), but ignores the maximum queue size
   * and always puts the message on the queue, even if the maximum queue size
   * would be exceeded.
   *
   * putMessage() may throw
   *   - std::bad_alloc if memory allocation fails, and may
   *   - std::runtime_error if the queue is currently draining
   *   - any other exception thrown by the MessageT move/copy constructor.
   */
  template <typename MessageTT>
  void putMessage(MessageTT&& message) {
    putMessageImpl(std::forward<MessageTT>(message), 0);
  }

  /**
   * Put several messages on the queue.
   */
  template <typename InputIteratorT>
  void putMessages(InputIteratorT first, InputIteratorT last) {
    typedef typename std::iterator_traits<InputIteratorT>::iterator_category
        IterCategory;
    putMessagesImpl(first, last, IterCategory());
  }

  /**
   * Try to immediately pull a message off of the queue, without blocking.
   *
   * If a message is immediately available, the result parameter will be
   * updated to contain the message contents and true will be returned.
   *
   * If no message is available, false will be returned and result will be left
   * unmodified.
   */
  bool tryConsume(MessageT& result) {
    SCOPE_EXIT {
      syncSignalAndQueue();
    };

    checkPid();
    std::unique_ptr<Node> data;

    {
      folly::SpinLockGuard g(spinlock_);

      if (UNLIKELY(queue_.empty())) {
        return false;
      }

      data.reset(&queue_.front());
      queue_.pop_front();
    }

    result = std::move(data->msg_);
    RequestContext::setContext(std::move(data->ctx_));

    return true;
  }

  size_t size() const {
    folly::SpinLockGuard g(spinlock_);
    return queue_.size();
  }

  /**
   * Check that the NotificationQueue is being used from the correct process.
   *
   * If you create a NotificationQueue in one process, then fork, and try to
   * send messages to the queue from the child process, you're going to have a
   * bad time.  Unfortunately users have (accidentally) run into this.
   *
   * Because we use an eventfd/pipe, the child process can actually signal the
   * parent process that an event is ready.  However, it can't put anything on
   * the parent's queue, so the parent wakes up and finds an empty queue.  This
   * check ensures that we catch the problem in the misbehaving child process
   * code, and crash before signalling the parent process.
   */
  void checkPid() const {
    CHECK_EQ(pid_, pid_t(getpid()));
  }

 private:
  // Forbidden copy constructor and assignment operator
  NotificationQueue(NotificationQueue const&) = delete;
  NotificationQueue& operator=(NotificationQueue const&) = delete;

  inline bool checkQueueSize(size_t maxSize, bool throws = true) const {
    DCHECK(0 == spinlock_.try_lock());
    if (maxSize > 0 && queue_.size() >= maxSize) {
      if (throws) {
        throw std::overflow_error(
            "unable to add message to NotificationQueue: "
            "queue is full");
      }
      return false;
    }
    return true;
  }

  inline bool checkDraining(bool throws = true) {
    if (UNLIKELY(draining_ && throws)) {
      throw std::runtime_error("queue is draining, cannot add message");
    }
    return draining_;
  }

#ifdef __ANDROID__
  // TODO 10860938 Remove after figuring out crash
  mutable std::atomic<int> eventBytes_{0};
  mutable std::atomic<int> maxEventBytes_{0};
#endif

  void ensureSignalLocked() const {
    // semantics: empty fd == empty queue <=> !signal_
    if (signal_) {
      return;
    }

    ssize_t bytes_written = 0;
    size_t bytes_expected = 0;

    do {
      if (eventfd_ >= 0) {
        // eventfd(2) dictates that we must write a 64-bit integer
        uint64_t signal = 1;
        bytes_expected = sizeof(signal);
        bytes_written = ::write(eventfd_, &signal, bytes_expected);
      } else {
        uint8_t signal = 1;
        bytes_expected = sizeof(signal);
        bytes_written = ::write(pipeFds_[1], &signal, bytes_expected);
      }
    } while (bytes_written == -1 && errno == EINTR);

#ifdef __ANDROID__
    if (bytes_written > 0) {
      eventBytes_ += bytes_written;
      maxEventBytes_ = std::max((int)maxEventBytes_, (int)eventBytes_);
    }
#endif

    if (bytes_written == ssize_t(bytes_expected)) {
      signal_ = true;
    } else {
#ifdef __ANDROID__
      LOG(ERROR) << "NotificationQueue Write Error=" << errno
                 << " bytesInPipe=" << eventBytes_
                 << " maxInPipe=" << maxEventBytes_ << " queue=" << size();
#endif
      folly::throwSystemError(
          "failed to signal NotificationQueue after "
          "write",
          errno);
    }
  }

  void drainSignalsLocked() {
    ssize_t bytes_read = 0;
    if (eventfd_ > 0) {
      uint64_t message;
      bytes_read = readNoInt(eventfd_, &message, sizeof(message));
      CHECK(bytes_read != -1 || errno == EAGAIN);
    } else {
      // There should only be one byte in the pipe. To avoid potential leaks we
      // still drain.
      uint8_t message[32];
      ssize_t result;
      while ((result = readNoInt(pipeFds_[0], &message, sizeof(message))) !=
             -1) {
        bytes_read += result;
      }
      CHECK(result == -1 && errno == EAGAIN);
      LOG_IF(ERROR, bytes_read > 1)
          << "[NotificationQueue] Unexpected state while draining pipe: bytes_read="
          << bytes_read << " bytes, expected <= 1";
    }
    LOG_IF(ERROR, (signal_ && bytes_read == 0) || (!signal_ && bytes_read > 0))
        << "[NotificationQueue] Unexpected state while draining signals: signal_="
        << signal_ << " bytes_read=" << bytes_read;

    signal_ = false;

#ifdef __ANDROID__
    if (bytes_read > 0) {
      eventBytes_ -= bytes_read;
    }
#endif
  }

  void ensureSignal() const {
    folly::SpinLockGuard g(spinlock_);
    ensureSignalLocked();
  }

  void syncSignalAndQueue() {
    folly::SpinLockGuard g(spinlock_);

    if (queue_.empty()) {
      drainSignalsLocked();
    } else {
      ensureSignalLocked();
    }
  }

  template <typename MessageTT>
  bool putMessageImpl(MessageTT&& message, size_t maxSize, bool throws = true) {
    checkPid();
    bool signal = false;
    {
      auto data = std::make_unique<Node>(
          std::forward<MessageTT>(message), RequestContext::saveContext());
      folly::SpinLockGuard g(spinlock_);
      if (checkDraining(throws) || !checkQueueSize(maxSize, throws)) {
        return false;
      }
      // We only need to signal an event if not all consumers are
      // awake.
      if (numActiveConsumers_ < numConsumers_) {
        signal = true;
      }
      queue_.push_back(*data.release());
      if (signal) {
        ensureSignalLocked();
      }
    }
    return true;
  }

  template <typename InputIteratorT>
  void putMessagesImpl(
      InputIteratorT first,
      InputIteratorT last,
      std::input_iterator_tag) {
    checkPid();
    bool signal = false;
    boost::intrusive::slist<Node, boost::intrusive::cache_last<true>> q;
    try {
      while (first != last) {
        auto data = std::make_unique<Node>(
            std::move(*first), RequestContext::saveContext());
        q.push_back(*data.release());
        ++first;
      }
      folly::SpinLockGuard g(spinlock_);
      checkDraining();
      queue_.splice(queue_.end(), q);
      if (numActiveConsumers_ < numConsumers_) {
        signal = true;
      }
      if (signal) {
        ensureSignalLocked();
      }
    } catch (...) {
      std::unique_ptr<Node> data;
      while (!q.empty()) {
        data.reset(&q.front());
        q.pop_front();
      }
      throw;
    }
  }

  mutable folly::SpinLock spinlock_;
  mutable bool signal_{false};
  int eventfd_;
  int pipeFds_[2]; // to fallback to on older/non-linux systems
  uint32_t advisoryMaxQueueSize_;
  pid_t pid_;
  boost::intrusive::slist<Node, boost::intrusive::cache_last<true>> queue_;
  int numConsumers_{0};
  std::atomic<int> numActiveConsumers_{0};
  bool draining_{false};
};

template <typename MessageT>
void NotificationQueue<MessageT>::Consumer::destroy() {
  // If we are in the middle of a call to handlerReady(), destroyedFlagPtr_
  // will be non-nullptr.  Mark the value that it points to, so that
  // handlerReady() will know the callback is destroyed, and that it cannot
  // access any member variables anymore.
  if (destroyedFlagPtr_) {
    *destroyedFlagPtr_ = true;
  }
  stopConsuming();
  DelayedDestruction::destroy();
}

template <typename MessageT>
void NotificationQueue<MessageT>::Consumer::handlerReady(
    uint16_t /*events*/) noexcept {
  consumeMessages(false);
}

template <typename MessageT>
void NotificationQueue<MessageT>::Consumer::consumeMessages(
    bool isDrain,
    size_t* numConsumed) noexcept {
  DestructorGuard dg(this);
  uint32_t numProcessed = 0;
  setActive(true);
  SCOPE_EXIT {
    if (queue_) {
      queue_->syncSignalAndQueue();
    }
  };
  SCOPE_EXIT {
    setActive(false, /* shouldLock = */ true);
  };
  SCOPE_EXIT {
    if (numConsumed != nullptr) {
      *numConsumed = numProcessed;
    }
  };
  while (true) {
    // Now pop the message off of the queue.
    //
    // We have to manually acquire and release the spinlock here, rather than
    // using SpinLockHolder since the MessageT has to be constructed while
    // holding the spinlock and available after we release it.  SpinLockHolder
    // unfortunately doesn't provide a release() method.  (We can't construct
    // MessageT first since we have no guarantee that MessageT has a default
    // constructor.
    queue_->spinlock_.lock();
    bool locked = true;

    try {
      if (UNLIKELY(queue_->queue_.empty())) {
        // If there is no message, we've reached the end of the queue, return.
        setActive(false);
        queue_->spinlock_.unlock();
        return;
      }

      // Pull a message off the queue.
      std::unique_ptr<Node> data;
      data.reset(&queue_->queue_.front());
      queue_->queue_.pop_front();

      // Check to see if the queue is empty now.
      // We use this as an optimization to see if we should bother trying to
      // loop again and read another message after invoking this callback.
      bool wasEmpty = queue_->queue_.empty();
      if (wasEmpty) {
        setActive(false);
      }

      // Now unlock the spinlock before we invoke the callback.
      queue_->spinlock_.unlock();
      RequestContextScopeGuard rctx(std::move(data->ctx_));

      locked = false;

      // Call the callback
      bool callbackDestroyed = false;
      CHECK(destroyedFlagPtr_ == nullptr);
      destroyedFlagPtr_ = &callbackDestroyed;
      messageAvailable(std::move(data->msg_));
      destroyedFlagPtr_ = nullptr;

      // If the callback was destroyed before it returned, we are done
      if (callbackDestroyed) {
        return;
      }

      // If the callback is no longer installed, we are done.
      if (queue_ == nullptr) {
        return;
      }

      // If we have hit maxReadAtOnce_, we are done.
      ++numProcessed;
      if (!isDrain && maxReadAtOnce_ > 0 && numProcessed >= maxReadAtOnce_) {
        return;
      }

      // If the queue was empty before we invoked the callback, it's probable
      // that it is still empty now.  Just go ahead and return, rather than
      // looping again and trying to re-read from the eventfd.  (If a new
      // message had in fact arrived while we were invoking the callback, we
      // will simply be woken up the next time around the event loop and will
      // process the message then.)
      if (wasEmpty) {
        return;
      }
    } catch (const std::exception&) {
      // This catch block is really just to handle the case where the MessageT
      // constructor throws.  The messageAvailable() callback itself is
      // declared as noexcept and should never throw.
      //
      // If the MessageT constructor does throw we try to handle it as best as
      // we can, but we can't work miracles.  We will just ignore the error for
      // now and return.  The next time around the event loop we will end up
      // trying to read the message again.  If MessageT continues to throw we
      // will never make forward progress and will keep trying each time around
      // the event loop.
      if (locked) {
        // Unlock the spinlock.
        queue_->spinlock_.unlock();
      }

      return;
    }
  }
}

template <typename MessageT>
void NotificationQueue<MessageT>::Consumer::init(
    EventBase* eventBase,
    NotificationQueue* queue) {
  eventBase->dcheckIsInEventBaseThread();
  assert(queue_ == nullptr);
  assert(!isHandlerRegistered());
  queue->checkPid();

  base_ = eventBase;

  queue_ = queue;

  {
    folly::SpinLockGuard g(queue_->spinlock_);
    queue_->numConsumers_++;
  }
  queue_->ensureSignal();

  if (queue_->eventfd_ >= 0) {
    initHandler(eventBase, queue_->eventfd_);
  } else {
    initHandler(eventBase, queue_->pipeFds_[0]);
  }
}

template <typename MessageT>
void NotificationQueue<MessageT>::Consumer::stopConsuming() {
  if (queue_ == nullptr) {
    assert(!isHandlerRegistered());
    return;
  }

  {
    folly::SpinLockGuard g(queue_->spinlock_);
    queue_->numConsumers_--;
    setActive(false);
  }

  assert(isHandlerRegistered());
  unregisterHandler();
  detachEventBase();
  queue_ = nullptr;
}

template <typename MessageT>
bool NotificationQueue<MessageT>::Consumer::consumeUntilDrained(
    size_t* numConsumed) noexcept {
  DestructorGuard dg(this);
  {
    folly::SpinLockGuard g(queue_->spinlock_);
    if (queue_->draining_) {
      return false;
    }
    queue_->draining_ = true;
  }
  consumeMessages(true, numConsumed);
  {
    folly::SpinLockGuard g(queue_->spinlock_);
    queue_->draining_ = false;
  }
  return true;
}

template <typename MessageT>
template <typename F>
void NotificationQueue<MessageT>::SimpleConsumer::consumeUntilDrained(
    F&& foreach) {
  SCOPE_EXIT {
    queue_.syncSignalAndQueue();
  };

  queue_.checkPid();

  while (true) {
    std::unique_ptr<Node> data;
    {
      folly::SpinLockGuard g(queue_.spinlock_);

      if (UNLIKELY(queue_.queue_.empty())) {
        return;
      }

      data.reset(&queue_.queue_.front());
      queue_.queue_.pop_front();
    }

    RequestContextScopeGuard rctx(std::move(data->ctx_));
    foreach(std::move(data->msg_));
    // Make sure message destructor is called with the correct RequestContext.
    data.reset();
  }
}

/**
 * Creates a NotificationQueue::Consumer wrapping a function object
 * Modeled after AsyncTimeout::make
 *
 */

namespace detail {

template <typename MessageT, typename TCallback>
struct notification_queue_consumer_wrapper
    : public NotificationQueue<MessageT>::Consumer {
  template <typename UCallback>
  explicit notification_queue_consumer_wrapper(UCallback&& callback)
      : callback_(std::forward<UCallback>(callback)) {}

  // we are being stricter here and requiring noexcept for callback
  void messageAvailable(MessageT&& message) noexcept override {
    static_assert(
        noexcept(std::declval<TCallback>()(std::forward<MessageT>(message))),
        "callback must be declared noexcept, e.g.: `[]() noexcept {}`");

    callback_(std::forward<MessageT>(message));
  }

 private:
  TCallback callback_;
};

} // namespace detail

template <typename MessageT>
template <typename TCallback>
std::unique_ptr<
    typename NotificationQueue<MessageT>::Consumer,
    DelayedDestruction::Destructor>
NotificationQueue<MessageT>::Consumer::make(TCallback&& callback) {
  return std::unique_ptr<
      NotificationQueue<MessageT>::Consumer,
      DelayedDestruction::Destructor>(
      new detail::notification_queue_consumer_wrapper<
          MessageT,
          typename std::decay<TCallback>::type>(
          std::forward<TCallback>(callback)));
}

} // namespace folly
