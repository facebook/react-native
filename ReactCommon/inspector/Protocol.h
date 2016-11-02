// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>

#include <folly/dynamic.h>
#include <folly/Optional.h>

namespace facebook {
namespace react {

class Method {
public:
  static Method parse(const std::string& formatted);

  Method(std::string domain, std::string name);

  const std::string& domain() const {
    return domain_;
  }

  const std::string& name() const {
    return name_;
  }

  std::string formatted() const;
private:
  std::string domain_;
  std::string name_;
};

class Event {
public:
  explicit Event(std::string domain, std::string method, folly::dynamic params);

  operator std::string() const;
private:
  Method method_;
  folly::dynamic params_;
};

namespace Timestamp {
  double now();
}

enum class ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000,
};

class Error {
public:
  Error(int callId, ErrorCode code, std::string message);
  Error(ErrorCode code, std::string message);

  const std::string& message() const {
    return message_;
  }

  ErrorCode code() const {
    return code_;
  }

  operator std::string() const;
private:
  folly::Optional<int> callId_;
  ErrorCode code_;
  std::string message_;
};

}
}
