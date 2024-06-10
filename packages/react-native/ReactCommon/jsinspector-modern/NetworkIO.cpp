/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkIO.h"
#include <folly/base64.h>

namespace facebook::react::jsinspector_modern {

static constexpr long DEFAULT_BYTES_PER_READ =
    1048576; // 1MB (Chrome v112 default)

namespace {

struct InitStreamResult {
  int httpStatusCode;
  const Headers& headers;
};
using InitStreamError = const std::string;

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
          initCb)
      : initCb_(std::move(initCb)) {}

  /**
   * NetworkIO-facing API. Enqueue a read request for up to maxBytesToRead
   * bytes, starting from the end of the previous read.
   */
  void read(
      long maxBytesToRead,
      std::function<void(std::variant<IOReadError, IOReadResult>)> callback) {
    pendingReadRequests_.emplace_back(
        std::make_tuple(maxBytesToRead, callback));
    processPending();
  }

  /**
   * NetworkIO-facing API. Call the platform-provided cancelFunction, if any,
   * call the error callbacks of any in-flight read requests, and the initial
   * error callback if it has not already fulfilled with success or error.
   */
  void cancel() {
    executorFromThis()([](Stream& self) {
      if (self.cancelFunction_) {
        (*self.cancelFunction_)();
      }
      self.error_ = "Cancelled";
      if (self.initCb_) {
        self.initCb_(InitStreamError{"Cancelled"});
        self.initCb_ = nullptr;
      }
      // Respond to any in-flight read requests with an error.
      self.processPending();
    });
  }

  /**
   * Implementation of NetworkRequestListener, to be called by platform
   * HostTargetDelegate. Any of these methods may be called from any thread.
   */
  void onData(std::string_view data) override {
    executorFromThis()([copy = std::string(data)](Stream& self) {
      self.data_ << copy;
      self.bytesReceived_ += copy.length();
      self.processPending();
    });
  }

  void onHeaders(int httpStatusCode, const Headers& headers) override {
    executorFromThis()([=](Stream& self) {
      // If we've already seen an error, the initial callback as already been
      // called with it.
      if (self.initCb_) {
        self.initCb_(InitStreamResult{httpStatusCode, headers});
        self.initCb_ = nullptr;
      }
    });
  }

  void onError(const std::string& message) override {
    executorFromThis()([=](Stream& self) {
      // Only call the error callback once.
      if (!self.error_) {
        self.error_ = message;
        if (self.initCb_) {
          self.initCb_(InitStreamError{message});
          self.initCb_ = nullptr;
        }
      }
      self.processPending();
    });
  }

  void onEnd() override {
    executorFromThis()([](Stream& self) {
      self.completed_ = true;
      self.processPending();
    });
  }

  void setCancelFunction(std::function<void()> cancelFunction) override {
    cancelFunction_ = std::move(cancelFunction);
  }
  /* End NetworkRequestListener */

 private:
  void processPending() {
    // Go through each pending request in insertion order - execute the
    // callback and remove it from pending if it can be satisfied.
    for (auto it = pendingReadRequests_.begin();
         it != pendingReadRequests_.end();) {
      auto maxBytesToRead = std::get<0>(*it);
      auto callback = std::get<1>(*it);

      if (error_) {
        callback(IOReadError{*error_});
      } else if (
          completed_ || (bytesReceived_ - data_.tellg() >= maxBytesToRead)) {
        try {
          callback(respond(maxBytesToRead));
        } catch (const std::runtime_error& error) {
          callback(IOReadError{error.what()});
        }
      } else {
        // Not yet received enough data
        ++it;
        continue;
      }
      it = pendingReadRequests_.erase(it);
    }
  }

  IOReadResult respond(long maxBytesToRead) {
    std::vector<char> buffer(maxBytesToRead);
    data_.read(buffer.data(), maxBytesToRead);
    auto bytesRead = data_.gcount();
    buffer.resize(bytesRead);
    return IOReadResult{
        .data =
            folly::base64Encode(std::string_view(buffer.data(), buffer.size())),
        .eof = bytesRead == 0 && completed_,
        // TODO: Support UTF-8 string responses
        .base64Encoded = true};
  }

  bool completed_{false};
  std::optional<std::string> error_;
  std::stringstream data_;
  long bytesReceived_{0};
  std::optional<std::function<void()>> cancelFunction_{std::nullopt};
  std::function<void(std::variant<InitStreamError, InitStreamResult>)> initCb_;
  std::vector<std::tuple<
      long /* bytesToRead */,
      std::function<void(
          std::variant<IOReadError, IOReadResult>)> /* read callback */>>
      pendingReadRequests_;
};
} // namespace

void NetworkIO::loadNetworkResource(
    const LoadNetworkResourceParams& params,
    NetworkRequestDelegate& delegate,
    std::function<void(NetworkResource)> callback) {
  // This is an opaque identifier, but an incrementing integer in a string is
  // consistent with Chrome.
  StreamID streamId = std::to_string(nextStreamId_++);
  auto stream = std::make_shared<Stream>(
      [streamId, callback, weakSelf = weak_from_this()](
          std::variant<InitStreamError, InitStreamResult> resultOrError) {
        NetworkResource toReturn;
        if (std::holds_alternative<InitStreamResult>(resultOrError)) {
          auto& result = std::get<InitStreamResult>(resultOrError);
          if (result.httpStatusCode >= 200 && result.httpStatusCode < 400) {
            toReturn = NetworkResource{
                .success = true,
                .stream = streamId,
                .httpStatusCode = result.httpStatusCode,
                .headers = result.headers};
          } else {
            toReturn = NetworkResource{
                .success = false,
                .httpStatusCode = result.httpStatusCode,
                .headers = result.headers};
          }
        } else {
          auto& error = std::get<InitStreamError>(resultOrError);
          toReturn = NetworkResource{.success = false, .netErrorName = error};
        }
        if (!toReturn.success) {
          if (auto strongSelf = weakSelf.lock()) {
            strongSelf->cancelAndRemoveStreamIfExists(streamId);
          }
        }
        callback(toReturn);
      });
  stream->setExecutor(executorFromThis());
  streams_[streamId] = stream;
  // Begin the network request on the platform, passing a shared_ptr to stream
  // (a NetworkRequestListener) for platform code to call back into.
  delegate.networkRequest(params.url, stream);
}

void NetworkIO::readStream(
    const ReadStreamParams& params,
    std::function<void(std::variant<IOReadError, IOReadResult>)> callback) {
  auto it = streams_.find(params.handle);
  if (it == streams_.end()) {
    callback(IOReadError{"Stream not found with handle " + params.handle});
  } else {
    it->second->read(
        params.size ? *params.size : DEFAULT_BYTES_PER_READ, callback);
    return;
  }
}

void NetworkIO::closeStream(
    const StreamID& streamId,
    std::function<void(std::optional<std::string> error)> callback) {
  if (cancelAndRemoveStreamIfExists(streamId)) {
    callback(std::nullopt);
  } else {
    callback("Stream not found: " + streamId);
  }
}

bool NetworkIO::cancelAndRemoveStreamIfExists(const StreamID& streamId) {
  auto it = streams_.find(streamId);
  if (it == streams_.end()) {
    return false;
  } else {
    it->second->cancel();
    streams_.erase(it->first);
    return true;
  }
}

NetworkIO::~NetworkIO() {
  // Each stream is also retained by the delegate for as long as the request
  // is in progress. Cancel the network operation (if implemented by the
  // platform) to avoid unnecessary traffic and allow cleanup as soon as
  // possible.
  for (auto& [_, stream] : streams_) {
    stream->cancel();
  }
}

} // namespace facebook::react::jsinspector_modern
