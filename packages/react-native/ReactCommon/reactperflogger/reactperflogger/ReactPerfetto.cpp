/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#include "ReactPerfetto.h"

#include <perfetto.h>
#include <chrono>
#include <unordered_map>

#if defined(__APPLE__)
#include <ctime>
#endif

#include "FuseboxPerfettoDataSource.h"
#include "HermesPerfettoDataSource.h"
#include "ReactPerfettoCategories.h"

namespace facebook::react {

std::once_flag perfettoInit;
void initializePerfetto() {
  std::call_once(perfettoInit, []() {
    perfetto::TracingInitArgs args;
    // Raise the size of the shared memory buffer. Since this
    // is only used in tracing build, large buffers are okay
    // for now.
    args.shmem_size_hint_kb = 20 * 1024;
    args.backends |= perfetto::kSystemBackend;
    args.use_monotonic_clock = true;
    perfetto::Tracing::Initialize(args);
    TrackEvent::Register();
  });

  HermesPerfettoDataSource::RegisterDataSource();
  FuseboxPerfettoDataSource::RegisterDataSource();
}

static perfetto::Track createTrack(const std::string& trackName) {
  // Offset for custom perfetto tracks
  static uint64_t trackId = 0x5F3759DF;
  auto track = perfetto::Track(trackId++);
  auto desc = track.Serialize();
  desc.set_name(trackName);
  TrackEvent::SetTrackDescriptor(track, desc);
  return track;
}

perfetto::Track getPerfettoWebPerfTrackSync(const std::string& trackName) {
  // In the case of marks we can reuse the same track saving some resources,
  // because there's no risk of partial overlap that would break the timings.
  static std::unordered_map<std::string, perfetto::Track> tracks;

  auto it = tracks.find(trackName);
  if (it == tracks.end()) {
    auto track = createTrack(trackName);
    tracks.emplace(trackName, track);
    return track;
  } else {
    return it->second;
  }
}

perfetto::Track getPerfettoWebPerfTrackAsync(const std::string& trackName) {
  // Note that, in the case of measures, we don't cache and reuse a track for a
  // given name because Perfetto does not support partially overlapping measures
  // in the same track.
  //
  // E.g.:
  //   [.....]
  //     [......]
  // In that case, Perfetto would just cut subsequent measures as:
  //  [.....]
  //     [..]    <-- Part of this section is gone, so the timing is incorrect.
  //
  // There's a solution though. Perfetto does group different tracks with the
  // same name together, so having a separate track for each async event allows
  // overlap.
  return createTrack(trackName);
}

// Perfetto's monotonic clock matches the std::chrono::steady_clock we use in
// HighResTimeStamp on Android platforms, so no adjustment is needed there. On
// Apple platforms that assumption is false: HighResTimeStamp is backed by
// mach_absolute_time (CLOCK_UPTIME_RAW, which excludes time the device spent
// asleep) while Perfetto stamps native events with CLOCK_MONOTONIC (which
// includes time asleep). The two clocks have different epochs, so without
// adjustment JS web-performance events land far off the native timeline. Apply
// the offset between the clocks to bring JS events into Perfetto's trace clock
// domain.
uint64_t highResTimeStampToPerfettoTraceTime(HighResTimeStamp timestamp) {
  auto chronoDurationSinceSteadyClockEpoch =
      timestamp.toChronoSteadyClockTimePoint().time_since_epoch();
  auto nanoseconds = std::chrono::duration_cast<std::chrono::nanoseconds>(
      chronoDurationSinceSteadyClockEpoch);

#if defined(__APPLE__)
  // Capture the offset between CLOCK_MONOTONIC and the steady_clock
  // (CLOCK_UPTIME_RAW) backing HighResTimeStamp once. This is exact while the
  // device stays awake; it can drift across sleep because CLOCK_MONOTONIC keeps
  // advancing while mach time does not. For short cold-start traces that drift
  // is negligible.
  static const int64_t offsetNanos = []() {
    timespec ts{};
    clock_gettime(CLOCK_MONOTONIC, &ts);
    int64_t monotonicNanos =
        static_cast<int64_t>(ts.tv_sec) * 1'000'000'000LL + ts.tv_nsec;
    int64_t steadyNanos =
        std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch())
            .count();
    return monotonicNanos - steadyNanos;
  }();

  return static_cast<uint64_t>(nanoseconds.count() + offsetNanos);
#else
  return static_cast<uint64_t>(nanoseconds.count());
#endif
}

} // namespace facebook::react

#endif // WITH_PERFETTO
