/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#include "ReactPerfetto.h"

#include <perfetto.h>
#include <unordered_map>

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
    perfetto::TrackEvent::Register();
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
  perfetto::TrackEvent::SetTrackDescriptor(track, desc);
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

// Perfetto's monotonic clock seems to match the std::chrono::steady_clock we
// use in JSExecutor::performanceNow on Android platforms, but if that
// assumption is incorrect we may need to manually offset perfetto timestamps.
uint64_t performanceNowToPerfettoTraceTime(double perfNowTime) {
  if (perfNowTime == 0) {
    return perfetto::TrackEvent::GetTraceTimeNs();
  }
  return static_cast<uint64_t>(perfNowTime * 1.e6);
}

} // namespace facebook::react

#endif // WITH_PERFETTO
