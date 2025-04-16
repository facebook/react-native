/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RNCXX_WITH_PROFILING_PROVIDER
#define RNCXX_WITH_PROFILING_PROVIDER 0
#endif

#if RNCXX_WITH_PROFILING_PROVIDER
#include <core/Trace.h>
#else
#ifndef SCOPED_TRACE_CPU_AUTO
#define SCOPED_TRACE_CPU_AUTO() ((void)0)
#endif
#ifndef SCOPED_TRACE_CPU
#define SCOPED_TRACE_CPU(name) ((void)0)
#endif
#endif
