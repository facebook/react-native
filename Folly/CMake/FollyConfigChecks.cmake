include(CheckCXXSourceCompiles)
include(CheckCXXSourceRuns)
include(CheckFunctionExists)
include(CheckIncludeFileCXX)
include(CheckSymbolExists)
include(CheckTypeSize)
include(CheckCXXCompilerFlag)

CHECK_INCLUDE_FILE_CXX(jemalloc/jemalloc.h FOLLY_USE_JEMALLOC)

if(NOT CMAKE_SYSTEM_NAME STREQUAL "Windows")
  # clang only rejects unknown warning flags if -Werror=unknown-warning-option
  # is also specified.
  CHECK_CXX_COMPILER_FLAG(
    -Werror=unknown-warning-option
    COMPILER_HAS_UNKNOWN_WARNING_OPTION)
  if (COMPILER_HAS_UNKNOWN_WARNING_OPTION)
    set(CMAKE_REQUIRED_FLAGS
      "${CMAKE_REQUIRED_FLAGS} -Werror=unknown-warning-option")
  endif()

  CHECK_CXX_COMPILER_FLAG(-Wshadow-local COMPILER_HAS_W_SHADOW_LOCAL)
  CHECK_CXX_COMPILER_FLAG(
    -Wshadow-compatible-local
    COMPILER_HAS_W_SHADOW_COMPATIBLE_LOCAL)
  if (COMPILER_HAS_W_SHADOW_LOCAL AND COMPILER_HAS_W_SHADOW_COMPATIBLE_LOCAL)
    set(FOLLY_HAVE_SHADOW_LOCAL_WARNINGS ON)
    list(APPEND FOLLY_CXX_FLAGS -Wshadow-compatible-local)
  endif()

  CHECK_CXX_COMPILER_FLAG(-Wnoexcept-type COMPILER_HAS_W_NOEXCEPT_TYPE)
  if (COMPILER_HAS_W_NOEXCEPT_TYPE)
    list(APPEND FOLLY_CXX_FLAGS -Wno-noexcept-type)
  endif()

  CHECK_CXX_COMPILER_FLAG(
      -Wnullability-completeness
      COMPILER_HAS_W_NULLABILITY_COMPLETENESS)
  if (COMPILER_HAS_W_NULLABILITY_COMPLETENESS)
    list(APPEND FOLLY_CXX_FLAGS -Wno-nullability-completeness)
  endif()

  CHECK_CXX_COMPILER_FLAG(
      -Winconsistent-missing-override
      COMPILER_HAS_W_INCONSISTENT_MISSING_OVERRIDE)
  if (COMPILER_HAS_W_INCONSISTENT_MISSING_OVERRIDE)
    list(APPEND FOLLY_CXX_FLAGS -Wno-inconsistent-missing-override)
  endif()

  CHECK_CXX_COMPILER_FLAG(-faligned-new COMPILER_HAS_F_ALIGNED_NEW)
  if (COMPILER_HAS_F_ALIGNED_NEW)
    list(APPEND FOLLY_CXX_FLAGS -faligned-new)
  endif()

  CHECK_CXX_COMPILER_FLAG(-fopenmp COMPILER_HAS_F_OPENMP)
  if (COMPILER_HAS_F_OPENMP)
      list(APPEND FOLLY_CXX_FLAGS -fopenmp)
  endif()
endif()

set(FOLLY_ORIGINAL_CMAKE_REQUIRED_FLAGS "${CMAKE_REQUIRED_FLAGS}")
string(REGEX REPLACE
  "-std=(c|gnu)\\+\\+.."
  ""
  CMAKE_REQUIRED_FLAGS
  "${CMAKE_REQUIRED_FLAGS}")

check_symbol_exists(pthread_atfork pthread.h FOLLY_HAVE_PTHREAD_ATFORK)

# Unfortunately check_symbol_exists() does not work for memrchr():
# it fails complaining that there are multiple overloaded versions of memrchr()
check_function_exists(memrchr FOLLY_HAVE_MEMRCHR)
check_symbol_exists(preadv sys/uio.h FOLLY_HAVE_PREADV)
check_symbol_exists(pwritev sys/uio.h FOLLY_HAVE_PWRITEV)
check_symbol_exists(clock_gettime time.h FOLLY_HAVE_CLOCK_GETTIME)

check_function_exists(malloc_usable_size FOLLY_HAVE_MALLOC_USABLE_SIZE)

set(CMAKE_REQUIRED_FLAGS "${FOLLY_ORIGINAL_CMAKE_REQUIRED_FLAGS}")

check_cxx_source_compiles("
  #pragma GCC diagnostic error \"-Wattributes\"
  extern \"C\" void (*test_ifunc(void))() { return 0; }
  void func() __attribute__((ifunc(\"test_ifunc\")));
  int main() { return 0; }"
  FOLLY_HAVE_IFUNC
)
check_cxx_source_compiles("
  #include <type_traits>
  const bool val = std::is_trivially_copyable<bool>::value;
  int main() { return 0; }"
  FOLLY_HAVE_STD__IS_TRIVIALLY_COPYABLE
)
check_cxx_source_runs("
  int main(int, char**) {
    char buf[64] = {0};
    unsigned long *ptr = (unsigned long *)(buf + 1);
    *ptr = 0xdeadbeef;
    return (*ptr & 0xff) == 0xef ? 0 : 1;
  }"
  FOLLY_HAVE_UNALIGNED_ACCESS
)
check_cxx_source_compiles("
  int main(int argc, char** argv) {
    unsigned size = argc;
    char data[size];
    return 0;
  }"
  FOLLY_HAVE_VLA
)
check_cxx_source_compiles("
  extern \"C\" void configure_link_extern_weak_test() __attribute__((weak));
  int main(int argc, char** argv) {
    return configure_link_extern_weak_test == nullptr;
  }"
  FOLLY_HAVE_WEAK_SYMBOLS
)
check_cxx_source_runs("
  #include <dlfcn.h>
  int main() {
    void *h = dlopen(\"linux-vdso.so.1\", RTLD_LAZY | RTLD_LOCAL | RTLD_NOLOAD);
    if (h == nullptr) {
      return -1;
    }
    dlclose(h);
    return 0;
  }"
  FOLLY_HAVE_LINUX_VDSO
)

check_type_size(__int128 INT128_SIZE LANGUAGE CXX)
if (NOT INT128_SIZE STREQUAL "")
  set(FOLLY_HAVE_INT128_T ON)
  check_cxx_source_compiles("
    #include <functional>
    #include <type_traits>
    #include <utility>
    static_assert(
      ::std::is_same<::std::make_signed<unsigned __int128>::type,
                     __int128>::value,
      \"signed form of 'unsigned __uint128' must be '__int128'.\");
    static_assert(
        sizeof(::std::hash<__int128>{}(0)) > 0, \
        \"std::hash<__int128> is disabled.\");
    int main() { return 0; }"
    HAVE_INT128_TRAITS
  )
  if (HAVE_INT128_TRAITS)
    set(FOLLY_SUPPLY_MISSING_INT128_TRAITS OFF)
  else()
    set(FOLLY_SUPPLY_MISSING_INT128_TRAITS ON)
  endif()
endif()

check_cxx_source_runs("
  #include <cstddef>
  #include <cwchar>
  int main(int argc, char** argv) {
    return wcstol(L\"01\", nullptr, 10) == 1 ? 0 : 1;
  }"
  FOLLY_HAVE_WCHAR_SUPPORT
)

check_cxx_source_compiles("
  #include <ext/random>
  int main(int argc, char** argv) {
    __gnu_cxx::sfmt19937 rng;
    return 0;
  }"
  FOLLY_HAVE_EXTRANDOM_SFMT19937
)

check_cxx_source_compiles("
  #include <type_traits>
  #if !_LIBCPP_VERSION
  #error No libc++
  #endif
  int main() { return 0; }"
  FOLLY_USE_LIBCPP
)

check_cxx_source_compiles("
  #include <type_traits>
  #if !__GLIBCXX__
  #error No libstdc++
  #endif
  int main() { return 0; }"
  FOLLY_USE_LIBSTDCPP
)

check_cxx_source_runs("
  #include <string.h>
  #include <errno.h>
  int main(int argc, char** argv) {
    char buf[1024];
    buf[0] = 0;
    int ret = strerror_r(ENOMEM, buf, sizeof(buf));
    return ret;
  }"
  FOLLY_HAVE_XSI_STRERROR_R
)

check_cxx_source_runs("
  #include <stdarg.h>
  #include <stdio.h>

  int call_vsnprintf(const char* fmt, ...) {
    char buf[256];
    va_list ap;
    va_start(ap, fmt);
    int result = vsnprintf(buf, sizeof(buf), fmt, ap);
    va_end(ap);
    return result;
  }

  int main(int argc, char** argv) {
    return call_vsnprintf(\"%\", 1) < 0 ? 0 : 1;
  }"
  HAVE_VSNPRINTF_ERRORS
)

if (FOLLY_HAVE_LIBGFLAGS)
  # Older releases of gflags used the namespace "gflags"; newer releases
  # use "google" but also make symbols available in the deprecated "gflags"
  # namespace too.  The folly code internally uses "gflags" unless we tell it
  # otherwise.
  check_cxx_source_compiles("
    #include <gflags/gflags.h>
    int main() {
      gflags::GetArgv();
      return 0;
    }
    "
    GFLAGS_NAMESPACE_IS_GFLAGS
  )
  if (GFLAGS_NAMESPACE_IS_GFLAGS)
    set(FOLLY_UNUSUAL_GFLAGS_NAMESPACE OFF)
    set(FOLLY_GFLAGS_NAMESPACE gflags)
  else()
    set(FOLLY_UNUSUAL_GFLAGS_NAMESPACE ON)
    set(FOLLY_GFLAGS_NAMESPACE google)
  endif()
endif()
