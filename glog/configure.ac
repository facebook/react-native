## Process this file with autoconf to produce configure.
## In general, the safest way to proceed is to run the following:
##    % aclocal -I . -I `pwd`/../autoconf && autoheader && autoconf && automake

# make sure we're interpreted by some minimal autoconf
AC_PREREQ(2.57)

AC_INIT(glog, 0.3.5, opensource@google.com)
# The argument here is just something that should be in the current directory
# (for sanity checking)
AC_CONFIG_SRCDIR(README)
AC_CONFIG_MACRO_DIR([m4])
AM_INIT_AUTOMAKE
AM_CONFIG_HEADER(src/config.h)

AC_LANG(C++)

# Checks for programs.
AC_PROG_CC
AC_PROG_CPP
AC_PROG_CXX
AM_CONDITIONAL(GCC, test "$GCC" = yes)   # let the Makefile know if we're gcc

AC_PROG_LIBTOOL
AC_SUBST(LIBTOOL_DEPS)

# Check whether some low-level functions/files are available
AC_HEADER_STDC

# These are tested for by AC_HEADER_STDC, but I check again to set the var
AC_CHECK_HEADER(stdint.h, ac_cv_have_stdint_h=1, ac_cv_have_stdint_h=0)
AC_CHECK_HEADER(sys/types.h, ac_cv_have_systypes_h=1, ac_cv_have_systypes_h=0)
AC_CHECK_HEADER(inttypes.h, ac_cv_have_inttypes_h=1, ac_cv_have_inttypes_h=0)
AC_CHECK_HEADERS(unistd.h, ac_cv_have_unistd_h=1, ac_cv_have_unistd_h=0)
AC_CHECK_HEADERS(syscall.h)
AC_CHECK_HEADERS(sys/syscall.h)
# For backtrace with glibc.
AC_CHECK_HEADERS(execinfo.h)
# For backtrace with libunwind.
AC_CHECK_HEADERS(libunwind.h, ac_cv_have_libunwind_h=1, ac_cv_have_libunwind_h=0)
AC_CHECK_HEADERS(ucontext.h)
AC_CHECK_HEADERS(sys/utsname.h)
AC_CHECK_HEADERS(pwd.h)
AC_CHECK_HEADERS(syslog.h)
AC_CHECK_HEADERS(sys/time.h)
AC_CHECK_HEADERS(glob.h)
# For backtrace with gcc.
AC_CHECK_HEADERS(unwind.h)

AC_CHECK_HEADER(windows.h, ac_cv_have_windows_h=1, ac_cv_have_windows_h=0)
if test x"$ac_cv_have_windows_h" = x"1"; then
  MINGW_CFLAGS=-Isrc/windows
fi

AC_CHECK_SIZEOF(void *)

# These are the types I need.  We look for them in either stdint.h,
# sys/types.h, or inttypes.h, all of which are part of the default-includes.
AC_CHECK_TYPE(uint16_t, ac_cv_have_uint16_t=1, ac_cv_have_uint16_t=0)
AC_CHECK_TYPE(u_int16_t, ac_cv_have_u_int16_t=1, ac_cv_have_u_int16_t=0)
AC_CHECK_TYPE(__uint16, ac_cv_have___uint16=1, ac_cv_have___uint16=0)

AC_CHECK_FUNC(sigaltstack,
              AC_DEFINE(HAVE_SIGALTSTACK, 1,
                        [Define if you have the `sigaltstack' function]))
AC_CHECK_FUNC(sigaction,
              AC_DEFINE(HAVE_SIGACTION, 1,
                        [Define if you have the 'sigaction' function]))
AC_CHECK_FUNC(dladdr,
              AC_DEFINE(HAVE_DLADDR, 1,
                        [Define if you have the `dladdr' function]))
AC_CHECK_FUNC(fcntl,
              AC_DEFINE(HAVE_FCNTL, 1,
                        [Define if you have the `fcntl' function]))
AC_CHECK_FUNC(pread,
              AC_DEFINE(HAVE_PREAD, 1,
                        [Define if you have the 'pread' function]))
AC_CHECK_FUNC(pwrite,
              AC_DEFINE(HAVE_PWRITE, 1,
                        [Define if you have the 'pwrite' function]))

AX_C___ATTRIBUTE__
# We only care about these two attributes.
if test x"$ac_cv___attribute__" = x"yes"; then
  ac_cv___attribute___noreturn="__attribute__ ((noreturn))"
  ac_cv___attribute___noinline="__attribute__ ((noinline))"
  ac_cv___attribute___printf_4_5="__attribute__((__format__ (__printf__, 4, 5)))"
else
  ac_cv___attribute___noreturn=
  ac_cv___attribute___noinline=
  ac_cv___attribute___printf_4_5=
fi

AX_C___BUILTIN_EXPECT
if test x"$ac_cv___builtin_expect" = x"yes"; then
  ac_cv_have___builtin_expect=1
else
  ac_cv_have___builtin_expect=0
fi

AX_C___SYNC_VAL_COMPARE_AND_SWAP

# On x86_64, instead of libunwind, we can choose to compile with frame-pointers
# (This isn't needed on i386, where -fno-omit-frame-pointer is the default).
AC_ARG_ENABLE(frame_pointers,
              AS_HELP_STRING([--enable-frame-pointers],
                             [On x86_64 systems, compile with -fno-omit-frame-pointer (see INSTALL)]),,
              enable_frame_pointers=no)
AC_COMPILE_IFELSE([AC_LANG_PROGRAM(, [return __x86_64__ == 1 ? 0 : 1])],
                  [is_x86_64=yes], [is_x86_64=no])
AM_CONDITIONAL(ENABLE_FRAME_POINTERS, test "$enable_frame_pointers" = yes)
AM_CONDITIONAL(X86_64, test "$is_x86_64" = yes)

AC_ARG_ENABLE(rtti,
              AS_HELP_STRING([--disable-rtti],
                             [Disable RTTI in glog]))
AM_CONDITIONAL(DISABLE_RTTI, test x"$enable_rtti" = x"no")
if test x"$enable_rtti" = x"no"; then
  AC_DEFINE(DISABLE_RTTI, 1, [define if glog doesn't use RTTI])
fi

# Some of the code in this directory depends on pthreads
ACX_PTHREAD
if test x"$acx_pthread_ok" = x"yes"; then
  # To make libglog depend on libpthread on Linux, we need to add
  # -lpthread in addition to -pthread.
  AC_CHECK_LIB(pthread, pthread_self)
fi

# Check if there is google-gflags library installed.
SAVE_CFLAGS="$CFLAGS"
SAVE_LIBS="$LIBS"
AC_ARG_WITH(gflags, AS_HELP_STRING[--with-gflags=GFLAGS_DIR],
  GFLAGS_CFLAGS="-I${with_gflags}/include"
  GFLAGS_LIBS="-L${with_gflags}/lib -lgflags"
  CFLAGS="$CFLAGS $GFLAGS_CFLAGS"
  LIBS="$LIBS $GFLAGS_LIBS"
)
AC_CHECK_LIB(gflags, main, ac_cv_have_libgflags=1, ac_cv_have_libgflags=0)
if test x"$ac_cv_have_libgflags" = x"1"; then
  AC_DEFINE(HAVE_LIB_GFLAGS, 1, [define if you have google gflags library])
  if test x"$GFLAGS_LIBS" = x""; then
    GFLAGS_LIBS="-lgflags"
  fi
else
  GFLAGS_CFLAGS=
  GFLAGS_LIBS=
fi
CFLAGS="$SAVE_CFLAGS"
LIBS="$SAVE_LIBS"

# TODO(hamaji): Use official m4 macros provided by testing libraries
#               once the m4 macro of Google Mocking becomes ready.
# Check if there is Google Test library installed.
AC_CHECK_PROG(GTEST_CONFIG, gtest-config, "yes")
AC_CHECK_LIB(gtest, main, have_gtest_lib="yes")
if test x"$GTEST_CONFIG" = "xyes" -a x"$have_gtest_lib" = "xyes"; then
  GTEST_CFLAGS=`gtest-config --cppflags --cxxflags`
  GTEST_LIBS=`gtest-config --ldflags --libs`
  AC_DEFINE(HAVE_LIB_GTEST, 1, [define if you have google gtest library])

  # Check if there is Google Mocking library installed.
  AC_CHECK_PROG(GMOCK_CONFIG, gmock-config, "yes")
  if test x"$GMOCK_CONFIG" = "xyes"; then
    GMOCK_CFLAGS=`gmock-config --cppflags --cxxflags`
    GMOCK_LIBS=`gmock-config --ldflags --libs`
    AC_DEFINE(HAVE_LIB_GMOCK, 1, [define if you have google gmock library])
  else
    # We don't run test cases which use Google Mocking framework.
    GMOCK_CFLAGS=
    GMOCK_LIBS=
  fi
else
  # We'll use src/googletest.h for our unittests.
  GTEST_CFLAGS=
  GTEST_LIBS=
fi
AM_CONDITIONAL(HAVE_GMOCK, test x"$GMOCK_CONFIG" = "xyes")

# We want to link in libunwind if it exists
UNWIND_LIBS=
# Unfortunately, we need to check the header file in addition to the
# lib file to check if libunwind is available since libunwind-0.98
# doesn't install all necessary header files.
if test x"$ac_cv_have_libunwind_h" = x"1"; then
 AC_CHECK_LIB(unwind, backtrace, UNWIND_LIBS=-lunwind)
fi
AC_SUBST(UNWIND_LIBS)
if test x"$UNWIND_LIBS" != x""; then
  AC_DEFINE(HAVE_LIB_UNWIND, 1, [define if you have libunwind])
fi

# We'd like to use read/write locks in several places in the code.
# See if our pthreads support extends to that.  Note: for linux, it
# does as long as you define _XOPEN_SOURCE appropriately.
AC_RWLOCK

# Find out what namespace 'normal' STL code lives in, and also what namespace
# the user wants our classes to be defined in
AC_CXX_STL_NAMESPACE
AC_DEFINE_GOOGLE_NAMESPACE(google)

AC_CXX_USING_OPERATOR

AC_PC_FROM_UCONTEXT(AC_MSG_WARN(Could not find the PC.  Will not output failed addresses...))

AC_DEFINE_UNQUOTED(TEST_SRC_DIR, "$srcdir", [location of source code])

# These are what's needed by logging.h.in and raw_logging.h.in
AC_SUBST(ac_google_start_namespace)
AC_SUBST(ac_google_end_namespace)
AC_SUBST(ac_google_namespace)
AC_SUBST(ac_cv_cxx_using_operator)
AC_SUBST(ac_cv___attribute___noreturn)
AC_SUBST(ac_cv___attribute___noinline)
AC_SUBST(ac_cv___attribute___printf_4_5)
AC_SUBST(ac_cv_have___builtin_expect)
AC_SUBST(ac_cv_have_stdint_h)
AC_SUBST(ac_cv_have_systypes_h)
AC_SUBST(ac_cv_have_inttypes_h)
AC_SUBST(ac_cv_have_unistd_h)
AC_SUBST(ac_cv_have_uint16_t)
AC_SUBST(ac_cv_have_u_int16_t)
AC_SUBST(ac_cv_have___uint16)
AC_SUBST(ac_cv_have_libgflags)
AC_SUBST(GFLAGS_CFLAGS)
AC_SUBST(GTEST_CFLAGS)
AC_SUBST(GMOCK_CFLAGS)
AC_SUBST(MINGW_CFLAGS)
AC_SUBST(GFLAGS_LIBS)
AC_SUBST(GTEST_LIBS)
AC_SUBST(GMOCK_LIBS)

# Write generated configuration file
AC_CONFIG_FILES([Makefile src/glog/logging.h src/glog/raw_logging.h src/glog/vlog_is_on.h src/glog/stl_logging.h])
AC_OUTPUT(libglog.pc)
