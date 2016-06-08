// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/FBString.h>
#include <string>

namespace facebook {
namespace react {
namespace detail {
// TODO(cjhopman): Once folly is updated, remove these.

inline std::string toStdString(std::string&& str) {
  return std::move(str);
}

inline std::string toStdString(folly::fbstring&& str) {
  return str.toStdString();
}

}}}
