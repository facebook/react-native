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
#include <hz_tracing/TracingMacros.h>

#define SCOPED_TRACE_CPU_AUTO()                  \
  HZT_TRACE_SCOPE_AUTO(                          \
      ::horizon::tracing::TraceLevel::Important, \
      ::horizon::tracing::EventCategory::Update, \
      "react_native",                            \
      ::horizon::tracing::DestinationFlag::Default);

#define SCOPED_TRACE_CPU(name)                   \
  HZT_TRACE_SCOPE(                               \
      name,                                      \
      ::horizon::tracing::TraceLevel::Important, \
      ::horizon::tracing::EventCategory::Update, \
      "react_native",                            \
      ::horizon::tracing::DestinationFlag::Default);

#else
#ifndef SCOPED_TRACE_CPU_AUTO
#define SCOPED_TRACE_CPU_AUTO() ((void)0)
#endif
#ifndef SCOPED_TRACE_CPU
#define SCOPED_TRACE_CPU(name) ((void)0)
#endif
#endif
