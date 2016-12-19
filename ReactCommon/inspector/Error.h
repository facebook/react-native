// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include "Protocol.h"

#include <string>
#include <exception>

#include <folly/Optional.h>

namespace facebook {
namespace react {

class InspectorException : public std::exception {
public:
  InspectorException(int callId, ErrorCode code, std::string message);
  explicit InspectorException(ErrorCode code, std::string message);

  const char* what() const throw() override {
    return error_.message().c_str();
  }

  const Error& error() const {
    return error_;
  }

  InspectorException withCallId(int callId) const;
private:
  Error error_;
};

}
}
