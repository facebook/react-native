/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_PERFETTO

#include <perfetto.h>
#include <reactperflogger/ReactPerfettoCategories.h>
#include <string>

void initializePerfetto();

perfetto::Track getPerfettoWebPerfTrack(const std::string& trackName);

uint64_t performanceNowToPerfettoTraceTime(double perfNowTime);

#endif // WITH_PERFETTO
