// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <string>
#include <chrono>

namespace facebook {
namespace react {

void SystraceBeginSection(const char* name, const char* args) noexcept;
void SystraceEndSection(const char* name, const char* args, std::chrono::nanoseconds duration) noexcept;

/**
 * This is a convenience class to avoid lots of verbose profiling
 * #ifdefs.  If WITH_FBSYSTRACE is not defined, the optimizer will
 * remove this completely.  If it is defined, it will behave as
 * FbSystraceSection, with the right tag provided.
 */
struct SystraceSection {
public:
  template<typename... ConvertsToStringPiece>
  explicit SystraceSection(const char* name, ConvertsToStringPiece&&... args)
#ifdef WITH_FBSYSTRACE
    : m_section(TRACE_TAG_REACT_CXX_BRIDGE, name, std::forward<ConvertsToStringPiece>(args)...)
#elif defined(WITH_OFFICE_TRACING)
    : m_start(std::chrono::steady_clock::now())
    , m_name{name}
    , m_args{concatArgs(std::forward<ConvertsToStringPiece>(args)...)}
  {
    SystraceBeginSection(m_name.c_str(), m_args.c_str());
  }

  ~SystraceSection()
  {
    SystraceEndSection(m_name.c_str(), m_args.c_str(), std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::steady_clock::now()-m_start));
  }

private:
  std::string concatArgs() noexcept
  {
    return "";
  }

  template<typename... ConvertsToStringPiece>
  std::string concatArgs(const char* name, const std::string& value, ConvertsToStringPiece&&... rest) noexcept
  {
    return std::string(name) + "=" + value + "|" + concatArgs(std::forward<ConvertsToStringPiece>(rest)...);
  }
#else
  {}
#endif

#ifdef WITH_FBSYSTRACE
  fbsystrace::FbSystraceSection m_section;
#elif defined(WITH_OFFICE_TRACING)
  std::string m_name;
  std::string m_args;
  std::chrono::time_point<std::chrono::steady_clock> m_start;
#endif
};

// Some placeholder definitions to satisfy linker.. as we are enabling some unintented code paths when enabling these macros.
#if defined(WITH_OFFICE_TRACING)
#define TRACE_TAG_REACT_CXX_BRIDGE 0
struct FbSystraceAsyncFlow{
    static void begin(uint64_t /*tag*/, const char* /*name*/, int /*cookie*/) {}
    static void end(uint64_t /*tag*/, const char* /*name*/, int /*cookie*/) {}
};
#endif

}}
