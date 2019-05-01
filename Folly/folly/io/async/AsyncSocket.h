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

#include <folly/Optional.h>
#include <folly/SocketAddress.h>
#include <folly/detail/SocketFastOpen.h>
#include <folly/io/IOBuf.h>
#include <folly/io/ShutdownSocketSet.h>
#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/io/async/DelayedDestruction.h>
#include <folly/io/async/EventHandler.h>
#include <folly/portability/Sockets.h>

#include <sys/types.h>

#include <chrono>
#include <map>
#include <memory>

namespace folly {

/**
 * A class for performing asynchronous I/O on a socket.
 *
 * AsyncSocket allows users to asynchronously wait for data on a socket, and
 * to asynchronously send data.
 *
 * The APIs for reading and writing are intentionally asymmetric.  Waiting for
 * data to read is a persistent API: a callback is installed, and is notified
 * whenever new data is available.  It continues to be notified of new events
 * until it is uninstalled.
 *
 * AsyncSocket does not provide read timeout functionality, because it
 * typically cannot determine when the timeout should be active.  Generally, a
 * timeout should only be enabled when processing is blocked waiting on data
 * from the remote endpoint.  For server sockets, the timeout should not be
 * active if the server is currently processing one or more outstanding
 * requests for this socket.  For client sockets, the timeout should not be
 * active if there are no requests pending on the socket.  Additionally, if a
 * client has multiple pending requests, it will ususally want a separate
 * timeout for each request, rather than a single read timeout.
 *
 * The write API is fairly intuitive: a user can request to send a block of
 * data, and a callback will be informed once the entire block has been
 * transferred to the kernel, or on error.  AsyncSocket does provide a send
 * timeout, since most callers want to give up if the remote end stops
 * responding and no further progress can be made sending the data.
 */

#if defined __linux__ && !defined SO_NO_TRANSPARENT_TLS
#define SO_NO_TRANSPARENT_TLS 200
#endif

#if defined __linux__ && !defined SO_NO_TSOCKS
#define SO_NO_TSOCKS 201
#endif

#ifdef _MSC_VER
// We do a dynamic_cast on this, in
// AsyncTransportWrapper::getUnderlyingTransport so be safe and
// force displacements for it. See:
// https://msdn.microsoft.com/en-us/library/7sf3txa8.aspx
#pragma vtordisp(push, 2)
#endif
class AsyncSocket : virtual public AsyncTransportWrapper {
 public:
  typedef std::unique_ptr<AsyncSocket, Destructor> UniquePtr;

  class ConnectCallback {
   public:
    virtual ~ConnectCallback() = default;

    /**
     * connectSuccess() will be invoked when the connection has been
     * successfully established.
     */
    virtual void connectSuccess() noexcept = 0;

    /**
     * connectErr() will be invoked if the connection attempt fails.
     *
     * @param ex        An exception describing the error that occurred.
     */
    virtual void connectErr(const AsyncSocketException& ex) noexcept = 0;
  };

  class EvbChangeCallback {
   public:
    virtual ~EvbChangeCallback() = default;

    // Called when the socket has been attached to a new EVB
    // and is called from within that EVB thread
    virtual void evbAttached(AsyncSocket* socket) = 0;

    // Called when the socket is detached from an EVB and
    // is called from the EVB thread being detached
    virtual void evbDetached(AsyncSocket* socket) = 0;
  };

  /**
   * This interface is implemented only for platforms supporting
   * per-socket error queues.
   */
  class ErrMessageCallback {
   public:
    virtual ~ErrMessageCallback() = default;

    /**
     * errMessage() will be invoked when kernel puts a message to
     * the error queue associated with the socket.
     *
     * @param cmsg      Reference to cmsghdr structure describing
     *                  a message read from error queue associated
     *                  with the socket.
     */
    virtual void errMessage(const cmsghdr& cmsg) noexcept = 0;

    /**
     * errMessageError() will be invoked if an error occurs reading a message
     * from the socket error stream.
     *
     * @param ex        An exception describing the error that occurred.
     */
    virtual void errMessageError(const AsyncSocketException& ex) noexcept = 0;
  };

  class SendMsgParamsCallback {
   public:
    virtual ~SendMsgParamsCallback() = default;

    /**
     * getFlags() will be invoked to retrieve the desired flags to be passed
     * to ::sendmsg() system call. This method was intentionally declared
     * non-virtual, so there is no way to override it. Instead feel free to
     * override getFlagsImpl(flags, defaultFlags) method instead, and enjoy
     * the convenience of defaultFlags passed there.
     *
     * @param flags     Write flags requested for the given write operation
     */
    int getFlags(folly::WriteFlags flags, bool zeroCopyEnabled) noexcept {
      return getFlagsImpl(flags, getDefaultFlags(flags, zeroCopyEnabled));
    }

    /**
     * getAncillaryData() will be invoked to initialize ancillary data
     * buffer referred by "msg_control" field of msghdr structure passed to
     * ::sendmsg() system call. The function assumes that the size of buffer
     * is not smaller than the value returned by getAncillaryDataSize() method
     * for the same combination of flags.
     *
     * @param flags     Write flags requested for the given write operation
     * @param data      Pointer to ancillary data buffer to initialize.
     */
    virtual void getAncillaryData(
        folly::WriteFlags /*flags*/,
        void* /*data*/) noexcept {}

    /**
     * getAncillaryDataSize() will be invoked to retrieve the size of
     * ancillary data buffer which should be passed to ::sendmsg() system call
     *
     * @param flags     Write flags requested for the given write operation
     */
    virtual uint32_t getAncillaryDataSize(
        folly::WriteFlags /*flags*/) noexcept {
      return 0;
    }

    static const size_t maxAncillaryDataSize{0x5000};

   private:
    /**
     * getFlagsImpl() will be invoked by getFlags(folly::WriteFlags flags)
     * method to retrieve the flags to be passed to ::sendmsg() system call.
     * SendMsgParamsCallback::getFlags() is calling this method, and returns
     * its results directly to the caller in AsyncSocket.
     * Classes inheriting from SendMsgParamsCallback are welcome to override
     * this method to force SendMsgParamsCallback to return its own set
     * of flags.
     *
     * @param flags        Write flags requested for the given write operation
     * @param defaultflags A set of message flags returned by getDefaultFlags()
     *                     method for the given "flags" mask.
     */
    virtual int getFlagsImpl(folly::WriteFlags /*flags*/, int defaultFlags) {
      return defaultFlags;
    }

    /**
     * getDefaultFlags() will be invoked by  getFlags(folly::WriteFlags flags)
     * to retrieve the default set of flags, and pass them to getFlagsImpl(...)
     *
     * @param flags     Write flags requested for the given write operation
     */
    int getDefaultFlags(folly::WriteFlags flags, bool zeroCopyEnabled) noexcept;
  };

  explicit AsyncSocket();
  /**
   * Create a new unconnected AsyncSocket.
   *
   * connect() must later be called on this socket to establish a connection.
   */
  explicit AsyncSocket(EventBase* evb);

  void setShutdownSocketSet(const std::weak_ptr<ShutdownSocketSet>& wSS);

  /**
   * Create a new AsyncSocket and begin the connection process.
   *
   * @param evb             EventBase that will manage this socket.
   * @param address         The address to connect to.
   * @param connectTimeout  Optional timeout in milliseconds for the connection
   *                        attempt.
   */
  AsyncSocket(
      EventBase* evb,
      const folly::SocketAddress& address,
      uint32_t connectTimeout = 0);

  /**
   * Create a new AsyncSocket and begin the connection process.
   *
   * @param evb             EventBase that will manage this socket.
   * @param ip              IP address to connect to (dotted-quad).
   * @param port            Destination port in host byte order.
   * @param connectTimeout  Optional timeout in milliseconds for the connection
   *                        attempt.
   */
  AsyncSocket(
      EventBase* evb,
      const std::string& ip,
      uint16_t port,
      uint32_t connectTimeout = 0);

  /**
   * Create a AsyncSocket from an already connected socket file descriptor.
   *
   * Note that while AsyncSocket enables TCP_NODELAY for sockets it creates
   * when connecting, it does not change the socket options when given an
   * existing file descriptor.  If callers want TCP_NODELAY enabled when using
   * this version of the constructor, they need to explicitly call
   * setNoDelay(true) after the constructor returns.
   *
   * @param evb EventBase that will manage this socket.
   * @param fd  File descriptor to take over (should be a connected socket).
   * @param zeroCopyBufId Zerocopy buf id to start with.
   */
  AsyncSocket(EventBase* evb, int fd, uint32_t zeroCopyBufId = 0);

  /**
   * Create an AsyncSocket from a different, already connected AsyncSocket.
   *
   * Similar to AsyncSocket(evb, fd) when fd was previously owned by an
   * AsyncSocket.
   */
  explicit AsyncSocket(AsyncSocket::UniquePtr);

  /**
   * Helper function to create a shared_ptr<AsyncSocket>.
   *
   * This passes in the correct destructor object, since AsyncSocket's
   * destructor is protected and cannot be invoked directly.
   */
  static std::shared_ptr<AsyncSocket> newSocket(EventBase* evb) {
    return std::shared_ptr<AsyncSocket>(new AsyncSocket(evb), Destructor());
  }

  /**
   * Helper function to create a shared_ptr<AsyncSocket>.
   */
  static std::shared_ptr<AsyncSocket> newSocket(
      EventBase* evb,
      const folly::SocketAddress& address,
      uint32_t connectTimeout = 0) {
    return std::shared_ptr<AsyncSocket>(
        new AsyncSocket(evb, address, connectTimeout), Destructor());
  }

  /**
   * Helper function to create a shared_ptr<AsyncSocket>.
   */
  static std::shared_ptr<AsyncSocket> newSocket(
      EventBase* evb,
      const std::string& ip,
      uint16_t port,
      uint32_t connectTimeout = 0) {
    return std::shared_ptr<AsyncSocket>(
        new AsyncSocket(evb, ip, port, connectTimeout), Destructor());
  }

  /**
   * Helper function to create a shared_ptr<AsyncSocket>.
   */
  static std::shared_ptr<AsyncSocket> newSocket(EventBase* evb, int fd) {
    return std::shared_ptr<AsyncSocket>(new AsyncSocket(evb, fd), Destructor());
  }

  /**
   * Destroy the socket.
   *
   * AsyncSocket::destroy() must be called to destroy the socket.
   * The normal destructor is private, and should not be invoked directly.
   * This prevents callers from deleting a AsyncSocket while it is invoking a
   * callback.
   */
  void destroy() override;

  /**
   * Get the EventBase used by this socket.
   */
  EventBase* getEventBase() const override {
    return eventBase_;
  }

  /**
   * Get the file descriptor used by the AsyncSocket.
   */
  virtual int getFd() const {
    return fd_;
  }

  /**
   * Extract the file descriptor from the AsyncSocket.
   *
   * This will immediately cause any installed callbacks to be invoked with an
   * error.  The AsyncSocket may no longer be used after the file descriptor
   * has been extracted.
   *
   * This method should be used with care as the resulting fd is not guaranteed
   * to perfectly reflect the state of the AsyncSocket (security state,
   * pre-received data, etc.).
   *
   * Returns the file descriptor.  The caller assumes ownership of the
   * descriptor, and it will not be closed when the AsyncSocket is destroyed.
   */
  virtual int detachFd();

  /**
   * Uniquely identifies a handle to a socket option value. Each
   * combination of level and option name corresponds to one socket
   * option value.
   */
  class OptionKey {
   public:
    bool operator<(const OptionKey& other) const {
      if (level == other.level) {
        return optname < other.optname;
      }
      return level < other.level;
    }
    int apply(int fd, int val) const {
      return setsockopt(fd, level, optname, &val, sizeof(val));
    }
    int level;
    int optname;
  };

  // Maps from a socket option key to its value
  typedef std::map<OptionKey, int> OptionMap;

  static const OptionMap emptyOptionMap;
  static const folly::SocketAddress& anyAddress();

  /**
   * Initiate a connection.
   *
   * @param callback  The callback to inform when the connection attempt
   *                  completes.
   * @param address   The address to connect to.
   * @param timeout   A timeout value, in milliseconds.  If the connection
   *                  does not succeed within this period,
   *                  callback->connectError() will be invoked.
   */
  virtual void connect(
      ConnectCallback* callback,
      const folly::SocketAddress& address,
      int timeout = 0,
      const OptionMap& options = emptyOptionMap,
      const folly::SocketAddress& bindAddr = anyAddress()) noexcept;

  void connect(
      ConnectCallback* callback,
      const std::string& ip,
      uint16_t port,
      int timeout = 0,
      const OptionMap& options = emptyOptionMap) noexcept;

  /**
   * If a connect request is in-flight, cancels it and closes the socket
   * immediately. Otherwise, this is a no-op.
   *
   * This does not invoke any connection related callbacks. Call this to
   * prevent any connect callback while cleaning up, etc.
   */
  void cancelConnect();

  /**
   * Set the send timeout.
   *
   * If write requests do not make any progress for more than the specified
   * number of milliseconds, fail all pending writes and close the socket.
   *
   * If write requests are currently pending when setSendTimeout() is called,
   * the timeout interval is immediately restarted using the new value.
   *
   * (See the comments for AsyncSocket for an explanation of why AsyncSocket
   * provides setSendTimeout() but not setRecvTimeout().)
   *
   * @param milliseconds  The timeout duration, in milliseconds.  If 0, no
   *                      timeout will be used.
   */
  void setSendTimeout(uint32_t milliseconds) override;

  /**
   * Get the send timeout.
   *
   * @return Returns the current send timeout, in milliseconds.  A return value
   *         of 0 indicates that no timeout is set.
   */
  uint32_t getSendTimeout() const override {
    return sendTimeout_;
  }

  /**
   * Set the maximum number of reads to execute from the underlying
   * socket each time the EventBase detects that new ingress data is
   * available. The default is unlimited, but callers can use this method
   * to limit the amount of data read from the socket per event loop
   * iteration.
   *
   * @param maxReads  Maximum number of reads per data-available event;
   *                  a value of zero means unlimited.
   */
  void setMaxReadsPerEvent(uint16_t maxReads) {
    maxReadsPerEvent_ = maxReads;
  }

  /**
   * Get the maximum number of reads this object will execute from
   * the underlying socket each time the EventBase detects that new
   * ingress data is available.
   *
   * @returns Maximum number of reads per data-available event; a value
   *          of zero means unlimited.
   */
  uint16_t getMaxReadsPerEvent() const {
    return maxReadsPerEvent_;
  }

  /**
   * Set a pointer to ErrMessageCallback implementation which will be
   * receiving notifications for messages posted to the error queue
   * associated with the socket.
   * ErrMessageCallback is implemented only for platforms with
   * per-socket error message queus support (recvmsg() system call must
   * )
   *
   */
  virtual void setErrMessageCB(ErrMessageCallback* callback);

  /**
   * Get a pointer to ErrMessageCallback implementation currently
   * registered with this socket.
   *
   */
  virtual ErrMessageCallback* getErrMessageCallback() const;

  /**
   * Set a pointer to SendMsgParamsCallback implementation which
   * will be used to form ::sendmsg() system call parameters
   *
   */
  virtual void setSendMsgParamCB(SendMsgParamsCallback* callback);

  /**
   * Get a pointer to SendMsgParamsCallback implementation currently
   * registered with this socket.
   *
   */
  virtual SendMsgParamsCallback* getSendMsgParamsCB() const;

  // Read and write methods
  void setReadCB(ReadCallback* callback) override;
  ReadCallback* getReadCallback() const override;

  bool setZeroCopy(bool enable);
  bool getZeroCopy() const {
    return zeroCopyEnabled_;
  }

  uint32_t getZeroCopyBufId() const {
    return zeroCopyBufId_;
  }

  size_t getZeroCopyReenableThreshold() const {
    return zeroCopyReenableThreshold_;
  }

  void setZeroCopyReenableThreshold(size_t threshold);

  void write(
      WriteCallback* callback,
      const void* buf,
      size_t bytes,
      WriteFlags flags = WriteFlags::NONE) override;
  void writev(
      WriteCallback* callback,
      const iovec* vec,
      size_t count,
      WriteFlags flags = WriteFlags::NONE) override;
  void writeChain(
      WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& buf,
      WriteFlags flags = WriteFlags::NONE) override;

  class WriteRequest;
  virtual void writeRequest(WriteRequest* req);
  void writeRequestReady() {
    handleWrite();
  }

  // Methods inherited from AsyncTransport
  void close() override;
  void closeNow() override;
  void closeWithReset() override;
  void shutdownWrite() override;
  void shutdownWriteNow() override;

  bool readable() const override;
  bool writable() const override;
  bool isPending() const override;
  virtual bool hangup() const;
  bool good() const override;
  bool error() const override;
  void attachEventBase(EventBase* eventBase) override;
  void detachEventBase() override;
  bool isDetachable() const override;

  void getLocalAddress(folly::SocketAddress* address) const override;
  void getPeerAddress(folly::SocketAddress* address) const override;

  bool isEorTrackingEnabled() const override {
    return trackEor_;
  }

  void setEorTracking(bool track) override {
    trackEor_ = track;
  }

  bool connecting() const override {
    return (state_ == StateEnum::CONNECTING);
  }

  virtual bool isClosedByPeer() const {
    return (
        state_ == StateEnum::CLOSED &&
        (readErr_ == READ_EOF || readErr_ == READ_ERROR));
  }

  virtual bool isClosedBySelf() const {
    return (
        state_ == StateEnum::CLOSED &&
        (readErr_ != READ_EOF && readErr_ != READ_ERROR));
  }

  size_t getAppBytesWritten() const override {
    return appBytesWritten_;
  }

  size_t getRawBytesWritten() const override {
    return getAppBytesWritten();
  }

  size_t getAppBytesReceived() const override {
    return appBytesReceived_;
  }

  size_t getRawBytesReceived() const override {
    return getAppBytesReceived();
  }

  std::chrono::nanoseconds getConnectTime() const {
    return connectEndTime_ - connectStartTime_;
  }

  std::chrono::milliseconds getConnectTimeout() const {
    return connectTimeout_;
  }

  std::chrono::steady_clock::time_point getConnectStartTime() const {
    return connectStartTime_;
  }

  std::chrono::steady_clock::time_point getConnectEndTime() const {
    return connectEndTime_;
  }

  bool getTFOAttempted() const {
    return tfoAttempted_;
  }

  /**
   * Returns whether or not the attempt to use TFO
   * finished successfully. This does not necessarily
   * mean TFO worked, just that trying to use TFO
   * succeeded.
   */
  bool getTFOFinished() const {
    return tfoFinished_;
  }

  /**
   * Returns whether or not TFO attempt succeded on this
   * connection.
   * For servers this is pretty straightforward API and can
   * be invoked right after the connection is accepted. This API
   * will perform one syscall.
   * This API is a bit tricky to use for clients, since clients
   * only know this for sure after the SYN-ACK is returned. So it's
   * appropriate to call this only after the first application
   * data is read from the socket when the caller knows that
   * the SYN has been ACKed by the server.
   */
  bool getTFOSucceded() const;

  // Methods controlling socket options

  /**
   * Force writes to be transmitted immediately.
   *
   * This controls the TCP_NODELAY socket option.  When enabled, TCP segments
   * are sent as soon as possible, even if it is not a full frame of data.
   * When disabled, the data may be buffered briefly to try and wait for a full
   * frame of data.
   *
   * By default, TCP_NODELAY is enabled for AsyncSocket objects.
   *
   * This method will fail if the socket is not currently open.
   *
   * @return Returns 0 if the TCP_NODELAY flag was successfully updated,
   *         or a non-zero errno value on error.
   */
  int setNoDelay(bool noDelay);

  /**
   * Set the FD_CLOEXEC flag so that the socket will be closed if the program
   * later forks and execs.
   */
  void setCloseOnExec();

  /*
   * Set the Flavor of Congestion Control to be used for this Socket
   * Please check '/lib/modules/<kernel>/kernel/net/ipv4' for tcp_*.ko
   * first to make sure the module is available for plugging in
   * Alternatively you can choose from net.ipv4.tcp_allowed_congestion_control
   */
  int setCongestionFlavor(const std::string& cname);

  /*
   * Forces ACKs to be sent immediately
   *
   * @return Returns 0 if the TCP_QUICKACK flag was successfully updated,
   *         or a non-zero errno value on error.
   */
  int setQuickAck(bool quickack);

  /**
   * Set the send bufsize
   */
  int setSendBufSize(size_t bufsize);

  /**
   * Set the recv bufsize
   */
  int setRecvBufSize(size_t bufsize);

/**
 * Sets a specific tcp personality
 * Available only on kernels 3.2 and greater
 */
#define SO_SET_NAMESPACE 41
  int setTCPProfile(int profd);

  /**
   * Generic API for reading a socket option.
   *
   * @param level     same as the "level" parameter in getsockopt().
   * @param optname   same as the "optname" parameter in getsockopt().
   * @param optval    pointer to the variable in which the option value should
   *                  be returned.
   * @param optlen    value-result argument, initially containing the size of
   *                  the buffer pointed to by optval, and modified on return
   *                  to indicate the actual size of the value returned.
   * @return          same as the return value of getsockopt().
   */
  template <typename T>
  int getSockOpt(int level, int optname, T* optval, socklen_t* optlen) {
    return getsockopt(fd_, level, optname, (void*)optval, optlen);
  }

  /**
   * Generic API for setting a socket option.
   *
   * @param level     same as the "level" parameter in getsockopt().
   * @param optname   same as the "optname" parameter in getsockopt().
   * @param optval    the option value to set.
   * @return          same as the return value of setsockopt().
   */
  template <typename T>
  int setSockOpt(int level, int optname, const T* optval) {
    return setsockopt(fd_, level, optname, optval, sizeof(T));
  }

  /**
   * Virtual method for reading a socket option returning integer
   * value, which is the most typical case. Convenient for overriding
   * and mocking.
   *
   * @param level     same as the "level" parameter in getsockopt().
   * @param optname   same as the "optname" parameter in getsockopt().
   * @param optval    same as "optval" parameter in getsockopt().
   * @param optlen    same as "optlen" parameter in getsockopt().
   * @return          same as the return value of getsockopt().
   */
  virtual int
  getSockOptVirtual(int level, int optname, void* optval, socklen_t* optlen) {
    return getsockopt(fd_, level, optname, optval, optlen);
  }

  /**
   * Virtual method for setting a socket option accepting integer
   * value, which is the most typical case. Convenient for overriding
   * and mocking.
   *
   * @param level     same as the "level" parameter in setsockopt().
   * @param optname   same as the "optname" parameter in setsockopt().
   * @param optval    same as "optval" parameter in setsockopt().
   * @param optlen    same as "optlen" parameter in setsockopt().
   * @return          same as the return value of setsockopt().
   */
  virtual int setSockOptVirtual(
      int level,
      int optname,
      void const* optval,
      socklen_t optlen) {
    return setsockopt(fd_, level, optname, optval, optlen);
  }

  /**
   * Set pre-received data, to be returned to read callback before any data
   * from the socket.
   */
  virtual void setPreReceivedData(std::unique_ptr<IOBuf> data) {
    if (preReceivedData_) {
      preReceivedData_->prependChain(std::move(data));
    } else {
      preReceivedData_ = std::move(data);
    }
  }

  /**
   * Enables TFO behavior on the AsyncSocket if FOLLY_ALLOW_TFO
   * is set.
   */
  void enableTFO() {
    // No-op if folly does not allow tfo
#if FOLLY_ALLOW_TFO
    tfoEnabled_ = true;
#endif
  }

  void disableTransparentTls() {
    noTransparentTls_ = true;
  }

  void disableTSocks() {
    noTSocks_ = true;
  }

  enum class StateEnum : uint8_t {
    UNINIT,
    CONNECTING,
    ESTABLISHED,
    CLOSED,
    ERROR,
    FAST_OPEN,
  };

  void setBufferCallback(BufferCallback* cb);

  // Callers should set this prior to connecting the socket for the safest
  // behavior.
  void setEvbChangedCallback(std::unique_ptr<EvbChangeCallback> cb) {
    evbChangeCb_ = std::move(cb);
  }

  /**
   * Attempt to cache the current local and peer addresses (if not already
   * cached) so that they are available from getPeerAddress() and
   * getLocalAddress() even after the socket is closed.
   */
  void cacheAddresses();

  /**
   * Returns true if there is any zero copy write in progress
   * Needs to be called from within the socket's EVB thread
   */
  bool isZeroCopyWriteInProgress() const noexcept;

  /**
   * Tries to process the msg error queue
   * And returns true if there are no more zero copy writes in progress
   */
  bool processZeroCopyWriteInProgress() noexcept;

  void setPeerCertificate(
      std::unique_ptr<const AsyncTransportCertificate> cert) {
    peerCertData_ = std::move(cert);
  }
  const AsyncTransportCertificate* getPeerCertificate() const override {
    return peerCertData_.get();
  }

  void setSelfCertificate(
      std::unique_ptr<const AsyncTransportCertificate> cert) {
    selfCertData_ = std::move(cert);
  }

  const AsyncTransportCertificate* getSelfCertificate() const override {
    return selfCertData_.get();
  }

  /**
   * writeReturn is the total number of bytes written, or WRITE_ERROR on error.
   * If no data has been written, 0 is returned.
   * exception is a more specific exception that cause a write error.
   * Not all writes have exceptions associated with them thus writeReturn
   * should be checked to determine whether the operation resulted in an error.
   */
  struct WriteResult {
    explicit WriteResult(ssize_t ret) : writeReturn(ret) {}

    WriteResult(ssize_t ret, std::unique_ptr<const AsyncSocketException> e)
        : writeReturn(ret), exception(std::move(e)) {}

    ssize_t writeReturn;
    std::unique_ptr<const AsyncSocketException> exception;
  };

  /**
   * readReturn is the number of bytes read, or READ_EOF on EOF, or
   * READ_ERROR on error, or READ_BLOCKING if the operation will
   * block.
   * exception is a more specific exception that may have caused a read error.
   * Not all read errors have exceptions associated with them thus readReturn
   * should be checked to determine whether the operation resulted in an error.
   */
  struct ReadResult {
    explicit ReadResult(ssize_t ret) : readReturn(ret) {}

    ReadResult(ssize_t ret, std::unique_ptr<const AsyncSocketException> e)
        : readReturn(ret), exception(std::move(e)) {}

    ssize_t readReturn;
    std::unique_ptr<const AsyncSocketException> exception;
  };

  /**
   * A WriteRequest object tracks information about a pending write operation.
   */
  class WriteRequest {
   public:
    WriteRequest(AsyncSocket* socket, WriteCallback* callback)
        : socket_(socket), callback_(callback) {}

    virtual void start() {}

    virtual void destroy() = 0;

    virtual WriteResult performWrite() = 0;

    virtual void consume() = 0;

    virtual bool isComplete() = 0;

    WriteRequest* getNext() const {
      return next_;
    }

    WriteCallback* getCallback() const {
      return callback_;
    }

    uint32_t getTotalBytesWritten() const {
      return totalBytesWritten_;
    }

    void append(WriteRequest* next) {
      assert(next_ == nullptr);
      next_ = next;
    }

    void fail(const char* fn, const AsyncSocketException& ex) {
      socket_->failWrite(fn, ex);
    }

    void bytesWritten(size_t count) {
      totalBytesWritten_ += uint32_t(count);
      socket_->appBytesWritten_ += count;
    }

   protected:
    // protected destructor, to ensure callers use destroy()
    virtual ~WriteRequest() {}

    AsyncSocket* socket_; ///< parent socket
    WriteRequest* next_{nullptr}; ///< pointer to next WriteRequest
    WriteCallback* callback_; ///< completion callback
    uint32_t totalBytesWritten_{0}; ///< total bytes written
  };

 protected:
  enum ReadResultEnum {
    READ_EOF = 0,
    READ_ERROR = -1,
    READ_BLOCKING = -2,
    READ_NO_ERROR = -3,
  };

  enum WriteResultEnum {
    WRITE_ERROR = -1,
  };

  /**
   * Protected destructor.
   *
   * Users of AsyncSocket must never delete it directly.  Instead, invoke
   * destroy() instead.  (See the documentation in DelayedDestruction.h for
   * more details.)
   */
  ~AsyncSocket() override;

  friend std::ostream& operator<<(std::ostream& os, const StateEnum& state);

  enum ShutdownFlags {
    /// shutdownWrite() called, but we are still waiting on writes to drain
    SHUT_WRITE_PENDING = 0x01,
    /// writes have been completely shut down
    SHUT_WRITE = 0x02,
    /**
     * Reads have been shutdown.
     *
     * At the moment we don't distinguish between remote read shutdown
     * (received EOF from the remote end) and local read shutdown.  We can
     * only receive EOF when a read callback is set, and we immediately inform
     * it of the EOF.  Therefore there doesn't seem to be any reason to have a
     * separate state of "received EOF but the local side may still want to
     * read".
     *
     * We also don't currently provide any API for only shutting down the read
     * side of a socket.  (This is a no-op as far as TCP is concerned, anyway.)
     */
    SHUT_READ = 0x04,
  };

  class BytesWriteRequest;

  class WriteTimeout : public AsyncTimeout {
   public:
    WriteTimeout(AsyncSocket* socket, EventBase* eventBase)
        : AsyncTimeout(eventBase), socket_(socket) {}

    void timeoutExpired() noexcept override {
      socket_->timeoutExpired();
    }

   private:
    AsyncSocket* socket_;
  };

  class IoHandler : public EventHandler {
   public:
    IoHandler(AsyncSocket* socket, EventBase* eventBase)
        : EventHandler(eventBase, -1), socket_(socket) {}
    IoHandler(AsyncSocket* socket, EventBase* eventBase, int fd)
        : EventHandler(eventBase, fd), socket_(socket) {}

    void handlerReady(uint16_t events) noexcept override {
      socket_->ioReady(events);
    }

   private:
    AsyncSocket* socket_;
  };

  void init();

  class ImmediateReadCB : public folly::EventBase::LoopCallback {
   public:
    explicit ImmediateReadCB(AsyncSocket* socket) : socket_(socket) {}
    void runLoopCallback() noexcept override {
      DestructorGuard dg(socket_);
      socket_->checkForImmediateRead();
    }

   private:
    AsyncSocket* socket_;
  };

  /**
   * Schedule checkForImmediateRead to be executed in the next loop
   * iteration.
   */
  void scheduleImmediateRead() noexcept {
    if (good()) {
      eventBase_->runInLoop(&immediateReadHandler_);
    }
  }

  /**
   * Schedule handleInitalReadWrite to run in the next iteration.
   */
  void scheduleInitialReadWrite() noexcept {
    if (good()) {
      DestructorGuard dg(this);
      eventBase_->runInLoop([this, dg] {
        if (good()) {
          handleInitialReadWrite();
        }
      });
    }
  }

  // event notification methods
  void ioReady(uint16_t events) noexcept;
  virtual void checkForImmediateRead() noexcept;
  virtual void handleInitialReadWrite() noexcept;
  virtual void prepareReadBuffer(void** buf, size_t* buflen);
  virtual size_t handleErrMessages() noexcept;
  virtual void handleRead() noexcept;
  virtual void handleWrite() noexcept;
  virtual void handleConnect() noexcept;
  void timeoutExpired() noexcept;

  /**
   * Attempt to read from the socket.
   *
   * @param buf      The buffer to read data into.
   * @param buflen   The length of the buffer.
   *
   * @return Returns a read result. See read result for details.
   */
  virtual ReadResult performRead(void** buf, size_t* buflen, size_t* offset);

  /**
   * Populate an iovec array from an IOBuf and attempt to write it.
   *
   * @param callback Write completion/error callback.
   * @param vec      Target iovec array; caller retains ownership.
   * @param count    Number of IOBufs to write, beginning at start of buf.
   * @param buf      Chain of iovecs.
   * @param flags    set of flags for the underlying write calls, like cork
   */
  void writeChainImpl(
      WriteCallback* callback,
      iovec* vec,
      size_t count,
      std::unique_ptr<folly::IOBuf>&& buf,
      WriteFlags flags);

  /**
   * Write as much data as possible to the socket without blocking,
   * and queue up any leftover data to send when the socket can
   * handle writes again.
   *
   * @param callback The callback to invoke when the write is completed.
   * @param vec      Array of buffers to write; this method will make a
   *                 copy of the vector (but not the buffers themselves)
   *                 if the write has to be completed asynchronously.
   * @param count    Number of elements in vec.
   * @param buf      The IOBuf that manages the buffers referenced by
   *                 vec, or a pointer to nullptr if the buffers are not
   *                 associated with an IOBuf.  Note that ownership of
   *                 the IOBuf is transferred here; upon completion of
   *                 the write, the AsyncSocket deletes the IOBuf.
   * @param flags    Set of write flags.
   */
  void writeImpl(
      WriteCallback* callback,
      const iovec* vec,
      size_t count,
      std::unique_ptr<folly::IOBuf>&& buf,
      WriteFlags flags = WriteFlags::NONE);

  /**
   * Attempt to write to the socket.
   *
   * @param vec             The iovec array pointing to the buffers to write.
   * @param count           The length of the iovec array.
   * @param flags           Set of write flags.
   * @param countWritten    On return, the value pointed to by this parameter
   *                          will contain the number of iovec entries that were
   *                          fully written.
   * @param partialWritten  On return, the value pointed to by this parameter
   *                          will contain the number of bytes written in the
   *                          partially written iovec entry.
   *
   * @return Returns a WriteResult. See WriteResult for more details.
   */
  virtual WriteResult performWrite(
      const iovec* vec,
      uint32_t count,
      WriteFlags flags,
      uint32_t* countWritten,
      uint32_t* partialWritten);

  /**
   * Sends the message over the socket using sendmsg
   *
   * @param msg       Message to send
   * @param msg_flags Flags to pass to sendmsg
   */
  AsyncSocket::WriteResult
  sendSocketMessage(int fd, struct msghdr* msg, int msg_flags);

  virtual ssize_t tfoSendMsg(int fd, struct msghdr* msg, int msg_flags);

  int socketConnect(const struct sockaddr* addr, socklen_t len);

  virtual void scheduleConnectTimeout();
  void registerForConnectEvents();

  bool updateEventRegistration();

  /**
   * Update event registration.
   *
   * @param enable Flags of events to enable. Set it to 0 if no events
   * need to be enabled in this call.
   * @param disable Flags of events
   * to disable. Set it to 0 if no events need to be disabled in this
   * call.
   *
   * @return true iff the update is successful.
   */
  bool updateEventRegistration(uint16_t enable, uint16_t disable);

  // Actually close the file descriptor and set it to -1 so we don't
  // accidentally close it again.
  void doClose();

  // error handling methods
  void startFail();
  void finishFail();
  void finishFail(const AsyncSocketException& ex);
  void invokeAllErrors(const AsyncSocketException& ex);
  void fail(const char* fn, const AsyncSocketException& ex);
  void failConnect(const char* fn, const AsyncSocketException& ex);
  void failRead(const char* fn, const AsyncSocketException& ex);
  void failErrMessageRead(const char* fn, const AsyncSocketException& ex);
  void failWrite(
      const char* fn,
      WriteCallback* callback,
      size_t bytesWritten,
      const AsyncSocketException& ex);
  void failWrite(const char* fn, const AsyncSocketException& ex);
  void failAllWrites(const AsyncSocketException& ex);
  virtual void invokeConnectErr(const AsyncSocketException& ex);
  virtual void invokeConnectSuccess();
  void invalidState(ConnectCallback* callback);
  void invalidState(ErrMessageCallback* callback);
  void invalidState(ReadCallback* callback);
  void invalidState(WriteCallback* callback);

  std::string withAddr(const std::string& s);

  void cacheLocalAddress() const;
  void cachePeerAddress() const;

  bool isZeroCopyRequest(WriteFlags flags);

  bool isZeroCopyMsg(const cmsghdr& cmsg) const;
  void processZeroCopyMsg(const cmsghdr& cmsg);

  uint32_t getNextZeroCopyBufId() {
    return zeroCopyBufId_++;
  }
  void adjustZeroCopyFlags(folly::WriteFlags& flags);
  void addZeroCopyBuf(std::unique_ptr<folly::IOBuf>&& buf);
  void addZeroCopyBuf(folly::IOBuf* ptr);
  void setZeroCopyBuf(std::unique_ptr<folly::IOBuf>&& buf);
  bool containsZeroCopyBuf(folly::IOBuf* ptr);
  void releaseZeroCopyBuf(uint32_t id);

  // a folly::IOBuf can be used in multiple partial requests
  // there is a that maps a buffer id to a raw folly::IOBuf ptr
  // and another one that adds a ref count for a folly::IOBuf that is either
  // the original ptr or nullptr
  uint32_t zeroCopyBufId_{0};

  struct IOBufInfo {
    uint32_t count_{0};
    std::unique_ptr<folly::IOBuf> buf_;
  };

  std::unordered_map<uint32_t, folly::IOBuf*> idZeroCopyBufPtrMap_;
  std::unordered_map<folly::IOBuf*, IOBufInfo> idZeroCopyBufInfoMap_;

  StateEnum state_; ///< StateEnum describing current state
  uint8_t shutdownFlags_; ///< Shutdown state (ShutdownFlags)
  uint16_t eventFlags_; ///< EventBase::HandlerFlags settings
  int fd_; ///< The socket file descriptor
  mutable folly::SocketAddress addr_; ///< The address we tried to connect to
  mutable folly::SocketAddress localAddr_;
  ///< The address we are connecting from
  uint32_t sendTimeout_; ///< The send timeout, in milliseconds
  uint16_t maxReadsPerEvent_; ///< Max reads per event loop iteration

  bool isBufferMovable_{false};

  int8_t readErr_{READ_NO_ERROR}; ///< The read error encountered, if any

  EventBase* eventBase_; ///< The EventBase
  WriteTimeout writeTimeout_; ///< A timeout for connect and write
  IoHandler ioHandler_; ///< A EventHandler to monitor the fd
  ImmediateReadCB immediateReadHandler_; ///< LoopCallback for checking read

  ConnectCallback* connectCallback_; ///< ConnectCallback
  ErrMessageCallback* errMessageCallback_; ///< TimestampCallback
  SendMsgParamsCallback* ///< Callback for retrieving
      sendMsgParamCallback_; ///< ::sendmsg() parameters
  ReadCallback* readCallback_; ///< ReadCallback
  WriteRequest* writeReqHead_; ///< Chain of WriteRequests
  WriteRequest* writeReqTail_; ///< End of WriteRequest chain
  std::weak_ptr<ShutdownSocketSet> wShutdownSocketSet_;
  size_t appBytesReceived_; ///< Num of bytes received from socket
  size_t appBytesWritten_; ///< Num of bytes written to socket

  // Pre-received data, to be returned to read callback before any data from the
  // socket.
  std::unique_ptr<IOBuf> preReceivedData_;

  std::chrono::steady_clock::time_point connectStartTime_;
  std::chrono::steady_clock::time_point connectEndTime_;

  std::chrono::milliseconds connectTimeout_{0};

  std::unique_ptr<EvbChangeCallback> evbChangeCb_{nullptr};

  BufferCallback* bufferCallback_{nullptr};
  bool tfoEnabled_{false};
  bool tfoAttempted_{false};
  bool tfoFinished_{false};
  bool noTransparentTls_{false};
  bool noTSocks_{false};
  // Whether to track EOR or not.
  bool trackEor_{false};
  bool zeroCopyEnabled_{false};
  bool zeroCopyVal_{false};
  // zerocopy reenable logic
  size_t zeroCopyReenableThreshold_{0};
  size_t zeroCopyReenableCounter_{0};

  // subclasses may cache these on first call to get
  mutable std::unique_ptr<const AsyncTransportCertificate> peerCertData_{
      nullptr};
  mutable std::unique_ptr<const AsyncTransportCertificate> selfCertData_{
      nullptr};
};
#ifdef _MSC_VER
#pragma vtordisp(pop)
#endif

} // namespace folly
