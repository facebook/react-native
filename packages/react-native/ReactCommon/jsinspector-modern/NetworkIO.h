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

namespace {
class Stream;
}

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
