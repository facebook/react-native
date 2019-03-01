
#                                               -*- Autoconf -*-
# Process this file with autoconf to produce a configure script.

AC_PREREQ(2.59)

m4_define([folly_version_str], m4_esyscmd_s([cat VERSION]))

AC_INIT([folly], m4_translit(folly_version_str, [:], [.]), [folly@fb.com])

# We assume all revisions are backwards incompatible.
LT_VERSION=folly_version_str:0
AC_SUBST([LT_VERSION])

#declare pkg-config variables
PKG_VERSION=m4_join([.], m4_reverse(m4_translit(folly_version_str, [:], [,])))
AC_SUBST([PKG_VERSION])
AC_SUBST([PKG_CXXFLAGS])
AC_SUBST([PKG_DEPS])
AC_SUBST([PKG_LIBS])

AC_CONFIG_SRCDIR([Likely.h])
AC_CONFIG_HEADERS([config.h])
AX_PREFIX_CONFIG_H([folly-config.h], [folly], [config.h])
AC_CONFIG_AUX_DIR([build-aux])

AM_INIT_AUTOMAKE([foreign dist-bzip2 nostdinc subdir-objects])

AC_CONFIG_MACRO_DIR([m4])

AX_CONFIG_FEATURE_DEFAULT_DISABLED
AX_CONFIG_FEATURE(
        [deprecated-assoc],
        [supports deprecated associative containers (hash_map/hash_set)],
        [HAVE_DEPRECATED_ASSOC],
        [Define if you want to support deprecated associative containers])

AC_PROG_INSTALL
AM_PROG_LIBTOOL

AC_LANG([C++])

# Checks for programs.
AC_PROG_CXX
AC_PROG_CC

AC_CXX_COMPILE_STDCXX_1Y

# Be sure to add any -std option to CXXFLAGS before we invoke any
# AC_COMPILE_IFELSE() or similar macros. Any such macros that are invoked
# before we update CXXFLAGS will not be run with the same options that we use
# during the real build.
STD=""
if test "x$ac_cv_cxx_compile_cxx1y_cxx" = xyes; then
   STD="-std=c++1y"
fi
if test "x$ac_cv_cxx_compile_cxx1y_gxx" = xyes; then
   STD="-std=gnu++1y"
fi

CXXFLAGS="$STD $CXXFLAGS"

# expose required -std option via pkg-config
PKG_CXXFLAGS=$STD

# See if -Wshadow-local and -Wshadow-compatible-local are supported
AC_MSG_CHECKING(
  [whether -Wshadow-local and -Wshadow-compatible-local are supported])
AC_CACHE_VAL([folly_cv_cxx_shadow_local_support], [
  folly_save_CXXFLAGS="$CXXFLAGS"
  CXXFLAGS="$CXXFLAGS -Wshadow-local -Wshadow-compatible-local"
  AC_COMPILE_IFELSE(
    [AC_LANG_PROGRAM([[]], [[]])],
    [folly_cv_cxx_shadow_local_support=yes],
    [folly_cv_cxx_shadow_local_support=no])
  CXXFLAGS="$folly_save_CXXFLAGS"])
AC_MSG_RESULT([$folly_cv_cxx_shadow_local_support])
if test "$folly_cv_cxx_shadow_local_support" = yes; then
  AC_DEFINE([HAVE_SHADOW_LOCAL_WARNINGS], [1],
  [Define if both -Wshadow-local and -Wshadow-compatible-local are supported.])
fi

# Checks for glog and gflags
# There are no symbols with C linkage, so we do a try-run
AC_HAVE_LIBRARY([gflags],[],[AC_MSG_ERROR(
                [Please install google-gflags library])])
AC_CACHE_CHECK(
  [for gflags viability],
  [folly_cv_prog_cc_gflags],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      #include <gflags/gflags.h>
      DEFINE_bool(folly_truthy, true, "Sample truthy flag");
      DEFINE_bool(folly_falsey, false, "Sample falsey flag");
      int main(int argc, char** argv) {
        return (FLAGS_folly_truthy && !FLAGS_folly_falsey) ? 0 : 1;
      }
    ]],
    [folly_cv_prog_cc_gflags=yes],
    [folly_cv_prog_cc_gflags=no]
  )]
)

if test "$folly_cv_prog_cc_gflags" != "yes"; then
  AC_MSG_ERROR(["gflags invalid, see config.log for details"])
fi
FB_CHECK_PKG_CONFIG([GFLAGS], [gflags])

AC_HAVE_LIBRARY([glog],[],[AC_MSG_ERROR(
                [Please install google-glog library])])
AC_CACHE_CHECK(
  [for glog viability],
  [folly_cv_prog_cc_glog],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      #include <glog/logging.h>
      int main(int argc, char** argv) {
        google::InitGoogleLogging(argv[0]);
        google::ShutdownGoogleLogging();
        return 0;
      }
    ]],
    [folly_cv_prog_cc_glog=yes],
    [folly_cv_prog_cc_glog=no]
  )]
)

if test "$folly_cv_prog_cc_glog" != "yes"; then
  AC_MSG_ERROR(["libglog invalid, see config.log for details"])
fi
FB_CHECK_PKG_CONFIG([GLOG], [libglog])

AS_IF(
  [test "x$OPENSSL_INCLUDES" = "x"],
  [
    AX_CHECK_OPENSSL([], [AC_MSG_ERROR(["Error: libssl required"])])
  ],
  [
    # AX_CHECK_OPENSSL doesn't seem to play nice with builds started
    # via build/bootstrap-osx-homebrew.sh
    AC_MSG_WARN(["Using existing OpenSSL flags from environment."])
    PKG_CXXFLAGS="$PKG_CXXFLAGS $OPENSSL_INCLUDES"
  ]
)
FB_CHECK_PKG_CONFIG([OPENSSL], [openssl])

# check for boost libs
AX_BOOST_BASE([1.51.0], [], [AC_MSG_ERROR(
              [Please install boost >= 1.51.0 (context, thread, program_options, regex, system and chrono)])])
AX_BOOST_CONTEXT
AX_BOOST_PROGRAM_OPTIONS
AX_BOOST_THREAD
AX_BOOST_REGEX
AX_BOOST_SYSTEM
AX_BOOST_FILESYSTEM
AX_BOOST_CHRONO

# Check for python interpreter
AM_PATH_PYTHON

# Checks for header files.
AC_HEADER_STDC
AC_CHECK_HEADERS([features.h malloc.h bits/functexcept.h bits/c++config.h])

AC_CHECK_HEADER(double-conversion/double-conversion.h, [], [AC_MSG_ERROR(
                [Couldn't find double-conversion.h, please download from \
                 https://github.com/google/double-conversion/])], [])
AC_CHECK_LIB([double-conversion],[ceil],[],[AC_MSG_ERROR(
             [Please install double-conversion library])])

AC_CHECK_LIB([event], [event_set], [], [AC_MSG_ERROR([Unable to find libevent])])
FB_CHECK_PKG_CONFIG([EVENT], [libevent])

AC_ARG_WITH([jemalloc], [
  --with-jemalloc     Whether to make folly jemalloc aware
],[
  AC_CHECK_LIB([jemalloc], [xallocx],[
    AC_DEFINE([USE_JEMALLOC], [1], [Enable jemalloc])
  ],[
    AC_MSG_ERROR([--with-jemalloc requested, but jemalloc not found])
  ])
])

# Checks for typedefs, structures, and compiler characteristics.
AC_C_CONST
AC_C_INLINE
AC_TYPE_SIZE_T
AC_HEADER_TIME
AC_C_VOLATILE
AC_CHECK_TYPE([__int128], [folly_cv_prog_cc_int128=yes],
    [folly_cv_prog_cc_int128=no])
if test "$folly_cv_prog_cc_int128" = "yes"; then
  AC_DEFINE([HAVE_INT128_T], [1], [Define if we have __int128])
  AC_CACHE_CHECK(
    [for __int128 type traits],
    [folly_cv_prog_cc_int128traits],
    [AC_COMPILE_IFELSE(
      [AC_LANG_SOURCE([[
#include <type_traits>
static_assert(
  ::std::is_same<::std::make_signed<unsigned __int128>::type, __int128>::value,
  "signed form of \`unsigned __uint128\` must be \`__int128\`.");
      ]])],
      [folly_cv_prog_cc_int128traits=yes],
      [folly_cv_prog_cc_int128traits=no])
    ])
  if test "$folly_cv_prog_cc_int128traits" = "no"; then
    AC_DEFINE([SUPPLY_MISSING_INT128_TRAITS], [1], [Define if we need the standard integer traits defined for the type `__int128'.])
  fi
fi

AC_CHECK_TYPES([pthread_spinlock_t])

AC_CACHE_CHECK(
  [for ifunc support],
  [folly_cv_prog_cc_ifunc],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #pragma GCC diagnostic error "-Wattributes"
      extern "C" void (*test_ifunc(void))() { return 0; }
      void func() __attribute__((ifunc("test_ifunc")));]
    ],
    [folly_cv_prog_cc_ifunc=yes],
    [folly_cv_prog_cc_ifunc=no])])

if test "$folly_cv_prog_cc_ifunc" = "yes"; then
  AC_DEFINE([HAVE_IFUNC], [1], [Define to 1 if the compiler supports ifunc])
fi

AC_CACHE_CHECK(
  [for final and override support],
  [folly_cv_c_final_override],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[class C { virtual void f() final {} virtual void g() {} };
                    class D : public C { virtual void g() override {} };]],
    [folly_cv_c_final_override=yes],
    [folly_cv_c_final_override=no])])

if test "$folly_cv_c_final_override" = "yes"; then
  final_val=final
  override_val=override
else
  final_val=
  override_val=
fi

AC_DEFINE_UNQUOTED(
  [FINAL], [$final_val],
  [Define to "final" if the compiler supports C++11 "final"])
AC_DEFINE_UNQUOTED(
  [OVERRIDE], [$override_val],
  [Define to "override" if the compiler supports C++11 "override"])

AC_CACHE_CHECK(
  [for constexpr strlen],
  [folly_cv_func_constexpr_strlen],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <cstring>
      static constexpr int val = strlen("foo");]],
    [folly_cv_func_constexpr_strlen=yes],
    [folly_cv_func_constexpr_strlen=no])])

if test "$folly_cv_func_constexpr_strlen" = yes; then
    AC_DEFINE([HAVE_CONSTEXPR_STRLEN], [1],
              [Define to 1 if strlen(3) is constexpr.])
fi

AC_CACHE_CHECK(
  [for libc++],
  [folly_cv_lib_libcpp],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <type_traits>
      #if !_LIBCPP_VERSION
      #error No libc++
      #endif
      void func() {}]
    ],
    [folly_cv_lib_libcpp=yes],
    [folly_cv_lib_libcpp=no])])

if test "$folly_cv_lib_libcpp" = yes; then
  AC_DEFINE([USE_LIBCPP], [1], [Define to 1 if we are using libc++.])
fi

AC_CACHE_CHECK(
  [for c++11 atomic support without GNU Atomic library],
  [folly_cv_lib_libatomic],
  [AC_LINK_IFELSE(
    [AC_LANG_SOURCE[
      #include <atomic>
      int main() {
        struct Test { int val; };
        std::atomic<Test> s;
        s.is_lock_free();
      }
    ]],
    [folly_cv_lib_libatomic=yes],
    [folly_cv_lib_libatomic=no])])

if test "$folly_cv_lib_libatomic" = no; then
  AC_HAVE_LIBRARY([atomic],[],[AC_MSG_ERROR(
                  [Please install the GNU Atomic library])])
fi

AC_CACHE_CHECK(
  [for liblinux-vdso support],
  [folly_cv_lib_liblinux_vdso],
  [AC_RUN_IFELSE(
    [AC_LANG_PROGRAM[
      #include <dlfcn.h>
      int main() {
        void *h = dlopen("linux-vdso.so.1", RTLD_LAZY | RTLD_LOCAL | RTLD_NOLOAD);
        if (h == nullptr) {
          return -1;
        }
        dlclose(h);
        return 0;
      }
    ]],
    [folly_cv_lib_liblinux_vdso=yes],
    [folly_cv_lib_liblinux_vdso=no])])

if test "$folly_cv_lib_liblinux_vdso" = yes; then
  AC_DEFINE([HAVE_LINUX_VDSO], [1], [Define to 1 if liblinux-vdso is available])
fi

AC_CACHE_CHECK(
  [for usable std::is_trivially_copyable],
  [folly_cv_decl_std_is_trivially_copyable],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <type_traits>
      const bool val = std::is_trivially_copyable<bool>::value;]
    ],
    [folly_cv_decl_std_is_trivially_copyable=yes],
    [folly_cv_decl_std_is_trivially_copyable=no])])

if test "$folly_cv_decl_std_is_trivially_copyable" = yes; then
  AC_DEFINE([HAVE_STD__IS_TRIVIALLY_COPYABLE], [1],
            [Define to 1 if we have a usable std::is_trivially_copyable<T>
             implementation.])
fi

AC_CACHE_CHECK(
  [gflags namespace],
  [folly_cv_decl_gflags_namespace],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <gflags/gflags.h>
      void foo() { gflags::GetArgv(); }]
    ],
    [folly_cv_decl_gflags_namespace=gflags],
    [AC_COMPILE_IFELSE(
      [AC_LANG_SOURCE[
        #include <gflags/gflags.h>
        void foo() { google::GetArgv(); }]
      ],
      [folly_cv_decl_gflags_namespace=google],
      [folly_cv_decl_gflags_namespace=error])])])

if test "$folly_cv_decl_gflags_namespace" = error; then
  AC_MSG_ERROR([Cannot determine gflags namespace])
else
  AC_DEFINE_UNQUOTED(
    [GFLAGS_NAMESPACE], [$folly_cv_decl_gflags_namespace],
    [Define to gflags namespace (usually "google" or "gflags")])
  if test "$folly_cv_decl_gflags_namespace" != gflags; then
     AC_DEFINE([UNUSUAL_GFLAGS_NAMESPACE], [1],
               [Define to 1 if the gflags namespace is not "gflags"])
  fi
fi

# Figure out if we support weak symbols. If not, we will link in some null
# stubs for functions that would otherwise be weak.
AC_CACHE_CHECK(
  [for weak symbol support],
  [folly_cv_prog_cc_weak_symbols],
  [AC_LINK_IFELSE(
    [AC_LANG_SOURCE[
      extern "C" void configure_link_extern_weak_test() __attribute__((weak));
      int main(int argc, char** argv) {
          return configure_link_extern_weak_test == nullptr;
      }]],
    [folly_cv_prog_cc_weak_symbols="yes"],
    [folly_cv_prog_cc_weak_symbols="no"])])

if test "$folly_cv_prog_cc_weak_symbols" = yes; then
  AC_DEFINE([HAVE_WEAK_SYMBOLS], [1],
            [Define to 1 if the linker supports weak symbols.])
fi


# Figure out if we support wchar well
AC_CACHE_CHECK(
  [for wchar support],
  [folly_cv_prog_cc_wchar_support],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      #include <cstddef>
      #include <cwchar>

      int main(int argc, char** argv) {
        return wcstol(L"01", nullptr, 10) == 1 ? 0 : 1;
      }
    ]],
    [folly_cv_prog_cc_wchar_support=yes],
    [folly_cv_prog_cc_wchar_support=no])])

if test "$folly_cv_prog_cc_wchar_support" = "yes"; then
  AC_DEFINE([HAVE_WCHAR_SUPPORT], [1], [Define to 1 if the libc supports wchar well])
fi

# Figure out whether the architecture supports unaligned accesses
AC_CACHE_CHECK(
  [for unaligned access support],
  [folly_cv_prog_cc_unaligned_access],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      int main(int argc, char** argv) {
        char buf[64] = {0};
        unsigned long *ptr = (unsigned long *)(buf + 1);
        *ptr = 0xdeadbeef;
        return (*ptr & 0xff) == 0xef ? 0 : 1;
      }
    ]],
    [folly_cv_prog_cc_unaligned_access=yes],
    [folly_cv_prog_cc_unaligned_access=no])])

if test "$folly_cv_prog_cc_unaligned_access" = "yes"; then
  AC_DEFINE([HAVE_UNALIGNED_ACCESS], [1], [Define to 1 if the architecture allows unaligned accesses])
fi

AC_CACHE_CHECK(
  [for vsnprintf reporting bad format strings],
  [folly_cv_prog_vsnprintf_bad_format],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      #include <stdio.h>

      int main(int argc, char** argv) {
          char buf[256];
          return vsnprintf(buf, sizeof(buf), "%", 1) < 0 ? 0 : 1;
      }]],
    [folly_cv_prog_vsnprintf_bad_format="yes"],
    [folly_cv_prog_vsnprintf_bad_format="no"])])

if test "$folly_cv_prog_vsnprintf_bad_format" = yes; then
  AC_DEFINE([HAVE_VSNPRINTF_ERRORS], [1],
            [Define to 1 if the vsnprintf supports returning errors on bad format strings.])
fi

AC_SEARCH_LIBS([cplus_demangle_v3_callback], [iberty_pic iberty])
if test "$ac_cv_search_cplus_demangle_v3_callback" != "no" ; then
  AC_DEFINE([HAVE_CPLUS_DEMANGLE_V3_CALLBACK], [1],
            [Define to 1 if we have cplus_demangle_v3_callback.])
fi

# Check for clock_gettime(2). This is not in an AC_CHECK_FUNCS() because we
# want to link with librt if necessary.
AC_SEARCH_LIBS([clock_gettime], [rt],
  AC_DEFINE(
    [HAVE_CLOCK_GETTIME],
    [1],
    [Define to 1 if we support clock_gettime(2).]),
  [])

# Check for pthread_atfork(3). This is not in an AC_CHECK_FUNCS() because we
# want to include pthread.h if necessary.
AC_CACHE_CHECK(
  [for pthread_atfork support],
  [folly_cv_prog_cc_pthread_atfork],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <pthread.h>
      void func() {pthread_atfork(NULL, NULL, NULL);}]
    ],
    [folly_cv_prog_cc_pthread_atfork=yes],
    [folly_cv_prog_cc_pthread_atfork=no])])

if test "$folly_cv_prog_cc_pthread_atfork" = "yes"; then
  AC_DEFINE([HAVE_PTHREAD_ATFORK], [1], [Define to 1 if the compiler supports pthread_atfork])
fi

# Check for XSI-compatible strerror_r as default implementation
AC_CACHE_CHECK(
  [for XSI style strerror_r support],
  [folly_cv_prog_cc_xsi_strerror_r],
  [AC_RUN_IFELSE(
    [AC_LANG_SOURCE[
      #include <string.h>
      #include <errno.h>
      int main(int argc, char** argv) {
        char buf[1024];
        buf[0] = 0;
        int ret = strerror_r(ENOMEM, buf, sizeof(buf));
        return ret;
      }
    ]],
    [folly_cv_prog_cc_xsi_strerror_r=yes],
    [folly_cv_prog_cc_xsi_strerror_r=no])])

if test "$folly_cv_prog_cc_xsi_strerror_r" = "yes"; then
  AC_DEFINE([HAVE_XSI_STRERROR_R], [1], [Define to 1 if the runtime supports XSI-style strerror_r])
fi

AC_CACHE_CHECK(
  [for ext/random and __gnu_cxx::sfmt19937],
  [folly_cv_prog_cc_have_extrandom_sfmt19937],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      #include <ext/random>
      int main(int argc, char** argv) {
        __gnu_cxx::sfmt19937 rng;
        return 0;
      }
    ]],
    [folly_cv_prog_cc_have_extrandom_sfmt19937=yes],
    [folly_cv_prog_cc_have_extrandom_sfmt19937=no])])

AC_CACHE_CHECK(
  [for VLA (variable-length array) support],
  [folly_cv_prog_cc_have_vla],
  [AC_COMPILE_IFELSE(
    [AC_LANG_SOURCE[
      int main(int argc, char** argv) {
        unsigned size = argc;
        char data[size];
        return 0;
      }
    ]],
    [folly_cv_prog_cc_have_vla=yes],
    [folly_cv_prog_cc_have_vla=no])])

test "$folly_cv_prog_cc_have_vla" = yes && have_vla=1 || have_vla=0
AC_DEFINE_UNQUOTED(
  [HAVE_VLA],
  [$have_vla],
  [Define to 1 if the compiler has VLA (variable-length array) support,
   otherwise define to 0])

# Checks for library functions.
AC_CHECK_FUNCS([malloc_size \
                malloc_usable_size \
                memrchr \
                pipe2 \
                preadv \
                pwritev \
              ])

AC_CHECK_HEADER([lz4.h], AC_CHECK_LIB([lz4], [LZ4_decompress_safe]))
AC_CHECK_HEADER([snappy.h], AC_CHECK_LIB([snappy], [main]))
AC_CHECK_HEADER([zlib.h], AC_CHECK_LIB([z], [main]))
AC_CHECK_HEADER([lzma.h], AC_CHECK_LIB([lzma], [main]))
AC_CHECK_HEADER([zstd.h], AC_CHECK_LIB([zstd], [ZSTD_compressStream]))
AC_CHECK_HEADER([linux/membarrier.h], AC_DEFINE([HAVE_LINUX_MEMBARRIER_H], [1], [Define to 1 if membarrier.h is available]))

AC_ARG_ENABLE([follytestmain],
   AS_HELP_STRING([--enable-follytestmain], [enables using main function from folly for tests]),
   [follytestmain=${enableval}], [follytestmain=no])

use_follytestmain=yes
# libdwarf used to install in /usr/include, now installs in /usr/include/libdwarf.
AC_CHECK_HEADERS([libdwarf/dwarf.h dwarf.h], [break])
# Check whether we have both the library and the header
have_libdwarf=no
AS_IF([test "x${ac_cv_header_libdwarf_dwarf_h}" = xyes], [have_libdwarf=yes])
AS_IF([test "x${ac_cv_header_dwarf_h}" = xyes], [have_libdwarf=yes])


AC_ARG_ENABLE([mobile],
   AS_HELP_STRING([--enable-mobile],
                  [enables using main function from folly for tests]),
                  [mobile=${enableval}], [mobile=no])
AS_IF([test "x${mobile}" = "xyes"], [
    AC_DEFINE([MOBILE], [1],
              [Define to 1 for compiler guards for mobile targets.])
])

# Include directory that contains "folly" so #include <folly/Foo.h> works
AM_CPPFLAGS='-I$(top_srcdir)/..'
AM_CPPFLAGS="$AM_CPPFLAGS $BOOST_CPPFLAGS $OPENSSL_INCLUDES"
AM_LDFLAGS="$AM_LDFLAGS $BOOST_CONTEXT_LIB $BOOST_PROGRAM_OPTIONS_LIB"
AM_LDFLAGS="$AM_LDFLAGS $BOOST_THREAD_LIB $BOOST_FILESYSTEM_LIB"
AM_LDFLAGS="$AM_LDFLAGS $BOOST_SYSTEM_LIB $BOOST_REGEX_LIB -lpthread"
AM_LDFLAGS="$AM_LDFLAGS $BOOST_CHRONO_LIB"

AM_LDFLAGS="$AM_LDFLAGS $OPENSSL_LDFLAGS $OPENSSL_LIBS"

AC_SUBST([AM_CPPFLAGS])
AC_SUBST([AM_LDFLAGS])

AM_CONDITIONAL([HAVE_STD_THREAD], [test "$ac_cv_header_features" = "yes"])
AM_CONDITIONAL([HAVE_X86_64], [test "$build_cpu" = "x86_64"])
AM_CONDITIONAL([HAVE_PPC64], [test "$build_cpu" = "powerpc64le"])
AM_CONDITIONAL([RUN_ARCH_SPECIFIC_TESTS], [test "$build_cpu" = "x86_64" || test "$build_cpu" = "powerpc64le"])
AM_CONDITIONAL([HAVE_LINUX], [test "$build_os" == "linux-gnu"])
AM_CONDITIONAL([HAVE_WEAK_SYMBOLS],
               [test "$folly_cv_prog_cc_weak_symbols" = "yes"])
AM_CONDITIONAL([HAVE_BITS_FUNCTEXCEPT_H], [test "$ac_cv_header_bits_functexcept_h" = "yes"])
AM_CONDITIONAL([HAVE_EXTRANDOM_SFMT19937],
               [test "$folly_cv_prog_cc_have_extrandom_sfmt19937" = "yes"])
AM_CONDITIONAL([FOLLY_TESTMAIN], [test "x${use_follytestmain}" = "xyes"])
AM_CONDITIONAL([HAVE_LIBDWARF], [test "x${have_libdwarf}" = "xyes"])
AM_CONDITIONAL([HAVE_BOOST_CONTEXT], [test "x${ax_cv_boost_context}" = "xyes"])

# remove pkg-config deps from dependent libraries
# (at least for pkg-config file purposes)
FB_FILTER_PKG_LIBS([$AM_LDFLAGS $LIBS])

# Output
AC_CONFIG_FILES([Makefile
                 libfolly.pc
                 test/Makefile
                 test/function_benchmark/Makefile
                 experimental/Makefile
                 experimental/symbolizer/Makefile
                 init/Makefile])
AC_OUTPUT
