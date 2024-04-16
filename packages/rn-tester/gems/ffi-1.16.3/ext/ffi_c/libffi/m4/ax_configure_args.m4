# ===========================================================================
#    https://www.gnu.org/software/autoconf-archive/ax_configure_args.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_CONFIGURE_ARGS
#
# DESCRIPTION
#
#   Helper macro for AX_ENABLE_BUILDDIR.
#
#   The traditional way of starting a subdir-configure is running the script
#   with ${1+"$@"} but since autoconf 2.60 this is broken. Instead we have
#   to rely on eval'ing $ac_configure_args however some old autoconf
#   versions do not provide that. To ensure maximum portability of autoconf
#   extension macros this helper can be AC_REQUIRE'd so that
#   $ac_configure_args will always be present.
#
#   Sadly, the traditional "exec $SHELL" of the enable_builddir macros is
#   spoiled now and must be replaced by "eval + exit $?".
#
#   Example:
#
#     AC_DEFUN([AX_ENABLE_SUBDIR],[dnl
#       AC_REQUIRE([AX_CONFIGURE_ARGS])dnl
#       eval $SHELL $ac_configure_args || exit $?
#       ...])
#
# LICENSE
#
#   Copyright (c) 2008 Guido U. Draheim <guidod@gmx.de>
#
#   Copying and distribution of this file, with or without modification, are
#   permitted in any medium without royalty provided the copyright notice
#   and this notice are preserved.  This file is offered as-is, without any
#   warranty.

#serial 14

AC_DEFUN([AX_CONFIGURE_ARGS],[
   # [$]@ is unusable in 2.60+ but earlier autoconf had no ac_configure_args
   if test "${ac_configure_args+set}" != "set" ; then
      ac_configure_args=
      for ac_arg in ${1+"[$]@"}; do
         ac_configure_args="$ac_configure_args '$ac_arg'"
      done
   fi
])
