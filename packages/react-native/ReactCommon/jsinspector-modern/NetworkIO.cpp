/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkIO.h"
#include <folly/base64.h>

namespace facebook::react::jsinspector_modern {

static constexpr unsigned long DEFAULT_BYTES_PER_READ =
    1048576; // 1MB (Chrome v112 default)

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

Stream::Stream(
    std::function<void(std::variant<InitStreamError, InitStreamResult>)> initCb)
    : initCb_(std::move(initCb)) {}

void Stream::onData(std::string_view data) {
  executorFromThis()([copy = std::string(data)](Stream& self) {
    self.data_ << copy;
    self.bytesReceived_ += copy.length();
    self.processPending();
  });
}

void Stream::onHeaders(int httpStatusCode, const Headers& headers) {
  executorFromThis()([=](Stream& self) {
    // If we've already seen an error, the initial callback as already been
    // called with it.
    if (self.initCb_) {
      self.initCb_(InitStreamResult{httpStatusCode, headers});
      self.initCb_ = nullptr;
    }
  });
}

void Stream::onError(const std::string& message) {
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

void Stream::onEnd() {
  executorFromThis()([](Stream& self) {
    self.completed_ = true;
    self.processPending();
  });
}

void Stream::setCancelFunction(std::function<void()> cancelFunction) {
  cancelFunction_ = std::move(cancelFunction);
}

// Must be called from the executor thread
void Stream::read(
    unsigned long maxBytesToRead,
    std::function<void(std::variant<IOReadError, IOReadResult>)> callback) {
  pendingReadRequests_.emplace_back(std::make_tuple(maxBytesToRead, callback));
  processPending();
}

void Stream::cancel() {
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

IOReadResult Stream::respond(unsigned long maxBytesToRead) {
  std::vector<char> buffer(maxBytesToRead);
  data_.read(buffer.data(), maxBytesToRead);
  auto bytesRead = data_.gcount();
  buffer.resize(bytesRead);
  return IOReadResult{
      .data = folly::base64Encode(std::string_view(&buffer[0], buffer.size())),
      .eof = bytesRead == 0 && completed_,
      // TODO: Support UTF-8 string responses
      .base64Encoded = true};
}

void Stream::processPending() {
  // Go through each pending request in insertion order - execute the callback
  // and remove it from pending if it can be satisfied.
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

} // namespace facebook::react::jsinspector_modern
