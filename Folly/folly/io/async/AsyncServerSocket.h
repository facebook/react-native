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

#include <folly/SocketAddress.h>
#include <folly/String.h>
#include <folly/io/ShutdownSocketSet.h>
#include <folly/io/async/AsyncSocketBase.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/DelayedDestruction.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventHandler.h>
#include <folly/io/async/NotificationQueue.h>
#include <folly/portability/Sockets.h>

#include <limits.h>
#include <stddef.h>
#include <exception>
#include <memory>
#include <vector>

// Due to the way kernel headers are included, this may or may not be defined.
// Number pulled from 3.10 kernel headers.
#ifndef SO_REUSEPORT
#define SO_REUSEPORT 15
#endif

#if defined __linux__ && !defined SO_NO_TRANSPARENT_TLS
#define SO_NO_TRANSPARENT_TLS 200
#endif

namespace folly {

/**
 * A listening socket that asynchronously informs a callback whenever a new
 * connection has been accepted.
 *
 * Unlike most async interfaces that always invoke their callback in the same
 * EventBase thread, AsyncServerSocket is unusual in that it can distribute
 * the callbacks across multiple EventBase threads.
 *
 * This supports a common use case for network servers to distribute incoming
 * connections across a number of EventBase threads.  (Servers typically run
 * with one EventBase thread per CPU.)
 *
 * Despite being able to invoke callbacks in multiple EventBase threads,
 * AsyncServerSocket still has one "primary" EventBase.  Operations that
 * modify the AsyncServerSocket state may only be performed from the primary
 * EventBase thread.
 */
class AsyncServerSocket : public DelayedDestruction, public AsyncSocketBase {
 public:
  typedef std::unique_ptr<AsyncServerSocket, Destructor> UniquePtr;
  // Disallow copy, move, and default construction.
  AsyncServerSocket(AsyncServerSocket&&) = delete;

  /**
   * A callback interface to get notified of client socket events.
   *
   * The ConnectionEventCallback implementations need to be thread-safe as the
   * callbacks may be called from different threads.
   */
  class ConnectionEventCallback {
   public:
    virtual ~ConnectionEventCallback() = default;

    /**
     * onConnectionAccepted() is called right after a client connection
     * is accepted using the system accept()/accept4() APIs.
     */
    virtual void onConnectionAccepted(
        const int socket,
        const SocketAddress& addr) noexcept = 0;

    /**
     * onConnectionAcceptError() is called when an error occurred accepting
     * a connection.
     */
    virtual void onConnectionAcceptError(const int err) noexcept = 0;

    /**
     * onConnectionDropped() is called when a connection is dropped,
     * probably because of some error encountered.
     */
    virtual void onConnectionDropped(
        const int socket,
        const SocketAddress& addr) noexcept = 0;

    /**
     * onConnectionEnqueuedForAcceptorCallback() is called when the
     * connection is successfully enqueued for an AcceptCallback to pick up.
     */
    virtual void onConnectionEnqueuedForAcceptorCallback(
        const int socket,
        const SocketAddress& addr) noexcept = 0;

    /**
     * onConnectionDequeuedByAcceptorCallback() is called when the
     * connection is successfully dequeued by an AcceptCallback.
     */
    virtual void onConnectionDequeuedByAcceptorCallback(
        const int socket,
        const SocketAddress& addr) noexcept = 0;

    /**
     * onBackoffStarted is called when the socket has successfully started
     * backing off accepting new client sockets.
     */
    virtual void onBackoffStarted() noexcept = 0;

    /**
     * onBackoffEnded is called when the backoff period has ended and the socket
     * has successfully resumed accepting new connections if there is any
     * AcceptCallback registered.
     */
    virtual void onBackoffEnded() noexcept = 0;

    /**
     * onBackoffError is called when there is an error entering backoff
     */
    virtual void onBackoffError() noexcept = 0;
  };

  class AcceptCallback {
   public:
    virtual ~AcceptCallback() = default;

    /**
     * connectionAccepted() is called whenever a new client connection is
     * received.
     *
     * The AcceptCallback will remain installed after connectionAccepted()
     * returns.
     *
     * @param fd          The newly accepted client socket.  The AcceptCallback
     *                    assumes ownership of this socket, and is responsible
     *                    for closing it when done.  The newly accepted file
     *                    descriptor will have already been put into
     *                    non-blocking mode.
     * @param clientAddr  A reference to a SocketAddress struct containing the
     *                    client's address.  This struct is only guaranteed to
     *                    remain valid until connectionAccepted() returns.
     */
    virtual void connectionAccepted(
        int fd,
        const SocketAddress& clientAddr) noexcept = 0;

    /**
     * acceptError() is called if an error occurs while accepting.
     *
     * The AcceptCallback will remain installed even after an accept error,
     * as the errors are typically somewhat transient, such as being out of
     * file descriptors.  The server socket must be explicitly stopped if you
     * wish to stop accepting after an error.
     *
     * @param ex  An exception representing the error.
     */
    virtual void acceptError(const std::exception& ex) noexcept = 0;

    /**
     * acceptStarted() will be called in the callback's EventBase thread
     * after this callback has been added to the AsyncServerSocket.
     *
     * acceptStarted() will be called before any calls to connectionAccepted()
     * or acceptError() are made on this callback.
     *
     * acceptStarted() makes it easier for callbacks to perform initialization
     * inside the callback thread.  (The call to addAcceptCallback() must
     * always be made from the AsyncServerSocket's primary EventBase thread.
     * acceptStarted() provides a hook that will always be invoked in the
     * callback's thread.)
     *
     * Note that the call to acceptStarted() is made once the callback is
     * added, regardless of whether or not the AsyncServerSocket is actually
     * accepting at the moment.  acceptStarted() will be called even if the
     * AsyncServerSocket is paused when the callback is added (including if
     * the initial call to startAccepting() on the AsyncServerSocket has not
     * been made yet).
     */
    virtual void acceptStarted() noexcept {}

    /**
     * acceptStopped() will be called when this AcceptCallback is removed from
     * the AsyncServerSocket, or when the AsyncServerSocket is destroyed,
     * whichever occurs first.
     *
     * No more calls to connectionAccepted() or acceptError() will be made
     * after acceptStopped() is invoked.
     */
    virtual void acceptStopped() noexcept {}
  };

  static const uint32_t kDefaultMaxAcceptAtOnce = 30;
  static const uint32_t kDefaultCallbackAcceptAtOnce = 5;
  static const uint32_t kDefaultMaxMessagesInQueue = 1024;
  /**
   * Create a new AsyncServerSocket with the specified EventBase.
   *
   * @param eventBase  The EventBase to use for driving the asynchronous I/O.
   *                   If this parameter is nullptr, attachEventBase() must be
   *                   called before this socket can begin accepting
   *                   connections.
   */
  explicit AsyncServerSocket(EventBase* eventBase = nullptr);

  /**
   * Helper function to create a shared_ptr<AsyncServerSocket>.
   *
   * This passes in the correct destructor object, since AsyncServerSocket's
   * destructor is protected and cannot be invoked directly.
   */
  static std::shared_ptr<AsyncServerSocket> newSocket(
      EventBase* evb = nullptr) {
    return std::shared_ptr<AsyncServerSocket>(
        new AsyncServerSocket(evb), Destructor());
  }

  void setShutdownSocketSet(const std::weak_ptr<ShutdownSocketSet>& wNewSS);

  /**
   * Destroy the socket.
   *
   * AsyncServerSocket::destroy() must be called to destroy the socket.
   * The normal destructor is private, and should not be invoked directly.
   * This prevents callers from deleting a AsyncServerSocket while it is
   * invoking a callback.
   *
   * destroy() must be invoked from the socket's primary EventBase thread.
   *
   * If there are AcceptCallbacks still installed when destroy() is called,
   * acceptStopped() will be called on these callbacks to notify them that
   * accepting has stopped.  Accept callbacks being driven by other EventBase
   * threads may continue to receive new accept callbacks for a brief period of
   * time after destroy() returns.  They will not receive any more callback
   * invocations once acceptStopped() is invoked.
   */
  void destroy() override;

  /**
   * Attach this AsyncServerSocket to its primary EventBase.
   *
   * This may only be called if the AsyncServerSocket is not already attached
   * to a EventBase.  The AsyncServerSocket must be attached to a EventBase
   * before it can begin accepting connections.
   */
  void attachEventBase(EventBase* eventBase);

  /**
   * Detach the AsyncServerSocket from its primary EventBase.
   *
   * detachEventBase() may only be called if the AsyncServerSocket is not
   * currently accepting connections.
   */
  void detachEventBase();

  /**
   * Get the EventBase used by this socket.
   */
  EventBase* getEventBase() const override {
    return eventBase_;
  }

  /**
   * Create a AsyncServerSocket from an existing socket file descriptor.
   *
   * useExistingSocket() will cause the AsyncServerSocket to take ownership of
   * the specified file descriptor, and use it to listen for new connections.
   * The AsyncServerSocket will close the file descriptor when it is
   * destroyed.
   *
   * useExistingSocket() must be called before bind() or listen().
   *
   * The supplied file descriptor will automatically be put into non-blocking
   * mode.  The caller may have already directly called bind() and possibly
   * listen on the file descriptor.  If so the caller should skip calling the
   * corresponding AsyncServerSocket::bind() and listen() methods.
   *
   * On error a TTransportException will be thrown and the caller will retain
   * ownership of the file descriptor.
   */
  void useExistingSocket(int fd);
  void useExistingSockets(const std::vector<int>& fds);

  /**
   * Return the underlying file descriptor
   */
  std::vector<int> getSockets() const {
    std::vector<int> sockets;
    for (auto& handler : sockets_) {
      sockets.push_back(handler.socket_);
    }
    return sockets;
  }

  /**
   * Backwards compatible getSocket, warns if > 1 socket
   */
  int getSocket() const {
    if (sockets_.size() > 1) {
      VLOG(2) << "Warning: getSocket can return multiple fds, "
              << "but getSockets was not called, so only returning the first";
    }
    if (sockets_.size() == 0) {
      return -1;
    } else {
      return sockets_[0].socket_;
    }
  }

  /* enable zerocopy support for the server sockets - the s = accept sockets
   * inherit it
   */
  bool setZeroCopy(bool enable);

  /**
   * Bind to the specified address.
   *
   * This must be called from the primary EventBase thread.
   *
   * Throws TTransportException on error.
   */
  virtual void bind(const SocketAddress& address);

  /**
   * Bind to the specified port for the specified addresses.
   *
   * This must be called from the primary EventBase thread.
   *
   * Throws TTransportException on error.
   */
  virtual void bind(const std::vector<IPAddress>& ipAddresses, uint16_t port);

  /**
   * Bind to the specified port.
   *
   * This must be called from the primary EventBase thread.
   *
   * Throws TTransportException on error.
   */
  virtual void bind(uint16_t port);

  /**
   * Get the local address to which the socket is bound.
   *
   * Throws TTransportException on error.
   */
  void getAddress(SocketAddress* addressReturn) const override;

  /**
   * Get the local address to which the socket is bound.
   *
   * Throws TTransportException on error.
   */
  SocketAddress getAddress() const {
    SocketAddress ret;
    getAddress(&ret);
    return ret;
  }

  /**
   * Get all the local addresses to which the socket is bound.
   *
   * Throws TTransportException on error.
   */
  std::vector<SocketAddress> getAddresses() const;

  /**
   * Begin listening for connections.
   *
   * This calls ::listen() with the specified backlog.
   *
   * Once listen() is invoked the socket will actually be open so that remote
   * clients may establish connections.  (Clients that attempt to connect
   * before listen() is called will receive a connection refused error.)
   *
   * At least one callback must be set and startAccepting() must be called to
   * actually begin notifying the accept callbacks of newly accepted
   * connections.  The backlog parameter controls how many connections the
   * kernel will accept and buffer internally while the accept callbacks are
   * paused (or if accepting is enabled but the callbacks cannot keep up).
   *
   * bind() must be called before calling listen().
   * listen() must be called from the primary EventBase thread.
   *
   * Throws TTransportException on error.
   */
  virtual void listen(int backlog);

  /**
   * Add an AcceptCallback.
   *
   * When a new socket is accepted, one of the AcceptCallbacks will be invoked
   * with the new socket.  The AcceptCallbacks are invoked in a round-robin
   * fashion.  This allows the accepted sockets to be distributed among a pool
   * of threads, each running its own EventBase object.  This is a common model,
   * since most asynchronous-style servers typically run one EventBase thread
   * per CPU.
   *
   * The EventBase object associated with each AcceptCallback must be running
   * its loop.  If the EventBase loop is not running, sockets will still be
   * scheduled for the callback, but the callback cannot actually get invoked
   * until the loop runs.
   *
   * This method must be invoked from the AsyncServerSocket's primary
   * EventBase thread.
   *
   * Note that startAccepting() must be called on the AsyncServerSocket to
   * cause it to actually start accepting sockets once callbacks have been
   * installed.
   *
   * @param callback   The callback to invoke.
   * @param eventBase  The EventBase to use to invoke the callback.  This
   *     parameter may be nullptr, in which case the callback will be invoked in
   *     the AsyncServerSocket's primary EventBase.
   * @param maxAtOnce  The maximum number of connections to accept in this
   *                   callback on a single iteration of the event base loop.
   *                   This only takes effect when eventBase is non-nullptr.
   *                   When using a nullptr eventBase for the callback, the
   *                   setMaxAcceptAtOnce() method controls how many
   *                   connections the main event base will accept at once.
   */
  virtual void addAcceptCallback(
      AcceptCallback* callback,
      EventBase* eventBase,
      uint32_t maxAtOnce = kDefaultCallbackAcceptAtOnce);

  /**
   * Remove an AcceptCallback.
   *
   * This allows a single AcceptCallback to be removed from the round-robin
   * pool.
   *
   * This method must be invoked from the AsyncServerSocket's primary
   * EventBase thread.  Use EventBase::runInEventBaseThread() to schedule the
   * operation in the correct EventBase if your code is not in the server
   * socket's primary EventBase.
   *
   * Given that the accept callback is being driven by a different EventBase,
   * the AcceptCallback may continue to be invoked for a short period of time
   * after removeAcceptCallback() returns in this thread.  Once the other
   * EventBase thread receives the notification to stop, it will call
   * acceptStopped() on the callback to inform it that it is fully stopped and
   * will not receive any new sockets.
   *
   * If the last accept callback is removed while the socket is accepting,
   * the socket will implicitly pause accepting.  If a callback is later added,
   * it will resume accepting immediately, without requiring startAccepting()
   * to be invoked.
   *
   * @param callback   The callback to uninstall.
   * @param eventBase  The EventBase associated with this callback.  This must
   *     be the same EventBase that was used when the callback was installed
   *     with addAcceptCallback().
   */
  void removeAcceptCallback(AcceptCallback* callback, EventBase* eventBase);

  /**
   * Begin accepting connctions on this socket.
   *
   * bind() and listen() must be called before calling startAccepting().
   *
   * When a AsyncServerSocket is initially created, it will not begin
   * accepting connections until at least one callback has been added and
   * startAccepting() has been called.  startAccepting() can also be used to
   * resume accepting connections after a call to pauseAccepting().
   *
   * If startAccepting() is called when there are no accept callbacks
   * installed, the socket will not actually begin accepting until an accept
   * callback is added.
   *
   * This method may only be called from the primary EventBase thread.
   */
  virtual void startAccepting();

  /**
   * Pause accepting connections.
   *
   * startAccepting() may be called to resume accepting.
   *
   * This method may only be called from the primary EventBase thread.
   * If there are AcceptCallbacks being driven by other EventBase threads they
   * may continue to receive callbacks for a short period of time after
   * pauseAccepting() returns.
   *
   * Unlike removeAcceptCallback() or destroy(), acceptStopped() will not be
   * called on the AcceptCallback objects simply due to a temporary pause.  If
   * the server socket is later destroyed while paused, acceptStopped() will be
   * called all of the installed AcceptCallbacks.
   */
  void pauseAccepting();

  /**
   * Shutdown the listen socket and notify all callbacks that accept has
   * stopped, but don't close the socket.  This invokes shutdown(2) with the
   * supplied argument.  Passing -1 will close the socket now.  Otherwise, the
   * close will be delayed until this object is destroyed.
   *
   * Only use this if you have reason to pass special flags to shutdown.
   * Otherwise just destroy the socket.
   *
   * This method has no effect when a ShutdownSocketSet option is used.
   *
   * Returns the result of shutdown on sockets_[n-1]
   */
  int stopAccepting(int shutdownFlags = -1);

  /**
   * Get the maximum number of connections that will be accepted each time
   * around the event loop.
   */
  uint32_t getMaxAcceptAtOnce() const {
    return maxAcceptAtOnce_;
  }

  /**
   * Set the maximum number of connections that will be accepted each time
   * around the event loop.
   *
   * This provides a very coarse-grained way of controlling how fast the
   * AsyncServerSocket will accept connections.  If you find that when your
   * server is overloaded AsyncServerSocket accepts connections more quickly
   * than your code can process them, you can try lowering this number so that
   * fewer connections will be accepted each event loop iteration.
   *
   * For more explicit control over the accept rate, you can also use
   * pauseAccepting() to temporarily pause accepting when your server is
   * overloaded, and then use startAccepting() later to resume accepting.
   */
  void setMaxAcceptAtOnce(uint32_t numConns) {
    maxAcceptAtOnce_ = numConns;
  }

  /**
   * Get the maximum number of unprocessed messages which a NotificationQueue
   * can hold.
   */
  uint32_t getMaxNumMessagesInQueue() const {
    return maxNumMsgsInQueue_;
  }

  /**
   * Set the maximum number of unprocessed messages in NotificationQueue.
   * No new message will be sent to that NotificationQueue if there are more
   * than such number of unprocessed messages in that queue.
   *
   * Only works if called before addAcceptCallback.
   */
  void setMaxNumMessagesInQueue(uint32_t num) {
    maxNumMsgsInQueue_ = num;
  }

  /**
   * Get the speed of adjusting connection accept rate.
   */
  double getAcceptRateAdjustSpeed() const {
    return acceptRateAdjustSpeed_;
  }

  /**
   * Set the speed of adjusting connection accept rate.
   */
  void setAcceptRateAdjustSpeed(double speed) {
    acceptRateAdjustSpeed_ = speed;
  }

  /**
   * Enable/Disable TOS reflection for the server socket
   */
  void setTosReflect(bool enable);

  bool getTosReflect() {
    return tosReflect_;
  }

  /**
   * Get the number of connections dropped by the AsyncServerSocket
   */
  std::size_t getNumDroppedConnections() const {
    return numDroppedConnections_;
  }

  /**
   * Get the current number of unprocessed messages in NotificationQueue.
   *
   * This method must be invoked from the AsyncServerSocket's primary
   * EventBase thread.  Use EventBase::runInEventBaseThread() to schedule the
   * operation in the correct EventBase if your code is not in the server
   * socket's primary EventBase.
   */
  int64_t getNumPendingMessagesInQueue() const {
    if (eventBase_) {
      eventBase_->dcheckIsInEventBaseThread();
    }
    int64_t numMsgs = 0;
    for (const auto& callback : callbacks_) {
      if (callback.consumer) {
        numMsgs += callback.consumer->getQueue()->size();
      }
    }
    return numMsgs;
  }

  /**
   * Set whether or not SO_KEEPALIVE should be enabled on the server socket
   * (and thus on all subsequently-accepted connections). By default, keepalive
   * is enabled.
   *
   * Note that TCP keepalive usually only kicks in after the connection has
   * been idle for several hours. Applications should almost always have their
   * own, shorter idle timeout.
   */
  void setKeepAliveEnabled(bool enabled) {
    keepAliveEnabled_ = enabled;

    for (auto& handler : sockets_) {
      if (handler.socket_ < 0) {
        continue;
      }

      int val = (enabled) ? 1 : 0;
      if (setsockopt(
              handler.socket_, SOL_SOCKET, SO_KEEPALIVE, &val, sizeof(val)) !=
          0) {
        LOG(ERROR) << "failed to set SO_KEEPALIVE on async server socket: %s"
                   << errnoStr(errno);
      }
    }
  }

  /**
   * Get whether or not SO_KEEPALIVE is enabled on the server socket.
   */
  bool getKeepAliveEnabled() const {
    return keepAliveEnabled_;
  }

  /**
   * Set whether or not SO_REUSEPORT should be enabled on the server socket,
   * allowing multiple binds to the same port
   */
  void setReusePortEnabled(bool enabled) {
    reusePortEnabled_ = enabled;

    for (auto& handler : sockets_) {
      if (handler.socket_ < 0) {
        continue;
      }

      int val = (enabled) ? 1 : 0;
      if (setsockopt(
              handler.socket_, SOL_SOCKET, SO_REUSEPORT, &val, sizeof(val)) !=
          0) {
        LOG(ERROR) << "failed to set SO_REUSEPORT on async server socket "
                   << errno;
        folly::throwSystemError(errno, "failed to bind to async server socket");
      }
    }
  }

  /**
   * Get whether or not SO_REUSEPORT is enabled on the server socket.
   */
  bool getReusePortEnabled_() const {
    return reusePortEnabled_;
  }

  /**
   * Set whether or not the socket should close during exec() (FD_CLOEXEC). By
   * default, this is enabled
   */
  void setCloseOnExec(bool closeOnExec) {
    closeOnExec_ = closeOnExec;
  }

  /**
   * Get whether or not FD_CLOEXEC is enabled on the server socket.
   */
  bool getCloseOnExec() const {
    return closeOnExec_;
  }

  /**
   * Tries to enable TFO if the machine supports it.
   */
  void setTFOEnabled(bool enabled, uint32_t maxTFOQueueSize) {
    tfo_ = enabled;
    tfoMaxQueueSize_ = maxTFOQueueSize;
  }

  /**
   * Do not attempt the transparent TLS handshake
   */
  void disableTransparentTls() {
    noTransparentTls_ = true;
  }

  /**
   * Get whether or not the socket is accepting new connections
   */
  bool getAccepting() const {
    return accepting_;
  }

  /**
   * Set the ConnectionEventCallback
   */
  void setConnectionEventCallback(
      ConnectionEventCallback* const connectionEventCallback) {
    connectionEventCallback_ = connectionEventCallback;
  }

  /**
   * Get the ConnectionEventCallback
   */
  ConnectionEventCallback* getConnectionEventCallback() const {
    return connectionEventCallback_;
  }

 protected:
  /**
   * Protected destructor.
   *
   * Invoke destroy() instead to destroy the AsyncServerSocket.
   */
  ~AsyncServerSocket() override;

 private:
  enum class MessageType { MSG_NEW_CONN = 0, MSG_ERROR = 1 };

  struct QueueMessage {
    MessageType type;
    int fd;
    int err;
    SocketAddress address;
    std::string msg;
  };

  /**
   * A class to receive notifications to invoke AcceptCallback objects
   * in other EventBase threads.
   *
   * A RemoteAcceptor object is created for each AcceptCallback that
   * is installed in a separate EventBase thread.  The RemoteAcceptor
   * receives notification of new sockets via a NotificationQueue,
   * and then invokes the AcceptCallback.
   */
  class RemoteAcceptor : private NotificationQueue<QueueMessage>::Consumer {
   public:
    explicit RemoteAcceptor(
        AcceptCallback* callback,
        ConnectionEventCallback* connectionEventCallback)
        : callback_(callback),
          connectionEventCallback_(connectionEventCallback) {}

    ~RemoteAcceptor() override = default;

    void start(EventBase* eventBase, uint32_t maxAtOnce, uint32_t maxInQueue);
    void stop(EventBase* eventBase, AcceptCallback* callback);

    void messageAvailable(QueueMessage&& message) noexcept override;

    NotificationQueue<QueueMessage>* getQueue() {
      return &queue_;
    }

   private:
    AcceptCallback* callback_;
    ConnectionEventCallback* connectionEventCallback_;

    NotificationQueue<QueueMessage> queue_;
  };

  /**
   * A struct to keep track of the callbacks associated with this server
   * socket.
   */
  struct CallbackInfo {
    CallbackInfo(AcceptCallback* cb, EventBase* evb)
        : callback(cb), eventBase(evb), consumer(nullptr) {}

    AcceptCallback* callback;
    EventBase* eventBase;

    RemoteAcceptor* consumer;
  };

  class BackoffTimeout;

  virtual void
  handlerReady(uint16_t events, int socket, sa_family_t family) noexcept;

  int createSocket(int family);
  void setupSocket(int fd, int family);
  void bindSocket(int fd, const SocketAddress& address, bool isExistingSocket);
  void dispatchSocket(int socket, SocketAddress&& address);
  void dispatchError(const char* msg, int errnoValue);
  void enterBackoff();
  void backoffTimeoutExpired();

  CallbackInfo* nextCallback() {
    CallbackInfo* info = &callbacks_[callbackIndex_];

    ++callbackIndex_;
    if (callbackIndex_ >= callbacks_.size()) {
      callbackIndex_ = 0;
    }

    return info;
  }

  struct ServerEventHandler : public EventHandler {
    ServerEventHandler(
        EventBase* eventBase,
        int socket,
        AsyncServerSocket* parent,
        sa_family_t addressFamily)
        : EventHandler(eventBase, socket),
          eventBase_(eventBase),
          socket_(socket),
          parent_(parent),
          addressFamily_(addressFamily) {}

    ServerEventHandler(const ServerEventHandler& other)
        : EventHandler(other.eventBase_, other.socket_),
          eventBase_(other.eventBase_),
          socket_(other.socket_),
          parent_(other.parent_),
          addressFamily_(other.addressFamily_) {}

    ServerEventHandler& operator=(const ServerEventHandler& other) {
      if (this != &other) {
        eventBase_ = other.eventBase_;
        socket_ = other.socket_;
        parent_ = other.parent_;
        addressFamily_ = other.addressFamily_;

        detachEventBase();
        attachEventBase(other.eventBase_);
        changeHandlerFD(other.socket_);
      }
      return *this;
    }

    // Inherited from EventHandler
    void handlerReady(uint16_t events) noexcept override {
      parent_->handlerReady(events, socket_, addressFamily_);
    }

    EventBase* eventBase_;
    int socket_;
    AsyncServerSocket* parent_;
    sa_family_t addressFamily_;
  };

  EventBase* eventBase_;
  std::vector<ServerEventHandler> sockets_;
  std::vector<int> pendingCloseSockets_;
  bool accepting_;
  uint32_t maxAcceptAtOnce_;
  uint32_t maxNumMsgsInQueue_;
  double acceptRateAdjustSpeed_; // 0 to disable auto adjust
  double acceptRate_;
  std::chrono::time_point<std::chrono::steady_clock> lastAccepTimestamp_;
  std::size_t numDroppedConnections_;
  uint32_t callbackIndex_;
  BackoffTimeout* backoffTimeout_;
  std::vector<CallbackInfo> callbacks_;
  bool keepAliveEnabled_;
  bool reusePortEnabled_{false};
  bool closeOnExec_;
  bool tfo_{false};
  bool noTransparentTls_{false};
  uint32_t tfoMaxQueueSize_{0};
  std::weak_ptr<ShutdownSocketSet> wShutdownSocketSet_;
  ConnectionEventCallback* connectionEventCallback_{nullptr};
  bool tosReflect_{false};
};

} // namespace folly
