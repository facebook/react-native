/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "ScopedExecutor.h"

#include <mutex>
#include <sstream>
#include <string>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

using StreamID = const std::string;
using Headers = std::map<std::string, std::string>;
using IOReadError = const std::string;

struct InitStreamResult {
  int httpStatusCode;
  const Headers& headers;
};
using InitStreamError = const std::string;

struct LoadNetworkResourceParams {
  std::string url;
};

struct ReadStreamParams {
  StreamID handle;
  std::optional<unsigned long> size;
  std::optional<unsigned long> offset;
};

struct NetworkResource {
  bool success{};
  std::optional<std::string> stream;
  std::optional<int> httpStatusCode;
  std::optional<std::string> netErrorName;
  std::optional<Headers> headers;
};

struct IOReadResult {
  std::string data;
  bool eof;
  bool base64Encoded;
};

class NetworkRequestListener {
 public:
  NetworkRequestListener() = default;
  NetworkRequestListener(const NetworkRequestListener&) = delete;
  NetworkRequestListener& operator=(const NetworkRequestListener&) = delete;
  NetworkRequestListener(NetworkRequestListener&&) noexcept = default;
  NetworkRequestListener& operator=(NetworkRequestListener&&) noexcept =
      default;
  virtual ~NetworkRequestListener() = default;
  virtual void onData(std::string_view data) = 0;
  virtual void onHeaders(int httpStatusCode, const Headers& headers) = 0;
  virtual void onError(const std::string& message) = 0;
  virtual void onEnd() = 0;
  virtual void setCancelFunction(std::function<void()> cancelFunction) = 0;
};

class NetworkRequestDelegate {
 public:
  NetworkRequestDelegate() = default;
  NetworkRequestDelegate(const NetworkRequestDelegate&) = delete;
  NetworkRequestDelegate& operator=(const NetworkRequestDelegate&) = delete;
  NetworkRequestDelegate(NetworkRequestDelegate&&) noexcept = delete;
  NetworkRequestDelegate& operator=(NetworkRequestDelegate&&) noexcept = delete;
  virtual ~NetworkRequestDelegate() = default;
  virtual void networkRequest(
      const std::string& /*url*/,
      std::shared_ptr<NetworkRequestListener> /*listener*/) {
    throw NotImplementedException(
        "NetworkRequestDelegate.networkRequest is not implemented by this delegate.");
  }
};

namespace {

/**
 * Private class owning state and implementing the listener for a particular
 * request
 *
 * NetworkRequestListener overrides are thread safe, all other methods must be
 * called from the same thread.
 */
class Stream : public NetworkRequestListener,
               public EnableExecutorFromThis<Stream> {
 public:
  explicit Stream(
      std::function<void(std::variant<InitStreamError, InitStreamResult>)>
          initCb);

  /**
   * NetworkIO-facing API. Enqueue a read request for up to maxBytesToRead
   * bytes, starting from the end of the previous read.
   */
  void read(
      unsigned long maxBytesToRead,
      std::function<void(std::variant<IOReadError, IOReadResult>)> callback);

  /**
   * NetworkIO-facing API. Call the platform-provided cancelFunction, if any,
   * call the error callbacks of any in-flight read requests, and the initial
   * error callback if it has not already fulfilled with success or error.
   */
  void cancel();

  /**
   * Implementation of NetworkRequestListener, to be called by platform
   * HostTargetDelegate. Any of these methods may be called from any thread.
   */
  void onData(std::string_view data) override;
  void onHeaders(int httpStatusCode, const Headers& headers) override;
  void onError(const std::string& message) override;
  void onEnd() override;
  void setCancelFunction(std::function<void()> cancelFunction) override;
  /* End NetworkRequestListener */

 private:
  void processPending();
  IOReadResult respond(unsigned long maxBytesToRead);

  bool completed_{false};
  std::optional<std::string> error_;
  std::stringstream data_;
  unsigned long bytesReceived_{0};
  std::optional<std::function<void()>> cancelFunction_{std::nullopt};
  std::function<void(std::variant<InitStreamError, InitStreamResult>)> initCb_;
  std::vector<std::tuple<
      unsigned long /* bytesToRead */,
      std::function<void(
          std::variant<IOReadError, IOReadResult>)> /* read callback */>>
      pendingReadRequests_;
};

} // namespace

/**
 * Provides the core implementation for handling CDP's
 * Network.loadNetworkResource, IO.read and IO.close.
 *
 * Owns state of all in-progress and completed HTTP requests - ensure
 * closeStream is used to free resources once consumed.
 *
 * Public methods must be called on the same thread. Callbacks will be called
 * through the given executor.
 */
class NetworkIO : public EnableExecutorFromThis<NetworkIO> {
 public:
  ~NetworkIO();

  /**
   * Begin loading an HTTP resource, delegating platform-specific
   * implementation. The callback will be called when either headers are
   * received or an error occurs. If successful, the Stream ID provided to the
   * callback can be used to read the contents of the resource via readStream().
   */
  void loadNetworkResource(
      const LoadNetworkResourceParams& params,
      NetworkRequestDelegate& delegate,
      std::function<void(NetworkResource)> callback);

  /**
   * Close a given stream by its handle, call the callback with std::nullopt if
   * a stream is found and destroyed, or with an error message if the stream is
   * not found. Safely aborts any in-flight request.
   */
  void closeStream(
      const StreamID& streamId,
      std::function<void(std::optional<std::string> error)> callback);

  /**
   * Read a chunk of data from the stream, once enough has been downloaded, or
   * call back with an error.
   */
  void readStream(
      const ReadStreamParams& params,
      std::function<void(std::variant<IOReadError, IOReadResult> result)>
          callback);

 private:
  /**
   * Map of stream objects, which contain data received, accept read requests
   * and listen for delegate events. Delegates have a shared_ptr to the Stream
   * instance, but Streams should not live beyond the destruction of this
   * NetworkIO instance.
   */
  std::unordered_map<std::string, std::shared_ptr<Stream>> streams_;
  unsigned long nextStreamId_{0};

  bool cancelAndRemoveStreamIfExists(const StreamID& streamId);
};

} // namespace facebook::react::jsinspector_modern
