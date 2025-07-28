/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"

#include <folly/dynamic.h>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * This class is only responsible for serializing a local TraceEvent
 * representation into JSON, that should be ready to be dispatched over the
 * protocol.
 */
class TraceEventSerializer {
 public:
  /**
   * Serializes a TraceEvent to a folly::dynamic object.
   *
   * \param event rvalue reference to the TraceEvent object.
   * \return A folly::dynamic object that represents a serialized into JSON
   * Trace Event for CDP.
   */
  static folly::dynamic serialize(TraceEvent&& event);
};

} // namespace facebook::react::jsinspector_modern::tracing
