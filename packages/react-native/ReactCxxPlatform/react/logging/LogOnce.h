/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>

#include <sstream>

#define LOG_INFO_ONCE LogOnceWrapper(LogOnceWrapper::Severity::Info)
#define LOG_WARNING_ONCE LogOnceWrapper(LogOnceWrapper::Severity::Warning)
#define LOG_ERROR_ONCE LogOnceWrapper(LogOnceWrapper::Severity::Error)
#define LOG_FATAL_ONCE LogOnceWrapper(LogOnceWrapper::Severity::Fatal)

namespace facebook::react {

class LogOnceWrapper : public std::stringstream {
 public:
  enum class Severity { Info, Warning, Error, Fatal };

  LogOnceWrapper(Severity severity = Severity::Info) : severity_(severity) {}

  ~LogOnceWrapper();

 private:
  Severity severity_{Severity::Info};
};

} // namespace facebook::react
