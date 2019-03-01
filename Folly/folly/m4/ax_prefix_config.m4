# ===========================================================================
#    http://www.gnu.org/software/autoconf-archive/ax_prefix_config_h.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_PREFIX_CONFIG_H [(OUTPUT-HEADER [,PREFIX [,ORIG-HEADER]])]
#
# DESCRIPTION
#
#   This is a new variant from ac_prefix_config_ this one will use a
#   lowercase-prefix if the config-define was starting with a
#   lowercase-char, e.g. "#define const", "#define restrict", or "#define
#   off_t", (and this one can live in another directory, e.g.
#   testpkg/config.h therefore I decided to move the output-header to be the
#   first arg)
#
#   takes the usual config.h generated header file; looks for each of the
#   generated "#define SOMEDEF" lines, and prefixes the defined name (ie.
#   makes it "#define PREFIX_SOMEDEF". The result is written to the output
#   config.header file. The PREFIX is converted to uppercase for the
#   conversions.
#
#   Defaults:
#
#     OUTPUT-HEADER = $PACKAGE-config.h
#     PREFIX = $PACKAGE
#     ORIG-HEADER, from AM_CONFIG_HEADER(config.h)
#
#   Your configure.ac script should contain both macros in this order, and
#   unlike the earlier variations of this prefix-macro it is okay to place
#   the AX_PREFIX_CONFIG_H call before the AC_OUTPUT invokation.
#
#   Example:
#
#     AC_INIT(config.h.in)        # config.h.in as created by "autoheader"
#     AM_INIT_AUTOMAKE(testpkg, 0.1.1)    # makes #undef VERSION and PACKAGE
#     AM_CONFIG_HEADER(config.h)          # prep config.h from config.h.in
#     AX_PREFIX_CONFIG_H(mylib/_config.h) # prep mylib/_config.h from it..
#     AC_MEMORY_H                         # makes "#undef NEED_MEMORY_H"
#     AC_C_CONST_H                        # makes "#undef const"
#     AC_OUTPUT(Makefile)                 # creates the "config.h" now
#                                         # and also mylib/_config.h
#
#   if the argument to AX_PREFIX_CONFIG_H would have been omitted then the
#   default outputfile would have been called simply "testpkg-config.h", but
#   even under the name "mylib/_config.h" it contains prefix-defines like
#
#     #ifndef TESTPKG_VERSION
#     #define TESTPKG_VERSION "0.1.1"
#     #endif
#     #ifndef TESTPKG_NEED_MEMORY_H
#     #define TESTPKG_NEED_MEMORY_H 1
#     #endif
#     #ifndef _testpkg_const
#     #define _testpkg_const _const
#     #endif
#
#   and this "mylib/_config.h" can be installed along with other
#   header-files, which is most convenient when creating a shared library
#   (that has some headers) where some functionality is dependent on the
#   OS-features detected at compile-time. No need to invent some
#   "mylib-confdefs.h.in" manually. :-)
#
#   Note that some AC_DEFINEs that end up in the config.h file are actually
#   self-referential - e.g. AC_C_INLINE, AC_C_CONST, and the AC_TYPE_OFF_T
#   say that they "will define inline|const|off_t if the system does not do
#   it by itself". You might want to clean up about these - consider an
#   extra mylib/conf.h that reads something like:
#
#     #include <mylib/_config.h>
#     #ifndef _testpkg_const
#     #define _testpkg_const const
#     #endif
#
#   and then start using _testpkg_const in the header files. That is also a
#   good thing to differentiate whether some library-user has starting to
#   take up with a different compiler, so perhaps it could read something
#   like this:
#
#     #ifdef _MSC_VER
#     #include <mylib/_msvc.h>
#     #else
#     #include <mylib/_config.h>
#     #endif
#     #ifndef _testpkg_const
#     #define _testpkg_const const
#     #endif
#
# LICENSE
#
#   Copyright (c) 2008 Guido U. Draheim <guidod@gmx.de>
#   Copyright (c) 2008 Marten Svantesson
#   Copyright (c) 2008 Gerald Point <Gerald.Point@labri.fr>
#
#   This program is free software; you can redistribute it and/or modify it
#   under the terms of the GNU General Public License as published by the
#   Free Software Foundation; either version 3 of the License, or (at your
#   option) any later version.
#
#   This program is distributed in the hope that it will be useful, but
#   WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
#   Public License for more details.
#
#   You should have received a copy of the GNU General Public License along
#   with this program. If not, see <http://www.gnu.org/licenses/>.
#
#   As a special exception, the respective Autoconf Macro's copyright owner
#   gives unlimited permission to copy, distribute and modify the configure
#   scripts that are the output of Autoconf when processing the Macro. You
#   need not follow the terms of the GNU General Public License when using
#   or distributing such scripts, even though portions of the text of the
#   Macro appear in them. The GNU General Public License (GPL) does govern
#   all other use of the material that constitutes the Autoconf Macro.
#
#   This special exception to the GPL applies to versions of the Autoconf
#   Macro released by the Autoconf Archive. When you make and distribute a
#   modified version of the Autoconf Macro, you may extend this special
#   exception to the GPL to apply to your modified version as well.

#serial 11

AC_DEFUN([AX_PREFIX_CONFIG_H],[dnl
AC_PREREQ([2.62])
AC_BEFORE([AC_CONFIG_HEADERS],[$0])dnl
AC_CONFIG_COMMANDS([ifelse($1,,$PACKAGE-config.h,$1)],[dnl
AS_VAR_PUSHDEF([_OUT],[ac_prefix_conf_OUT])dnl
AS_VAR_PUSHDEF([_DEF],[ac_prefix_conf_DEF])dnl
AS_VAR_PUSHDEF([_PKG],[ac_prefix_conf_PKG])dnl
AS_VAR_PUSHDEF([_LOW],[ac_prefix_conf_LOW])dnl
AS_VAR_PUSHDEF([_UPP],[ac_prefix_conf_UPP])dnl
AS_VAR_PUSHDEF([_INP],[ac_prefix_conf_INP])dnl
m4_pushdef([_script],[conftest.prefix])dnl
m4_pushdef([_symbol],[m4_cr_Letters[]m4_cr_digits[]_])dnl
_OUT=`echo ifelse($1, , $PACKAGE-config.h, $1)`
_DEF=`echo _$_OUT | sed -e "y:m4_cr_letters:m4_cr_LETTERS[]:" -e "s/@<:@^m4_cr_Letters@:>@/_/g"`
_PKG=`echo ifelse($2, , $PACKAGE, $2)`
_LOW=`echo _$_PKG | sed -e "y:m4_cr_LETTERS-:m4_cr_letters[]_:"`
_UPP=`echo $_PKG | sed -e "y:m4_cr_letters-:m4_cr_LETTERS[]_:"  -e "/^@<:@m4_cr_digits@:>@/s/^/_/"`
_INP=`echo "ifelse($3,,,$3)" | sed -e 's/ *//'`
if test ".$_INP" = "."; then
   for ac_file in : $CONFIG_HEADERS; do test "_$ac_file" = _: && continue
     case "$ac_file" in
        *.h) _INP=$ac_file ;;
        *)
     esac
     test ".$_INP" != "." && break
   done
fi
if test ".$_INP" = "."; then
   case "$_OUT" in
      */*) _INP=`basename "$_OUT"`
      ;;
      *-*) _INP=`echo "$_OUT" | sed -e "s/@<:@_symbol@:>@*-//"`
      ;;
      *) _INP=config.h
      ;;
   esac
fi
if test -z "$_PKG" ; then
   AC_MSG_ERROR([no prefix for _PREFIX_PKG_CONFIG_H])
else
  if test ! -f "$_INP" ; then if test -f "$srcdir/$_INP" ; then
     _INP="$srcdir/$_INP"
  fi fi
  AC_MSG_NOTICE(creating $_OUT - prefix $_UPP for $_INP defines)
  if test -f $_INP ; then
    AS_ECHO(["s/^@%:@undef  *\\(@<:@m4_cr_LETTERS[]_@:>@\\)/@%:@undef $_UPP""_\\1/"]) > _script
    AS_ECHO(["s/^@%:@undef  *\\(@<:@m4_cr_letters@:>@\\)/@%:@undef $_LOW""_\\1/"]) >> _script
    AS_ECHO(["s/^@%:@def[]ine  *\\(@<:@m4_cr_LETTERS[]_@:>@@<:@_symbol@:>@*\\)\\(.*\\)/@%:@ifndef $_UPP""_\\1\\"]) >> _script
    AS_ECHO(["@%:@def[]ine $_UPP""_\\1\\2\\"]) >> _script
    AS_ECHO(["@%:@endif/"]) >> _script
    AS_ECHO(["s/^@%:@def[]ine  *\\(@<:@m4_cr_letters@:>@@<:@_symbol@:>@*\\)\\(.*\\)/@%:@ifndef $_LOW""_\\1\\"]) >> _script
    AS_ECHO(["@%:@define $_LOW""_\\1\\2\\"]) >> _script
    AS_ECHO(["@%:@endif/"]) >> _script
    # now executing _script on _DEF input to create _OUT output file
    echo "@%:@ifndef $_DEF"      >$tmp/pconfig.h
    echo "@%:@def[]ine $_DEF 1" >>$tmp/pconfig.h
    echo ' ' >>$tmp/pconfig.h
    echo /'*' $_OUT. Generated automatically at end of configure. '*'/ >>$tmp/pconfig.h

    sed -f _script $_INP >>$tmp/pconfig.h
    echo ' ' >>$tmp/pconfig.h
    echo '/* once:' $_DEF '*/' >>$tmp/pconfig.h
    echo "@%:@endif" >>$tmp/pconfig.h
    if cmp -s $_OUT $tmp/pconfig.h 2>/dev/null; then
      AC_MSG_NOTICE([$_OUT is unchanged])
    else
      ac_dir=`AS_DIRNAME(["$_OUT"])`
      AS_MKDIR_P(["$ac_dir"])
      rm -f "$_OUT"
      mv $tmp/pconfig.h "$_OUT"
    fi
    cp _script _configs.sed
  else
    AC_MSG_ERROR([input file $_INP does not exist - skip generating $_OUT])
  fi
  rm -f conftest.*
fi
m4_popdef([_symbol])dnl
m4_popdef([_script])dnl
AS_VAR_POPDEF([_INP])dnl
AS_VAR_POPDEF([_UPP])dnl
AS_VAR_POPDEF([_LOW])dnl
AS_VAR_POPDEF([_PKG])dnl
AS_VAR_POPDEF([_DEF])dnl
AS_VAR_POPDEF([_OUT])dnl
],[PACKAGE="$PACKAGE"])])