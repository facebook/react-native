/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include <folly/Try.h>
#include <folly/dynamic.h>
#include <folly/json.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {
namespace message {

struct RequestHandler;

/// Serializable is an interface for objects that can be serialized to and from
/// JSON.
struct Serializable {
  virtual ~Serializable() = default;
  virtual folly::dynamic toDynamic() const = 0;

  std::string toJson() const {
    return folly::toJson(toDynamic());
  }
};

/// Requests are sent from the debugger to the target.
struct Request : public Serializable {
  static std::unique_ptr<Request> fromJsonThrowOnError(const std::string &str);
  static folly::Try<std::unique_ptr<Request>> fromJson(const std::string &str);

  Request() = default;
  explicit Request(std::string method) : method(method) {}

  // accept dispatches to the appropriate handler method in RequestHandler based
  // on the type of the request.
  virtual void accept(RequestHandler &handler) const = 0;

  int id = 0;
  std::string method;
};

/// Responses are sent from the target to the debugger in response to a Request.
struct Response : public Serializable {
  Response() = default;

  int id = 0;
};

/// Notifications are sent from the target to the debugger. This is used to
/// notify the debugger about events that occur in the target, e.g. stopping
/// at a breakpoint.
struct Notification : public Serializable {
  Notification() = default;
  explicit Notification(std::string method) : method(method) {}

  std::string method;
};

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
