/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>

#include <optional>
#include <string>

namespace facebook::react {
class AppSettings {
 public:
  static unsigned int windowWidth;
  static unsigned int windowHeight;

  // Minimum log level for the messages logged to glog/logging.
  static int minLogLevel;

  static std::string defaultBundlePath;

  static std::optional<folly::dynamic> dynamicFeatureFlags;

  static void init(int argc, char* argv[]);

 private:
  static void initInternal();
};
} // namespace facebook::react
