// Copyright 2004-present Facebook. All Rights Reserved.

#include "Error.h"

namespace facebook {
namespace react {

InspectorException::InspectorException(int callId, ErrorCode code, std::string message)
  : error_(callId, code, std::move(message)) {}

InspectorException::InspectorException(ErrorCode code, std::string message)
  : error_(code, std::move(message)) {}

InspectorException InspectorException::withCallId(int callId) const {
  return InspectorException(callId, error_.code(), error_.message());
}

}
}
