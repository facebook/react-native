cmake_minimum_required (VERSION 3.0)

if (POLICY CMP0042)
  cmake_policy (SET CMP0042 NEW)
endif (POLICY CMP0042)

if (POLICY CMP0063)
  cmake_policy (SET CMP0063 NEW)
endif (POLICY CMP0063)

project (google-glog)

enable_testing ()

set (GLOG_MAJOR_VERSION 0)
set (GLOG_MINOR_VERSION 3)
set (GLOG_PATCH_VERSION 5)

set (GLOG_VERSION
  ${GLOG_MAJOR_VERSION}.${GLOG_MINOR_VERSION}.${GLOG_PATCH_VERSION})

set (CPACK_PACKAGE_NAME glog)
set (CPACK_PACKAGE_DESCRIPTION_SUMMARY "")
set (CPACK_PACKAGE_VERSION_MAJOR ${GLOG_MAJOR_VERSION})
set (CPACK_PACKAGE_VERSION_MINOR ${GLOG_MINOR_VERSION})
set (CPACK_PACKAGE_VERSION_PATCH ${GLOG_PATCH_VERSION})
set (CPACK_PACKAGE_VERSION ${GLOG_VERSION})

option (WITH_GFLAGS "Use gflags" ON)
option (WITH_THREADS "Enable multithreading support" ON)

list (APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake)

include (CheckCSourceCompiles)
include (CheckCXXCompilerFlag)
include (CheckCXXSourceCompiles)
include (CheckFunctionExists)
include (CheckIncludeFile)
include (CheckIncludeFileCXX)
include (CheckLibraryExists)
include (CheckStructHasMember)
include (CheckSymbolExists)
include (CheckTypeSize)
include (CMakePackageConfigHelpers)
include (CPack)
include (CTest)
include (DetermineGflagsNamespace)

set (CMAKE_THREAD_PREFER_PTHREAD 1)

if (WITH_GFLAGS)
  find_package (gflags)

  if (gflags_FOUND)
    set (HAVE_LIB_GFLAGS 1)
    determine_gflags_namespace (gflags_NAMESPACE)
  endif (gflags_FOUND)
endif (WITH_GFLAGS)

if (WITH_THREADS)
  find_package (Threads)
endif (WITH_THREADS)

check_include_file (dlfcn.h HAVE_DLFCN_H)
check_include_file (execinfo.h HAVE_EXECINFO_H)
check_include_file (glob.h HAVE_GLOB_H)
check_include_file (inttypes.h HAVE_INTTYPES_H)
check_include_file (libunwind.h HAVE_LIBUNWIND_H)
check_include_file (memory.h HAVE_MEMORY_H)
check_include_file (pwd.h HAVE_PWD_H)
check_include_file (stdint.h HAVE_STDINT_H)
check_include_file (stdlib.h HAVE_STDLIB_H)
check_include_file (string.h HAVE_STRING_H)
check_include_file (strings.h HAVE_STRINGS_H)
check_include_file (sys/stat.h HAVE_SYS_STAT_H)
check_include_file (sys/syscall.h HAVE_SYS_SYSCALL_H)
check_include_file (sys/time.h HAVE_SYS_TIME_H)
check_include_file (sys/types.h HAVE_SYS_TYPES_H)
check_include_file (sys/utsname.h HAVE_SYS_UTSNAME_H)
check_include_file (syscall.h HAVE_SYSCALL_H)
check_include_file (syslog.h HAVE_SYSLOG_H)
check_include_file (ucontext.h HAVE_UCONTEXT_H)
check_include_file (unistd.h HAVE_UNISTD_H)
check_include_file (unwind.h HAVE_UNWIND_H)

check_include_file_cxx ("ext/hash_map" HAVE_EXT_HASH_MAP)
check_include_file_cxx ("ext/hash_set" HAVE_EXT_HASH_SET)
check_include_file_cxx ("ext/slist" HAVE_EXT_SLIST)
check_include_file_cxx ("tr1/unordered_map" HAVE_TR1_UNORDERED_MAP)
check_include_file_cxx ("tr1/unordered_set" HAVE_TR1_UNORDERED_SET)
check_include_file_cxx ("unordered_map" HAVE_UNORDERED_MAP)
check_include_file_cxx ("unordered_set" HAVE_UNORDERED_SET)

check_type_size ("unsigned __int16" HAVE___UINT16)
check_type_size (u_int16_t HAVE_U_INT16_T)
check_type_size (uint16_t HAVE_UINT16_T)

check_function_exists (dladdr HAVE_DLADDR)
check_function_exists (fcntl HAVE_FCNTL)
check_function_exists (pread HAVE_PREAD)
check_function_exists (pwrite HAVE_PWRITE)
check_function_exists (sigaction HAVE_SIGACTION)
check_function_exists (sigaltstack HAVE_SIGALSTACK)

# NOTE gcc does not fail if you pass a non-existent -Wno-* option as an
# argument. However, it will happily fail if you pass the corresponding -W*
# option. So, we check whether options that disable warnings exist by testing
# the availability of the corresponding option that enables the warning. This
# eliminates the need to check for compiler for several (mainly Clang) options.

check_cxx_compiler_flag (-Wdeprecated HAVE_NO_DEPRECATED)
check_cxx_compiler_flag (-Wunnamed-type-template-args
    HAVE_NO_UNNAMED_TYPE_TEMPLATE_ARGS)

# NOTE: Cannot use check_function_exists here since >=vc-14.0 can define
# snprintf as an inline function
check_symbol_exists (snprintf stdio.h HAVE_SNPRINTF)

check_library_exists (unwind get_static_proc_name "" HAVE_LIB_UNWIND)

find_library (UNWIND_LIBRARY NAMES unwind DOC "unwind library")
mark_as_advanced (UNWIND_LIBRARY)

check_c_source_compiles ("
#include <stdlib.h>
static void foo(void) __attribute__ ((unused));
int main(void) { return 0; }
" HAVE___ATTRIBUTE__)

check_c_source_compiles ("
#include <stdlib.h>
static void foo(void) __attribute__ ((visibility(\"default\")));
int main(void) { return 0; }
" HAVE___ATTRIBUTE__VISIBILITY_DEFAULT)

check_c_source_compiles ("
#include <stdlib.h>
static void foo(void) __attribute__ ((visibility(\"hidden\")));
int main(void) { return 0; }
" HAVE___ATTRIBUTE__VISIBILITY_HIDDEN)

check_c_source_compiles ("
int main(void) { if (__builtin_expect(0, 0)) return 1; return 0; }
" HAVE___BUILTIN_EXPECT)

check_c_source_compiles ("
int main(void)
{
  int a; if (__sync_val_compare_and_swap(&a, 0, 1)) return 1; return 0;
}
" HAVE___SYNC_VAL_COMPARE_AND_SWAP)

check_c_source_compiles ("
#define _XOPEN_SOURCE 500
#include <pthread.h>
int main(void)
{
  pthread_rwlock_t l;
  pthread_rwlock_init(&l, NULL);
  pthread_rwlock_rdlock(&l);
  return 0;
}
" HAVE_RWLOCK)

check_c_source_compiles ("
__declspec(selectany) int a;
int main(void) { return 0; }
" HAVE___DECLSPEC)

check_cxx_source_compiles ("
#include <vector>
vector<int> t; int main() { }
" STL_NO_NAMESPACE)

check_cxx_source_compiles ("
#include <vector>
std::vector<int> t; int main() { }
" STL_STD_NAMESPACE)

check_cxx_source_compiles ("
#include <iostream>
std::ostream& operator<<(std::ostream&, struct s);
using ::operator<<;
int main() { }
" HAVE_USING_OPERATOR)

check_cxx_source_compiles ("
namespace Outer { namespace Inner { int i = 0; }}
using namespace Outer::Inner;;
int main() { return i; }
" HAVE_NAMESPACES)

set (_PC_FIELDS
  "gregs[REG_PC]"
  "gregs[REG_EIP]"
  "gregs[REG_RIP]"
  "sc_ip"
  "uc_regs->gregs[PT_NIP]"
  "gregs[R15]"
  "arm_pc"
  "mc_eip"
  "mc_rip"
  "__gregs[REG_EIP]"
  "__gregs[REG_RIP]"
  "ss.eip"
  "__ss.__eip"
  "ss.rip"
  "__ss.__rip"
  "ss.srr0"
  "__ss.__srr0"
)

set (_PC_HEADERS ucontext.h signal.h)

if (HAVE_UCONTEXT_H AND NOT PC_FROM_UCONTEXT)
  foreach (_PC_FIELD ${_PC_FIELDS})
    foreach (_PC_HEADER ${_PC_HEADERS})
      set (_TMP
      ${CMAKE_CURRENT_BINARY_DIR}${CMAKE_FILES_DIRECTORY}/CMakeTmp/uctfield.c)
      file (WRITE ${_TMP} "
#define _GNU_SOURCE 1
#include <${_PC_HEADER}>
int main(void)
{
  ucontext_t u;
  return u.${_PC_FIELD} == 0;
}
")
      try_compile (HAVE_PC_FROM_UCONTEXT ${CMAKE_CURRENT_BINARY_DIR} ${_TMP}
        COMPILE_DEFINITIONS _GNU_SOURCE=1)

      if (HAVE_PC_FROM_UCONTEXT)
        set (PC_FROM_UCONTEXT ${_PC_FIELD} CACHE)
      endif (HAVE_PC_FROM_UCONTEXT)
    endforeach (_PC_HEADER)
  endforeach (_PC_FIELD)
endif  (HAVE_UCONTEXT_H AND NOT PC_FROM_UCONTEXT)

if (STL_STD_NAMESPACE)
  set (STL_NAMESPACE std)
else (STL_STD_NAMESPACE)
  set (STL_NAMESPACE "")
endif (STL_STD_NAMESPACE)

set (GOOGLE_NAMESPACE google)
set (_START_GOOGLE_NAMESPACE_ "namespace ${GOOGLE_NAMESPACE} {")
set (_END_GOOGLE_NAMESPACE_ "}")

if (HAVE___UINT16)
  set (ac_cv_have___uint16 1)
else (HAVE___UINT16)
  set (ac_cv_have___uint16 0)
endif (HAVE___UINT16)

if (HAVE_INTTYPES_H)
  set (ac_cv_have_inttypes_h 1)
else (HAVE_INTTYPES_H)
  set (ac_cv_have_inttypes_h 0)
endif (HAVE_INTTYPES_H)

if (HAVE_LIB_GFLAGS)
  set (ac_cv_have_libgflags 1)
else (HAVE_LIB_GFLAGS)
  set (ac_cv_have_libgflags 0)
endif (HAVE_LIB_GFLAGS)

if (HAVE_STDINT_H)
  set (ac_cv_have_stdint_h 1)
else (HAVE_STDINT_H)
  set (ac_cv_have_stdint_h 0)
endif (HAVE_STDINT_H)

if (HAVE_SYS_TYPES_H)
  set (ac_cv_have_systypes_h 1)
else (HAVE_SYS_TYPES_H)
  set (ac_cv_have_systypes_h 0)
endif (HAVE_SYS_TYPES_H)

if (HAVE_U_INT16_T)
  set (ac_cv_have_u_int16_t 1)
else (HAVE_U_INT16_T)
  set (ac_cv_have_u_int16_t 0)
endif (HAVE_U_INT16_T)

if (HAVE_UINT16_T)
  set (ac_cv_have_uint16_t 1)
else (HAVE_UINT16_T)
  set (ac_cv_have_uint16_t 0)
endif (HAVE_UINT16_T)

if (HAVE_UNISTD_H)
  set (ac_cv_have_unistd_h 1)
else (HAVE_UNISTD_H)
  set (ac_cv_have_unistd_h 0)
endif (HAVE_UNISTD_H)

set (ac_google_namespace ${GOOGLE_NAMESPACE})
set (ac_google_end_namespace ${_END_GOOGLE_NAMESPACE_})
set (ac_google_start_namespace ${_START_GOOGLE_NAMESPACE_})

if (HAVE___ATTRIBUTE__)
  set (ac_cv___attribute___noreturn "__attribute__((noreturn))")
  set (ac_cv___attribute___noinline "__attribute__((noinline))")
elseif (HAVE___DECLSPEC)
  set (ac_cv___attribute___noreturn "__declspec(noreturn)")
  #set (ac_cv___attribute___noinline "__declspec(noinline)")
endif (HAVE___ATTRIBUTE__)

if (HAVE___BUILTIN_EXPECT)
  set (ac_cv_have___builtin_expect 1)
else (HAVE___BUILTIN_EXPECT)
  set (ac_cv_have___builtin_expect 0)
endif (HAVE___BUILTIN_EXPECT)

if (HAVE_USING_OPERATOR)
  set (ac_cv_cxx_using_operator 1)
else (HAVE_USING_OPERATOR)
  set (ac_cv_cxx_using_operator 0)
endif (HAVE_USING_OPERATOR)

set (SIZEOF_VOID_P ${CMAKE_SIZEOF_VOID_P})

if (WITH_THREADS AND Threads_FOUND)
  if (CMAKE_USE_PTHREADS_INIT)
    set (HAVE_PTHREAD 1)
  endif (CMAKE_USE_PTHREADS_INIT)
else (WITH_THREADS AND Threads_FOUND)
  set (NO_THREADS 1)
endif (WITH_THREADS AND Threads_FOUND)

set (TEST_SRC_DIR \"${CMAKE_CURRENT_SOURCE_DIR}\")

configure_file (src/config.h.cmake.in config.h)
configure_file (src/glog/logging.h.in glog/logging.h @ONLY)
configure_file (src/glog/raw_logging.h.in glog/raw_logging.h @ONLY)
configure_file (src/glog/stl_logging.h.in glog/stl_logging.h @ONLY)
configure_file (src/glog/vlog_is_on.h.in glog/vlog_is_on.h @ONLY)

set (CMAKE_CXX_VISIBILITY_PRESET default)
set (CMAKE_VISIBILITY_INLINES_HIDDEN 1)

set (GLOG_PUBLIC_H
  ${CMAKE_CURRENT_BINARY_DIR}/config.h
  ${CMAKE_CURRENT_BINARY_DIR}/glog/logging.h
  ${CMAKE_CURRENT_BINARY_DIR}/glog/raw_logging.h
  ${CMAKE_CURRENT_BINARY_DIR}/glog/stl_logging.h
  ${CMAKE_CURRENT_BINARY_DIR}/glog/vlog_is_on.h
  src/glog/log_severity.h
)

set (GLOG_SRCS
  ${GLOG_PUBLIC_H}
  src/base/commandlineflags.h
  src/base/googleinit.h
  src/base/mutex.h
  src/demangle.cc
  src/demangle.h
  src/logging.cc
  src/raw_logging.cc
  src/symbolize.cc
  src/symbolize.h
  src/utilities.cc
  src/utilities.h
  src/vlog_is_on.cc
)

if (HAVE_PTHREAD)
  list (APPEND GLOG_SRCS src/signalhandler.cc)
endif (HAVE_PTHREAD)

if (WIN32)
  list (APPEND GLOG_SRCS
    src/windows/port.cc
    src/windows/port.h
  )
endif (WIN32)

add_compile_options ($<$<BOOL:${HAVE_NO_UNNAMED_TYPE_TEMPLATE_ARGS}>:-Wno-unnamed-type-template-args>)

add_library (glog
  ${GLOG_SRCS}
)

set_target_properties (glog PROPERTIES POSITION_INDEPENDENT_CODE ON)

if (UNWIND_LIBRARY)
  target_link_libraries (glog PUBLIC ${UNWIND_LIBRARY})
endif (UNWIND_LIBRARY)

if (HAVE_PTHREAD)
  target_link_libraries (glog PUBLIC ${CMAKE_THREAD_LIBS_INIT})
endif (HAVE_PTHREAD)

if (WIN32 AND HAVE_SNPRINTF)
  set_property (SOURCE src/windows/port.cc APPEND PROPERTY COMPILE_DEFINITIONS
    HAVE_SNPRINTF)
endif (WIN32 AND HAVE_SNPRINTF)

if (gflags_FOUND)
  target_include_directories (glog PUBLIC $<BUILD_INTERFACE:${gflags_INCLUDE_DIR}>)
  target_link_libraries (glog PUBLIC ${gflags_LIBRARIES})

  if (NOT BUILD_SHARED_LIBS)
    # Don't use __declspec(dllexport|dllimport) if this is a static build
    targeT_compile_definitions (glog PUBLIC GFLAGS_DLL_DECLARE_FLAG= GFLAGS_DLL_DEFINE_FLAG=)
  endif (NOT BUILD_SHARED_LIBS)
endif (gflags_FOUND)

set_target_properties (glog PROPERTIES VERSION ${GLOG_MAJOR_VERSION})
set_target_properties (glog PROPERTIES SOVERSION ${GLOG_VERSION})

if (WIN32)
  target_compile_definitions (glog PUBLIC GLOG_NO_ABBREVIATED_SEVERITIES)
endif (WIN32)

set_target_properties (glog PROPERTIES PUBLIC_HEADER "${GLOG_PUBLIC_H}")

target_include_directories (glog BEFORE PUBLIC
  "$<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>"
  "$<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src>"
  "$<INSTALL_INTERFACE:include>"
  PRIVATE ${CMAKE_CURRENT_BINARY_DIR}
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

if (WIN32)
  target_include_directories (glog PUBLIC
    "$<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src/windows>"
    PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src/windows)
endif (WIN32)

set_target_properties (glog PROPERTIES DEFINE_SYMBOL LIBGLOG_EXPORTS)

if (NOT BUILD_SHARED_LIBS)
  target_compile_definitions (glog PUBLIC GOOGLE_GLOG_DLL_DECL=)
else (NOT BUILD_SHARED_LIBS)
  target_compile_definitions (glog PRIVATE GOOGLE_GLOG_IS_A_DLL=1)

  if (HAVE___ATTRIBUTE__VISIBILITY_DEFAULT)
    set (_EXPORT "__attribute__((visibility(\"default\")))")
    set (_IMPORT "")
  elseif (HAVE___DECLSPEC)
    set (_EXPORT "__declspec(dllexport)")
    set (_IMPORT "__declspec(dllimport)")
  endif (HAVE___ATTRIBUTE__VISIBILITY_DEFAULT)

  target_compile_definitions (glog PRIVATE
    "GOOGLE_GLOG_DLL_DECL=${_EXPORT}")
  target_compile_definitions (glog INTERFACE
    "GOOGLE_GLOG_DLL_DECL=${_IMPORT}")
  target_compile_definitions (glog INTERFACE
    "GOOGLE_GLOG_DLL_DECL_FOR_UNITTESTS=${_IMPORT}")
endif (NOT BUILD_SHARED_LIBS)

if (HAVE_EXECINFO_H)
  set (HAVE_STACKTRACE 1)
endif (HAVE_EXECINFO_H)

if (UNIX OR (APPLE AND HAVE_DLADDR))
  set (HAVE_SYMBOLIZE 1)
endif (UNIX OR (APPLE AND HAVE_DLADDR))

# Unit testing

if (BUILD_TESTING)
  add_executable (logging_unittest
    src/logging_unittest.cc
  )

  target_link_libraries (logging_unittest PRIVATE glog)

  add_executable (stl_logging_unittest
    src/stl_logging_unittest.cc
  )

  target_link_libraries (stl_logging_unittest PRIVATE glog)

  if (HAVE_NO_DEPRECATED)
    set_property (TARGET stl_logging_unittest APPEND PROPERTY COMPILE_OPTIONS
      -Wno-deprecated)
  endif (HAVE_NO_DEPRECATED)

  if (HAVE_UNORDERED_MAP AND HAVE_UNORDERED_SET)
    target_compile_definitions (stl_logging_unittest PRIVATE
      GLOG_STL_LOGGING_FOR_UNORDERED)
  endif (HAVE_UNORDERED_MAP AND HAVE_UNORDERED_SET)

  if (HAVE_TR1_UNORDERED_MAP AND HAVE_TR1_UNORDERED_SET)
    target_compile_definitions (stl_logging_unittest PRIVATE
      GLOG_STL_LOGGING_FOR_TR1_UNORDERED)
  endif (HAVE_TR1_UNORDERED_MAP AND HAVE_TR1_UNORDERED_SET)

  if (HAVE_EXT_HASH_MAP AND HAVE_EXT_HASH_SET)
    target_compile_definitions (stl_logging_unittest PRIVATE
      GLOG_STL_LOGGING_FOR_EXT_HASH)
  endif (HAVE_EXT_HASH_MAP AND HAVE_EXT_HASH_SET)

  if (HAVE_EXT_SLIST)
    target_compile_definitions (stl_logging_unittest PRIVATE
      GLOG_STL_LOGGING_FOR_EXT_SLIST)
  endif (HAVE_EXT_SLIST)

  if (HAVE_SYMBOLIZE)
    add_executable (symbolize_unittest
      src/symbolize_unittest.cc
    )

    target_link_libraries (symbolize_unittest PRIVATE glog)
  endif (HAVE_SYMBOLIZE)

  add_executable (demangle_unittest
    src/demangle_unittest.cc
  )

  target_link_libraries (demangle_unittest PRIVATE glog)

  if (HAVE_STACKTRACE)
    add_executable (stacktrace_unittest
      src/stacktrace_unittest.cc
    )

    target_link_libraries (stacktrace_unittest PRIVATE glog)
  endif (HAVE_STACKTRACE)

  add_executable (utilities_unittest
    src/utilities_unittest.cc
  )

  target_link_libraries (utilities_unittest PRIVATE glog)

  if (HAVE_STACKTRACE AND HAVE_SYMBOLIZE)
    add_executable (signalhandler_unittest
      src/signalhandler_unittest.cc
    )

    target_link_libraries (signalhandler_unittest PRIVATE glog)
  endif (HAVE_STACKTRACE AND HAVE_SYMBOLIZE)

  add_test (NAME demangle COMMAND demangle_unittest)
  add_test (NAME logging COMMAND logging_unittest)

  if (TARGET signalhandler_unittest)
    add_test (NAME signalhandler COMMAND signalhandler_unittest)
  endif (TARGET signalhandler_unittest)

  if (TARGET stacktrace_unittest)
    add_test (NAME stacktrace COMMAND stacktrace_unittest)
  endif (TARGET stacktrace_unittest)

  add_test (NAME stl_logging COMMAND stl_logging_unittest)

  if (TARGET symbolize_unittest)
    add_test (NAME symbolize COMMAND symbolize_unittest)
  endif (TARGET symbolize_unittest)
endif (BUILD_TESTING)

install (TARGETS glog
  EXPORT glog-targets
  RUNTIME DESTINATION bin
  PUBLIC_HEADER DESTINATION include/glog
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib)

if (gflags_FOUND)
  set (gflags_DEPENDENCY "find_dependency (gflags ${gflags_VERSION})")
endif (gflags_FOUND)

configure_package_config_file (glog-config.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/glog-config.cmake
  INSTALL_DESTINATION lib/cmake/glog
  NO_CHECK_REQUIRED_COMPONENTS_MACRO)

write_basic_package_version_file (glog-config-version.cmake VERSION
  ${GLOG_VERSION} COMPATIBILITY SameMajorVersion)

export (TARGETS glog NAMESPACE glog:: FILE glog-targets.cmake)
export (PACKAGE glog)

install (FILES
  ${CMAKE_CURRENT_BINARY_DIR}/glog-config.cmake
  ${CMAKE_CURRENT_BINARY_DIR}/glog-config-version.cmake
  DESTINATION lib/cmake/glog)

install (EXPORT glog-targets NAMESPACE glog:: DESTINATION lib/cmake/glog)
