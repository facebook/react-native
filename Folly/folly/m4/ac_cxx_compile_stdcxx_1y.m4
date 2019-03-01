# ===========================================================================
#        http://autoconf-archive.cryp.to/ac_cxx_compile_stdcxx_0x.html
# ===========================================================================
#
# SYNOPSIS
#
#   AC_CXX_COMPILE_STDCXX_1Y
#
# DESCRIPTION
#
#   Check for baseline language coverage in the compiler for the C++1y
#   standard.
#
# LAST MODIFICATION
#
#   2008-04-17
#
# COPYLEFT
#
#   Copyright (c) 2008 Benjamin Kosnik <bkoz@redhat.com>
#
#   Copying and distribution of this file, with or without modification, are
#   permitted in any medium without royalty provided the copyright notice
#   and this notice are preserved.

AC_DEFUN([AC_CXX_COMPILE_STDCXX_1Y], [
  AC_CACHE_CHECK(if g++ supports C++1y features without additional flags,
  ac_cv_cxx_compile_cxx1y_native,
  [AC_LANG_SAVE
  AC_LANG_CPLUSPLUS
  AC_TRY_COMPILE([
  template <typename T>
    struct check
    {
      static_assert(sizeof(int) <= sizeof(T), "not big enough");
    };

    typedef check<check<bool>> right_angle_brackets;

    int a;
    decltype(a) b;
    auto f() {
      int x = 0b01001;
      return x;
    }

    typedef check<int> check_type;
    check_type c;
    check_type&& cr = static_cast<check_type&&>(c);],,
  ac_cv_cxx_compile_cxx1y_native=yes, ac_cv_cxx_compile_cxx1y_native=no)
  AC_LANG_RESTORE
  ])

  AC_CACHE_CHECK(if g++ supports C++1y features with -std=c++1y,
  ac_cv_cxx_compile_cxx1y_cxx,
  [AC_LANG_SAVE
  AC_LANG_CPLUSPLUS
  ac_save_CXXFLAGS="$CXXFLAGS"
  CXXFLAGS="$CXXFLAGS -std=c++1y"
  AC_TRY_COMPILE([
  template <typename T>
    struct check
    {
      static_assert(sizeof(int) <= sizeof(T), "not big enough");
    };

    typedef check<check<bool>> right_angle_brackets;

    int a;
    decltype(a) b;
    auto f() {
      int x = 0b01001;
      return x;
    }

    typedef check<int> check_type;
    check_type c;
    check_type&& cr = static_cast<check_type&&>(c);],,
  ac_cv_cxx_compile_cxx1y_cxx=yes, ac_cv_cxx_compile_cxx1y_cxx=no)
  CXXFLAGS="$ac_save_CXXFLAGS"
  AC_LANG_RESTORE
  ])

  AC_CACHE_CHECK(if g++ supports C++1y features with -std=gnu++1y,
  ac_cv_cxx_compile_cxx1y_gxx,
  [AC_LANG_SAVE
  AC_LANG_CPLUSPLUS
  ac_save_CXXFLAGS="$CXXFLAGS"
  CXXFLAGS="$CXXFLAGS -std=gnu++1y"
  AC_TRY_COMPILE([
  template <typename T>
    struct check
    {
      static_assert(sizeof(int) <= sizeof(T), "not big enough");
    };

    typedef check<check<bool>> right_angle_brackets;

    int a;
    decltype(a) b;
    auto f() {
      int x = 0b01001;
      return x;
    }

    typedef check<int> check_type;
    check_type c;
    check_type&& cr = static_cast<check_type&&>(c);],,
  ac_cv_cxx_compile_cxx1y_gxx=yes, ac_cv_cxx_compile_cxx1y_gxx=no)
  CXXFLAGS="$ac_save_CXXFLAGS"
  AC_LANG_RESTORE
  ])

  if test "$ac_cv_cxx_compile_cxx1y_native" = yes ||
     test "$ac_cv_cxx_compile_cxx1y_cxx" = yes ||
     test "$ac_cv_cxx_compile_cxx1y_gxx" = yes; then
    AC_DEFINE(HAVE_STDCXX_1Y,,[Define if g++ supports C++1y features. ])
  else
    AC_MSG_ERROR([Could not find cxx1y support in g++])				
  fi
])
 
