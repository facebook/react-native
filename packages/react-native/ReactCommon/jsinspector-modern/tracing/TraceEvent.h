/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * A trace event to send to the debugger frontend, as defined by the Trace Event
 * Format.
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.yr4qxyxotyw
 */
struct TraceEvent {
  /**
   * Optional. Serialized as a string, usually is hexadecimal number.
   * https://github.com/ChromeDevTools/devtools-frontend/blob/99a9104ae974f8caa63927e356800f6762cdbf25/front_end/models/trace/helpers/Trace.ts#L198-L201
   */
  std::optional<uint32_t> id;

  /** The name of the event, as displayed in the Trace Viewer. */
  std::string name;

  /**
   * A comma separated list of categories for the event, configuring how
   * events are shown in the Trace Viewer UI.
   */
  std::string cat;

  /**
   * The event type. This is a single character which changes depending on the
   * type of event being output. See
   * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.puwqg050lyuy
   */
  char ph;

  /** The tracing clock timestamp of the event, in microseconds (µs). */
  uint64_t ts;

  /** The process ID for the process that output this event. */
  uint64_t pid;

  /** The thread ID for the process that output this event. */
  uint64_t tid;

  /** Any arguments provided for the event. */
  folly::dynamic args = folly::dynamic::object();

  /**
   * The duration of the event, in microseconds (µs). Only applicable to
   * complete events ("ph": "X").
   */
  std::optional<uint64_t> dur;
};

} // namespace

} // namespace facebook::react::jsinspector_modern
