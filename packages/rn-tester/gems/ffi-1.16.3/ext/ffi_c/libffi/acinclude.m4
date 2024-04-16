# mmap(2) blacklisting.  Some platforms provide the mmap library routine
# but don't support all of the features we need from it.
AC_DEFUN([AC_FUNC_MMAP_BLACKLIST],
[
AC_CHECK_HEADER([sys/mman.h],
		[libffi_header_sys_mman_h=yes], [libffi_header_sys_mman_h=no])
AC_CHECK_FUNC([mmap], [libffi_func_mmap=yes], [libffi_func_mmap=no])
if test "$libffi_header_sys_mman_h" != yes \
 || test "$libffi_func_mmap" != yes; then
   ac_cv_func_mmap_file=no
   ac_cv_func_mmap_dev_zero=no
   ac_cv_func_mmap_anon=no
else
   AC_CACHE_CHECK([whether read-only mmap of a plain file works],
  ac_cv_func_mmap_file,
  [# Add a system to this blacklist if
   # mmap(0, stat_size, PROT_READ, MAP_PRIVATE, fd, 0) doesn't return a
   # memory area containing the same data that you'd get if you applied
   # read() to the same fd.  The only system known to have a problem here
   # is VMS, where text files have record structure.
   case "$host_os" in
     vms* | ultrix*)
	ac_cv_func_mmap_file=no ;;
     *)
	ac_cv_func_mmap_file=yes;;
   esac])
   AC_CACHE_CHECK([whether mmap from /dev/zero works],
  ac_cv_func_mmap_dev_zero,
  [# Add a system to this blacklist if it has mmap() but /dev/zero
   # does not exist, or if mmapping /dev/zero does not give anonymous
   # zeroed pages with both the following properties:
   # 1. If you map N consecutive pages in with one call, and then
   #    unmap any subset of those pages, the pages that were not
   #    explicitly unmapped remain accessible.
   # 2. If you map two adjacent blocks of memory and then unmap them
   #    both at once, they must both go away.
   # Systems known to be in this category are Windows (all variants),
   # VMS, and Darwin.
   case "$host_os" in
     vms* | cygwin* | pe | mingw* | darwin* | ultrix* | hpux10* | hpux11.00)
	ac_cv_func_mmap_dev_zero=no ;;
     *)
	ac_cv_func_mmap_dev_zero=yes;;
   esac])

   # Unlike /dev/zero, the MAP_ANON(YMOUS) defines can be probed for.
   AC_CACHE_CHECK([for MAP_ANON(YMOUS)], ac_cv_decl_map_anon,
    [AC_COMPILE_IFELSE(
[AC_LANG_PROGRAM([[#include <sys/types.h>
#include <sys/mman.h>
#include <unistd.h>

#ifndef MAP_ANONYMOUS
#define MAP_ANONYMOUS MAP_ANON
#endif
]],
[[int n = MAP_ANONYMOUS;]])],
    ac_cv_decl_map_anon=yes,
    ac_cv_decl_map_anon=no)])

   if test $ac_cv_decl_map_anon = no; then
     ac_cv_func_mmap_anon=no
   else
     AC_CACHE_CHECK([whether mmap with MAP_ANON(YMOUS) works],
     ac_cv_func_mmap_anon,
  [# Add a system to this blacklist if it has mmap() and MAP_ANON or
   # MAP_ANONYMOUS, but using mmap(..., MAP_PRIVATE|MAP_ANONYMOUS, -1, 0)
   # doesn't give anonymous zeroed pages with the same properties listed
   # above for use of /dev/zero.
   # Systems known to be in this category are Windows, VMS, and SCO Unix.
   case "$host_os" in
     vms* | cygwin* | pe | mingw* | sco* | udk* )
	ac_cv_func_mmap_anon=no ;;
     *)
	ac_cv_func_mmap_anon=yes;;
   esac])
   fi
fi

if test $ac_cv_func_mmap_file = yes; then
  AC_DEFINE(HAVE_MMAP_FILE, 1,
	    [Define if read-only mmap of a plain file works.])
fi
if test $ac_cv_func_mmap_dev_zero = yes; then
  AC_DEFINE(HAVE_MMAP_DEV_ZERO, 1,
	    [Define if mmap of /dev/zero works.])
fi
if test $ac_cv_func_mmap_anon = yes; then
  AC_DEFINE(HAVE_MMAP_ANON, 1,
	    [Define if mmap with MAP_ANON(YMOUS) works.])
fi
])

dnl ----------------------------------------------------------------------
dnl This whole bit snagged from libstdc++-v3, via libatomic.

dnl
dnl LIBFFI_ENABLE
dnl    (FEATURE, DEFAULT, HELP-ARG, HELP-STRING)
dnl    (FEATURE, DEFAULT, HELP-ARG, HELP-STRING, permit a|b|c)
dnl    (FEATURE, DEFAULT, HELP-ARG, HELP-STRING, SHELL-CODE-HANDLER)
dnl
dnl See docs/html/17_intro/configury.html#enable for documentation.
dnl
m4_define([LIBFFI_ENABLE],[dnl
m4_define([_g_switch],[--enable-$1])dnl
m4_define([_g_help],[AS_HELP_STRING([_g_switch$3],[$4 @<:@default=$2@:>@])])dnl
 AC_ARG_ENABLE($1,_g_help,
  m4_bmatch([$5],
   [^permit ],
     [[
      case "$enableval" in
       m4_bpatsubst([$5],[permit ])) ;;
       *) AC_MSG_ERROR(Unknown argument to enable/disable $1) ;;
          dnl Idea for future:  generate a URL pointing to
          dnl "onlinedocs/configopts.html#whatever"
      esac
     ]],
   [^$],
     [[
      case "$enableval" in
       yes|no) ;;
       *) AC_MSG_ERROR(Argument to enable/disable $1 must be yes or no) ;;
      esac
     ]],
   [[$5]]),
  [enable_]m4_bpatsubst([$1],-,_)[=][$2])
m4_undefine([_g_switch])dnl
m4_undefine([_g_help])dnl
])

dnl
dnl If GNU ld is in use, check to see if tricky linker opts can be used.  If
dnl the native linker is in use, all variables will be defined to something
dnl safe (like an empty string).
dnl
dnl Defines:
dnl  SECTION_LDFLAGS='-Wl,--gc-sections' if possible
dnl  OPT_LDFLAGS='-Wl,-O1' if possible
dnl  LD (as a side effect of testing)
dnl Sets:
dnl  with_gnu_ld
dnl  libat_ld_is_gold (possibly)
dnl  libat_gnu_ld_version (possibly)
dnl
dnl The last will be a single integer, e.g., version 1.23.45.0.67.89 will
dnl set libat_gnu_ld_version to 12345.  Zeros cause problems.
dnl
AC_DEFUN([LIBFFI_CHECK_LINKER_FEATURES], [
  # If we're not using GNU ld, then there's no point in even trying these
  # tests.  Check for that first.  We should have already tested for gld
  # by now (in libtool), but require it now just to be safe...
  test -z "$SECTION_LDFLAGS" && SECTION_LDFLAGS=''
  test -z "$OPT_LDFLAGS" && OPT_LDFLAGS=''
  AC_REQUIRE([LT_PATH_LD])
  AC_REQUIRE([AC_PROG_AWK])

  # The name set by libtool depends on the version of libtool.  Shame on us
  # for depending on an impl detail, but c'est la vie.  Older versions used
  # ac_cv_prog_gnu_ld, but now it's lt_cv_prog_gnu_ld, and is copied back on
  # top of with_gnu_ld (which is also set by --with-gnu-ld, so that actually
  # makes sense).  We'll test with_gnu_ld everywhere else, so if that isn't
  # set (hence we're using an older libtool), then set it.
  if test x${with_gnu_ld+set} != xset; then
    if test x${ac_cv_prog_gnu_ld+set} != xset; then
      # We got through "ac_require(ac_prog_ld)" and still not set?  Huh?
      with_gnu_ld=no
    else
      with_gnu_ld=$ac_cv_prog_gnu_ld
    fi
  fi

  # Start by getting the version number.  I think the libtool test already
  # does some of this, but throws away the result.
  libat_ld_is_gold=no
  if $LD --version 2>/dev/null | grep 'GNU gold'> /dev/null 2>&1; then
    libat_ld_is_gold=yes
  fi
  libat_ld_is_lld=no
  if $LD --version 2>/dev/null | grep 'LLD '> /dev/null 2>&1; then
    libat_ld_is_lld=yes
  fi
  changequote(,)
  ldver=`$LD --version 2>/dev/null |
         sed -e 's/GNU gold /GNU ld /;s/GNU ld version /GNU ld /;s/GNU ld ([^)]*) /GNU ld /;s/GNU ld \([0-9.][0-9.]*\).*/\1/; q'`
  changequote([,])
  libat_gnu_ld_version=`echo $ldver | \
         $AWK -F. '{ if (NF<3) [$]3=0; print ([$]1*100+[$]2)*100+[$]3 }'`

  # Set --gc-sections.
  if test "$with_gnu_ld" = "notbroken"; then
    # GNU ld it is!  Joy and bunny rabbits!

    # All these tests are for C++; save the language and the compiler flags.
    # Need to do this so that g++ won't try to link in libstdc++
    ac_test_CFLAGS="${CFLAGS+set}"
    ac_save_CFLAGS="$CFLAGS"
    CFLAGS='-x c++  -Wl,--gc-sections'

    # Check for -Wl,--gc-sections
    # XXX This test is broken at the moment, as symbols required for linking
    # are now in libsupc++ (not built yet).  In addition, this test has
    # cored on solaris in the past.  In addition, --gc-sections doesn't
    # really work at the moment (keeps on discarding used sections, first
    # .eh_frame and now some of the glibc sections for iconv).
    # Bzzzzt.  Thanks for playing, maybe next time.
    AC_MSG_CHECKING([for ld that supports -Wl,--gc-sections])
    AC_RUN_IFELSE([AC_LANG_SOURCE([[
     int main(void)
     {
       try { throw 1; }
       catch (...) { };
       return 0;
     }
    ]])],[ac_sectionLDflags=yes],[ac_sectionLDflags=no],[ac_sectionLDflags=yes])
    if test "$ac_test_CFLAGS" = set; then
      CFLAGS="$ac_save_CFLAGS"
    else
      # this is the suspicious part
      CFLAGS=''
    fi
    if test "$ac_sectionLDflags" = "yes"; then
      SECTION_LDFLAGS="-Wl,--gc-sections $SECTION_LDFLAGS"
    fi
    AC_MSG_RESULT($ac_sectionLDflags)
  fi

  # Set linker optimization flags.
  if test x"$with_gnu_ld" = x"yes"; then
    OPT_LDFLAGS="-Wl,-O1 $OPT_LDFLAGS"
  fi

  AC_SUBST(SECTION_LDFLAGS)
  AC_SUBST(OPT_LDFLAGS)
])


dnl
dnl Add version tags to symbols in shared library (or not), additionally
dnl marking other symbols as private/local (or not).
dnl
dnl --enable-symvers=style adds a version script to the linker call when
dnl       creating the shared library.  The choice of version script is
dnl       controlled by 'style'.
dnl --disable-symvers does not.
dnl  +  Usage:  LIBFFI_ENABLE_SYMVERS[(DEFAULT)]
dnl       Where DEFAULT is either 'yes' or 'no'.  Passing `yes' tries to
dnl       choose a default style based on linker characteristics.  Passing
dnl       'no' disables versioning.
dnl
AC_DEFUN([LIBFFI_ENABLE_SYMVERS], [

LIBFFI_ENABLE(symvers,yes,[=STYLE],
  [enables symbol versioning of the shared library],
  [permit yes|no|gnu*|sun])

# If we never went through the LIBFFI_CHECK_LINKER_FEATURES macro, then we
# don't know enough about $LD to do tricks...
AC_REQUIRE([LIBFFI_CHECK_LINKER_FEATURES])

# Turn a 'yes' into a suitable default.
if test x$enable_symvers = xyes ; then
  # FIXME  The following test is too strict, in theory.
  if test $enable_shared = no || test "x$LD" = x; then
    enable_symvers=no
  else
    if test $with_gnu_ld = yes ; then
      enable_symvers=gnu
    else
      case ${target_os} in
        # Sun symbol versioning exists since Solaris 2.5.
        solaris2.[[5-9]]* | solaris2.1[[0-9]]*)
          enable_symvers=sun ;;
        *)
          enable_symvers=no ;;
      esac
    fi
  fi
fi

# Check if 'sun' was requested on non-Solaris 2 platforms.
if test x$enable_symvers = xsun ; then
  case ${target_os} in
    solaris2*)
      # All fine.
      ;;
    *)
      # Unlikely to work.
      AC_MSG_WARN([=== You have requested Sun symbol versioning, but])
      AC_MSG_WARN([=== you are not targetting Solaris 2.])
      AC_MSG_WARN([=== Symbol versioning will be disabled.])
      enable_symvers=no
      ;;
  esac
fi

# Check to see if libgcc_s exists, indicating that shared libgcc is possible.
if test $enable_symvers != no; then
  AC_MSG_CHECKING([for shared libgcc])
  ac_save_CFLAGS="$CFLAGS"
  CFLAGS=' -lgcc_s'
  AC_LINK_IFELSE([AC_LANG_PROGRAM([[]], [[return 0;]])],[libat_shared_libgcc=yes],[libat_shared_libgcc=no])
  CFLAGS="$ac_save_CFLAGS"
  if test $libat_shared_libgcc = no; then
    cat > conftest.c <<EOF
int main (void) { return 0; }
EOF
changequote(,)dnl
    libat_libgcc_s_suffix=`${CC-cc} $CFLAGS $CPPFLAGS $LDFLAGS \
			     -shared -shared-libgcc -o conftest.so \
			     conftest.c -v 2>&1 >/dev/null \
			     | sed -n 's/^.* -lgcc_s\([^ ]*\) .*$/\1/p'`
changequote([,])dnl
    rm -f conftest.c conftest.so
    if test x${libat_libgcc_s_suffix+set} = xset; then
      CFLAGS=" -lgcc_s$libat_libgcc_s_suffix"
      AC_LINK_IFELSE([AC_LANG_PROGRAM([[]], [[return 0;]])],[libat_shared_libgcc=yes],[])
      CFLAGS="$ac_save_CFLAGS"
    fi
  fi
  AC_MSG_RESULT($libat_shared_libgcc)
fi

# For GNU ld, we need at least this version.  The format is described in
# LIBFFI_CHECK_LINKER_FEATURES above.
libat_min_gnu_ld_version=21400
# XXXXXXXXXXX libat_gnu_ld_version=21390

# Check to see if unspecified "yes" value can win, given results above.
# Change "yes" into either "no" or a style name.
if test $enable_symvers != no && test $libat_shared_libgcc = yes; then
  if test $with_gnu_ld = yes; then
    if test $libat_gnu_ld_version -ge $libat_min_gnu_ld_version ; then
      enable_symvers=gnu
    elif test $libat_ld_is_gold = yes ; then
      enable_symvers=gnu
    elif test $libat_ld_is_lld = yes ; then
      enable_symvers=gnu
    else
      # The right tools, the right setup, but too old.  Fallbacks?
      AC_MSG_WARN(=== Linker version $libat_gnu_ld_version is too old for)
      AC_MSG_WARN(=== full symbol versioning support in this release of GCC.)
      AC_MSG_WARN(=== You would need to upgrade your binutils to version)
      AC_MSG_WARN(=== $libat_min_gnu_ld_version or later and rebuild GCC.)
      if test $libat_gnu_ld_version -ge 21200 ; then
        # Globbing fix is present, proper block support is not.
        dnl AC_MSG_WARN([=== Dude, you are soooo close.  Maybe we can fake it.])
        dnl enable_symvers=???
        AC_MSG_WARN([=== Symbol versioning will be disabled.])
        enable_symvers=no
      else
        # 2.11 or older.
        AC_MSG_WARN([=== Symbol versioning will be disabled.])
        enable_symvers=no
      fi
    fi
  elif test $enable_symvers = sun; then
    : All interesting versions of Sun ld support sun style symbol versioning.
  else
    # just fail for now
    AC_MSG_WARN([=== You have requested some kind of symbol versioning, but])
    AC_MSG_WARN([=== either you are not using a supported linker, or you are])
    AC_MSG_WARN([=== not building a shared libgcc_s (which is required).])
    AC_MSG_WARN([=== Symbol versioning will be disabled.])
    enable_symvers=no
  fi
fi
if test $enable_symvers = gnu; then
  AC_DEFINE(LIBFFI_GNU_SYMBOL_VERSIONING, 1,
	    [Define to 1 if GNU symbol versioning is used for libatomic.])
fi

AM_CONDITIONAL(LIBFFI_BUILD_VERSIONED_SHLIB, test $enable_symvers != no)
AM_CONDITIONAL(LIBFFI_BUILD_VERSIONED_SHLIB_GNU, test $enable_symvers = gnu)
AM_CONDITIONAL(LIBFFI_BUILD_VERSIONED_SHLIB_SUN, test $enable_symvers = sun)
AC_MSG_NOTICE(versioning on shared library symbols is $enable_symvers)
])
