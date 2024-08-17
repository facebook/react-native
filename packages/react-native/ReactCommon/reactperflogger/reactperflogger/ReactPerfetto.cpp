/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#include <perfetto.h>
#include <unordered_map>

#include "HermesPerfettoDataSource.h"
#include "ReactPerfettoCategories.h"

std::once_flag perfettoInit;
void initializePerfetto() {
  std::call_once(perfettoInit, []() {
    perfetto::TracingInitArgs args;
    args.backends |= perfetto::kSystemBackend;
    args.use_monotonic_clock = true;
    perfetto::Tracing::Initialize(args);
    perfetto::TrackEvent::Register();
  });

  HermesPerfettoDataSource::RegisterDataSource();
}

perfetto::Track getPerfettoWebPerfTrack(const std::string& trackName) {
  static std::unordered_map<std::string, perfetto::Track> tracks;
  // Offset for custom perfetto tracks
  static uint64_t trackId = 0x5F3759DF;
  auto it = tracks.find(trackName);
  if (it == tracks.end()) {
    auto track = perfetto::Track(trackId++);
    auto desc = track.Serialize();
    desc.set_name(trackName);
    perfetto::TrackEvent::SetTrackDescriptor(track, desc);
    tracks.emplace(trackName, track);
    return track;
  } else {
    return it->second;
  }
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

#endif // WITH_PERFETTO
