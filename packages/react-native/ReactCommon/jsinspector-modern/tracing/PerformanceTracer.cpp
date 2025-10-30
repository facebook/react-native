/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracer.h"
#include "Timing.h"
#include "TraceEventSerializer.h"

#include <jsinspector-modern/network/CdpNetwork.h>
#include <jsinspector-modern/network/HttpUtils.h>
#include <oscompat/OSCompat.h>
#include <react/timing/primitives.h>

#include <folly/json.h>

#include <mutex>

using namespace facebook::react;

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/**
 * Instead of validating that the indicated duration is positive, we can ensure
 * the value is sensible (less than 1 seccond doesn't make much sense).
 */
const HighResDuration MIN_VALUE_FOR_MAX_TRACE_DURATION_OPTION =
    HighResDuration::fromMilliseconds(1000); // 1 second

ThreadId getCurrentThreadId() {
  static thread_local const auto CURRENT_THREAD_ID =
      oscompat::getCurrentThreadId();
  return CURRENT_THREAD_ID;
}

} // namespace

PerformanceTracer& PerformanceTracer::getInstance() {
  static PerformanceTracer tracer;
  return tracer;
}

PerformanceTracer::PerformanceTracer()
    : processId_(oscompat::getCurrentProcessId()) {}

bool PerformanceTracer::startTracing() {
  return startTracingImpl();
}

bool PerformanceTracer::startTracing(HighResDuration maxDuration) {
  return startTracingImpl(maxDuration);
}

bool PerformanceTracer::startTracingImpl(
    std::optional<HighResDuration> maxDuration) {
  std::vector<TracingStateCallback> callbacksToNotify;

  {
    std::lock_guard lock(mutex_);

    if (tracingAtomic_) {
      return false;
    }

    tracingAtomic_ = true;

    if (maxDuration && *maxDuration < MIN_VALUE_FOR_MAX_TRACE_DURATION_OPTION) {
      throw std::invalid_argument("maxDuration should be at least 1 second");
    }

    currentTraceStartTime_ = HighResTimeStamp::now();
    currentTraceMaxDuration_ = maxDuration;

    for (const auto& [id, callback] : tracingStateCallbacks_) {
      callbacksToNotify.push_back(callback);
    }
  }

  for (const auto& callback : callbacksToNotify) {
    callback(true);
  }

  return true;
}

std::optional<std::vector<TraceEvent>> PerformanceTracer::stopTracing() {
  std::vector<TraceEvent> events;
  std::vector<TracingStateCallback> callbacksToNotify;

  auto currentTraceEndTime = HighResTimeStamp::now();

  {
    std::lock_guard lock(mutex_);

    if (!tracingAtomic_) {
      return std::nullopt;
    }

    // Collect callbacks before disabling tracing
    for (const auto& [id, callback] : tracingStateCallbacks_) {
      callbacksToNotify.push_back(callback);
    }
  }

  // Notify callbacks while tracing is still enabled, so they can send final
  // events
  for (const auto& callback : callbacksToNotify) {
    callback(false);
  }

  {
    std::lock_guard lock(mutex_);

    tracingAtomic_ = false;
    performanceMeasureCount_ = 0;

    alreadyEmittedEntryForComponentsTrackOrdering_ = false;
    events = collectEventsAndClearBuffers(currentTraceEndTime);
  }

  auto currentTraceStartTime = currentTraceStartTime_;
  if (currentTraceMaxDuration_ &&
      currentTraceEndTime - *currentTraceMaxDuration_ > currentTraceStartTime) {
    currentTraceStartTime = currentTraceEndTime - *currentTraceMaxDuration_;
  }

  // This is synthetic Trace Event, which should not be represented on a
  // timeline. CDT is not using Profile or ProfileChunk events for determining
  // trace timeline window, this is why trace that only contains JavaScript
  // samples will be displayed as empty. We use these events to avoid that.
  // This could happen for non-bridgeless apps, where Performance interface is
  // not supported and no spec-compliant Event Loop implementation.

  events.emplace_back(
      TraceEvent{
          .name = "TracingStartedInPage",
          .cat = "disabled-by-default-devtools.timeline",
          .ph = 'I',
          .ts = currentTraceStartTime,
          .pid = processId_,
          .tid = getCurrentThreadId(),
          .args = folly::dynamic::object("data", folly::dynamic::object()),
      });

  events.emplace_back(
      TraceEvent{
          .name = "ReactNative-TracingStopped",
          .cat = "disabled-by-default-devtools.timeline",
          .ph = 'I',
          .ts = currentTraceEndTime,
          .pid = processId_,
          .tid = getCurrentThreadId(),
      });

  currentTraceMaxDuration_ = std::nullopt;

  return events;
}

void PerformanceTracer::reportMark(
    const std::string& name,
    HighResTimeStamp start,
    folly::dynamic&& detail) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerEventMark{
          .name = name,
          .start = start,
          .detail = std::move(detail),
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportMeasure(
    const std::string& name,
    HighResTimeStamp start,
    HighResDuration duration,
    folly::dynamic&& detail) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerEventMeasure{
          .name = name,
          .start = start,
          .duration = duration,
          .detail = std::move(detail),
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportTimeStamp(
    const std::string& name,
    std::optional<ConsoleTimeStampEntry> start,
    std::optional<ConsoleTimeStampEntry> end,
    std::optional<std::string> trackName,
    std::optional<std::string> trackGroup,
    std::optional<ConsoleTimeStampColor> color,
    std::optional<folly::dynamic> detail) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerEventTimeStamp{
          .name = name,
          .start = std::move(start),
          .end = std::move(end),
          .trackName = std::move(trackName),
          .trackGroup = std::move(trackGroup),
          .color = std::move(color),
          .detail = std::move(detail),
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportEventLoopTask(
    HighResTimeStamp start,
    HighResTimeStamp end) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerEventEventLoopTask{
          .start = start,
          .end = end,
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportEventLoopMicrotasks(
    HighResTimeStamp start,
    HighResTimeStamp end) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerEventEventLoopMicrotask{
          .start = start,
          .end = end,
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportResourceSendRequest(
    const std::string& devtoolsRequestId,
    HighResTimeStamp start,
    const std::string& url,
    const std::string& requestMethod,
    const Headers& headers) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  auto resourceType =
      jsinspector_modern::cdp::network::resourceTypeFromMimeType(
          jsinspector_modern::mimeTypeFromHeaders(headers));
  enqueueEvent(
      PerformanceTracerResourceSendRequest{
          .requestId = devtoolsRequestId,
          .url = url,
          .start = start,
          .requestMethod = requestMethod,
          .resourceType = resourceType,
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportResourceReceiveResponse(
    const std::string& devtoolsRequestId,
    HighResTimeStamp start,
    int statusCode,
    const Headers& headers,
    int encodedDataLength,
    folly::dynamic timingData) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerResourceReceiveResponse{
          .requestId = devtoolsRequestId,
          .start = start,
          .encodedDataLength = encodedDataLength,
          .headers = headers,
          .mimeType = jsinspector_modern::mimeTypeFromHeaders(headers),
          .protocol = "h2",
          .statusCode = statusCode,
          .timing = std::move(timingData),
          .threadId = getCurrentThreadId(),
      });
}

void PerformanceTracer::reportResourceFinish(
    const std::string& devtoolsRequestId,
    HighResTimeStamp start,
    int encodedDataLength,
    int decodedBodyLength) {
  if (!tracingAtomic_) {
    return;
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracingAtomic_) {
    return;
  }

  enqueueEvent(
      PerformanceTracerResourceFinish{
          .requestId = devtoolsRequestId,
          .start = start,
          .encodedDataLength = encodedDataLength,
          .decodedBodyLength = decodedBodyLength,
          .threadId = getCurrentThreadId(),
      });
}

/* static */ TraceEvent PerformanceTracer::constructRuntimeProfileTraceEvent(
    RuntimeProfileId profileId,
    ProcessId processId,
    ThreadId threadId,
    HighResTimeStamp profileTimestamp) {
  // CDT prioritizes event timestamp over startTime metadata field.
  // https://fburl.com/lo764pf4
  return TraceEvent{
      .id = profileId,
      .name = "Profile",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = profileTimestamp,
      .pid = processId,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          folly::dynamic::object(
              "startTime",
              highResTimeStampToTracingClockTimeStamp(profileTimestamp))),
  };
}

/* static */ TraceEvent
PerformanceTracer::constructRuntimeProfileChunkTraceEvent(
    RuntimeProfileId profileId,
    ProcessId processId,
    ProcessId threadId,
    HighResTimeStamp chunkTimestamp,
    TraceEventProfileChunk&& traceEventProfileChunk) {
  return TraceEvent{
      .id = profileId,
      .name = "ProfileChunk",
      .cat = "disabled-by-default-v8.cpu_profiler",
      .ph = 'P',
      .ts = chunkTimestamp,
      .pid = processId,
      .tid = threadId,
      .args = folly::dynamic::object(
          "data",
          TraceEventSerializer::serializeProfileChunk(
              std::move(traceEventProfileChunk))),
  };
}

#pragma mark - Tracing window methods

/**
 * If a `maxDuration` value is set when starting a trace, we use 2 buffers
 * for events. Each buffer can contain entries for a range up to `maxDuration`.
 * When the current buffer is full, we clear the previous one and we start
 * collecting events in a new buffer, which becomes current.
 *
 * Example:
 *   - Start:
 *     previousBuffer: null, currentBuffer: []
 *   - As entries are added:
 *     previousBuffer: null, currentBuffer: [a, b, c...]
 *   - When now - currentBuffer start time > maxDuration:
 *     previousBuffer: [a, b, c...], currentBuffer: []
 *   - As entries are added:
 *     previousbuffer: [a, b, c...], currentBuffer: [x, y, z...]
 *   - When now - currentBuffer start time > maxDuration:
 *     previousBuffer: [x, y, z...], currentBuffer: []
 *   - When the trace finishes:
 *     We collect all events in both buffers that are still within
 *     `maxDuration`.
 *
 * This way, we ensure we keep all events in the `maxDuration` window, and
 * clearing expired events is trivial (just clearing a vector).
 */

std::vector<TraceEvent> PerformanceTracer::collectEventsAndClearBuffers(
    HighResTimeStamp currentTraceEndTime) {
  std::vector<TraceEvent> events;

  if (currentTraceMaxDuration_) {
    // Collect non-expired entries from the previous buffer
    if (previousBuffer_ != nullptr) {
      collectEventsAndClearBuffer(
          events, *previousBuffer_, currentTraceEndTime);
    }

    collectEventsAndClearBuffer(events, *currentBuffer_, currentTraceEndTime);

    // Reset state.
    currentBuffer_ = &buffer_;
    previousBuffer_ = nullptr;
  } else {
    // Trivial case.
    events.reserve(currentBuffer_->size());
    for (auto&& event : *currentBuffer_) {
      enqueueTraceEventsFromPerformanceTracerEvent(events, std::move(event));
    }
    currentBuffer_->clear();
  }

  return events;
}

void PerformanceTracer::collectEventsAndClearBuffer(
    std::vector<TraceEvent>& events,
    std::vector<PerformanceTracerEvent>& buffer,
    HighResTimeStamp currentTraceEndTime) {
  for (auto&& event : buffer) {
    if (isInTracingWindow(currentTraceEndTime, getCreatedAt(event))) {
      enqueueTraceEventsFromPerformanceTracerEvent(events, std::move(event));
    }
  }

  buffer.clear();
  buffer.shrink_to_fit();
}

bool PerformanceTracer::isInTracingWindow(
    HighResTimeStamp now,
    HighResTimeStamp timeStampToCheck) const {
  if (!currentTraceMaxDuration_) {
    return true;
  }

  return timeStampToCheck > now - *currentTraceMaxDuration_;
}

void PerformanceTracer::enqueueEvent(PerformanceTracerEvent&& event) {
  if (currentTraceMaxDuration_) {
    auto createdAt = getCreatedAt(event);
    // Check if the current buffer is "full"
    if (createdAt > currentBufferStartTime_ + *currentTraceMaxDuration_) {
      // We moved past the current buffer. We need to switch the other buffer as
      // current.
      previousBuffer_ = currentBuffer_;
      currentBuffer_ = currentBuffer_ == &buffer_ ? &altBuffer_ : &buffer_;
      currentBuffer_->clear();
      currentBufferStartTime_ = createdAt;
    }
  }

  currentBuffer_->emplace_back(std::move(event));
}

HighResTimeStamp PerformanceTracer::getCreatedAt(
    const PerformanceTracerEvent& event) const {
  return std::visit(
      [](const auto& variant) { return variant.createdAt; }, event);
}

namespace {
template <class... Ts>
struct overloaded : Ts... {
  using Ts::operator()...;
};
template <class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;
} // namespace

void PerformanceTracer::enqueueTraceEventsFromPerformanceTracerEvent(
    std::vector<TraceEvent>& events,
    PerformanceTracerEvent&& event) {
  std::visit(
      overloaded{
          [&](PerformanceTracerEventEventLoopTask&& event) {
            events.emplace_back(
                TraceEvent{
                    .name = "RunTask",
                    .cat = "disabled-by-default-devtools.timeline",
                    .ph = 'X',
                    .ts = event.start,
                    .pid = processId_,
                    .tid = event.threadId,
                    .dur = event.end - event.start,
                });
          },
          [&](PerformanceTracerEventEventLoopMicrotask&& event) {
            events.emplace_back(
                TraceEvent{
                    .name = "RunMicrotasks",
                    .cat = "v8.execute",
                    .ph = 'X',
                    .ts = event.start,
                    .pid = processId_,
                    .tid = event.threadId,
                    .dur = event.end - event.start,
                });
          },
          [&](PerformanceTracerEventMark&& event) {
            folly::dynamic eventArgs = folly::dynamic::object();
            if (event.detail != nullptr) {
              eventArgs = folly::dynamic::object(
                  "data",
                  folly::dynamic::object(
                      "detail", folly::toJson(event.detail)));
            }

            events.emplace_back(
                TraceEvent{
                    .name = std::move(event.name),
                    .cat = "blink.user_timing",
                    .ph = 'I',
                    .ts = event.start,
                    .pid = processId_,
                    .tid = event.threadId,
                    .args = std::move(eventArgs),
                });
          },
          [&](PerformanceTracerEventMeasure&& event) {
            folly::dynamic beginEventArgs = folly::dynamic::object();
            if (event.detail != nullptr) {
              beginEventArgs =
                  folly::dynamic::object("detail", folly::toJson(event.detail));
            }

            auto eventId = ++performanceMeasureCount_;

            events.emplace_back(
                TraceEvent{
                    .id = eventId,
                    .name = event.name,
                    .cat = "blink.user_timing",
                    .ph = 'b',
                    .ts = event.start,
                    .pid = processId_,
                    .tid = event.threadId,
                    .args = std::move(beginEventArgs),
                });
            events.emplace_back(
                TraceEvent{
                    .id = eventId,
                    .name = std::move(event.name),
                    .cat = "blink.user_timing",
                    .ph = 'e',
                    .ts = event.start + event.duration,
                    .pid = processId_,
                    .tid = event.threadId,
                });
          },
          [&](PerformanceTracerEventTimeStamp&& event) {
            folly::dynamic data = folly::dynamic::object("name", event.name)(
                "message", std::move(event.name));
            if (event.start) {
              if (std::holds_alternative<HighResTimeStamp>(*event.start)) {
                data["start"] = highResTimeStampToTracingClockTimeStamp(
                    std::get<HighResTimeStamp>(*event.start));
              } else {
                data["start"] = std::move(std::get<std::string>(*event.start));
              }
            }
            if (event.end) {
              if (std::holds_alternative<HighResTimeStamp>(*event.end)) {
                data["end"] = highResTimeStampToTracingClockTimeStamp(
                    std::get<HighResTimeStamp>(*event.end));
              } else {
                data["end"] = std::move(std::get<std::string>(*event.end));
              }
            }

            // We add a custom synthetic entry here to manually put Components
            // track right under the Scheduler track. Will be removed once CDT
            // Frontend preserves track ordering and we upgrade the fork.
            if (!alreadyEmittedEntryForComponentsTrackOrdering_ &&
                event.trackName && !event.trackGroup) {
              if (*event.trackName == "Components \u269B") {
                alreadyEmittedEntryForComponentsTrackOrdering_ = true;
                // React is using 0.003 for Scheduler sub-tracks.
                auto timestamp = highResTimeStampToTracingClockTimeStamp(
                    HighResTimeStamp::fromDOMHighResTimeStamp(0.004));
                events.emplace_back(
                    TraceEvent{
                        .name = "TimeStamp",
                        .cat = "devtools.timeline",
                        .ph = 'I',
                        .ts = event.createdAt,
                        .pid = processId_,
                        .tid = event.threadId,
                        .args = folly::dynamic::object(
                            "data",
                            folly::dynamic::object(
                                "name", "ReactNative-ComponentsTrack")(
                                "start", timestamp)("end", timestamp)(
                                "track", *event.trackName)),
                    });
              }
            }

            if (event.trackName) {
              data["track"] = std::move(*event.trackName);
            }
            if (event.trackGroup) {
              data["trackGroup"] = std::move(*event.trackGroup);
            }
            if (event.color) {
              data["color"] = consoleTimeStampColorToString(*event.color);
            }
            if (event.detail) {
              folly::dynamic devtoolsDetail = folly::dynamic::object();
              for (const auto& [key, value] : event.detail->items()) {
                devtoolsDetail[key] = value;
              }
              data["devtools"] = folly::toJson(devtoolsDetail);
            }

            events.emplace_back(
                TraceEvent{
                    .name = "TimeStamp",
                    .cat = "devtools.timeline",
                    .ph = 'I',
                    .ts = event.createdAt,
                    .pid = processId_,
                    .tid = event.threadId,
                    .args = folly::dynamic::object("data", std::move(data)),
                });
          },
          [&](PerformanceTracerResourceSendRequest&& event) {
            folly::dynamic data =
                folly::dynamic::object("initiator", folly::dynamic::object())(
                    "priority", "VeryHigh")("renderBlocking", "non_blocking")(
                    "requestId", std::move(event.requestId))(
                    "requestMethod", std::move(event.requestMethod))(
                    "resourceType", std::move(event.resourceType))(
                    "url", std::move(event.url));

            events.emplace_back(
                TraceEvent{
                    .name = "ResourceSendRequest",
                    .cat = "devtools.timeline",
                    .ph = 'I',
                    .ts = event.start,
                    .pid = processId_,
                    .s = 't',
                    .tid = event.threadId,
                    .args = folly::dynamic::object("data", std::move(data)),
                });
          },
          [&](PerformanceTracerResourceReceiveResponse&& event) {
            folly::dynamic headersEntries = folly::dynamic::array;
            for (const auto& [key, value] : event.headers) {
              headersEntries.push_back(
                  folly::dynamic::object("name", key)("value", value));
            }
            folly::dynamic data = folly::dynamic::object(
                "encodedDataLength", event.encodedDataLength)(
                "headers", headersEntries)("mimeType", event.mimeType)(
                "protocol", event.protocol)(
                "requestId", std::move(event.requestId))(
                "statusCode", event.statusCode)(
                "timing", std::move(event.timing));

            events.emplace_back(
                TraceEvent{
                    .name = "ResourceReceiveResponse",
                    .cat = "devtools.timeline",
                    .ph = 'I',
                    .ts = event.start,
                    .pid = processId_,
                    .s = 't',
                    .tid = event.threadId,
                    .args = folly::dynamic::object("data", std::move(data)),
                });
          },
          [&](PerformanceTracerResourceFinish&& event) {
            folly::dynamic data = folly::dynamic::object(
                "decodedBodyLength", event.decodedBodyLength)("didFail", false)(
                "encodedDataLength", event.encodedDataLength)(
                "requestId", std::move(event.requestId));

            events.emplace_back(
                TraceEvent{
                    .name = "ResourceFinish",
                    .cat = "devtools.timeline",
                    .ph = 'I',
                    .ts = event.start,
                    .pid = processId_,
                    .s = 't',
                    .tid = event.threadId,
                    .args = folly::dynamic::object("data", std::move(data)),
                });
          },
      },
      std::move(event));
}

uint32_t PerformanceTracer::subscribeToTracingStateChanges(
    TracingStateCallback callback) {
  std::lock_guard lock(mutex_);
  uint32_t subscriptionId = nextCallbackId_++;
  tracingStateCallbacks_[subscriptionId] = std::move(callback);
  return subscriptionId;
}

void PerformanceTracer::unsubscribeFromTracingStateChanges(
    uint32_t subscriptionId) {
  std::lock_guard lock(mutex_);
  tracingStateCallbacks_.erase(subscriptionId);
}

} // namespace facebook::react::jsinspector_modern::tracing
