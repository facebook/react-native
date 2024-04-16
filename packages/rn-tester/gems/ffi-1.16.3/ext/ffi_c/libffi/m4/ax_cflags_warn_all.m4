# ===========================================================================
#    https://www.gnu.org/software/autoconf-archive/ax_cflags_warn_all.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_CFLAGS_WARN_ALL   [(shellvar[, default[, action-if-found[, action-if-not-found]]])]
#   AX_CXXFLAGS_WARN_ALL [(shellvar[, default[, action-if-found[, action-if-not-found]]])]
#   AX_FCFLAGS_WARN_ALL  [(shellvar[, default[, action-if-found[, action-if-not-found]]])]
#
# DESCRIPTION
#
#   Specify compiler options that enable most reasonable warnings.  For the
#   GNU Compiler Collection (GCC), for example, it will be "-Wall".  The
#   result is added to shellvar, one of CFLAGS, CXXFLAGS or FCFLAGS if the
#   first parameter is not specified.
#
#   Each of these macros accepts the following optional arguments:
#
#     - $1 - shellvar
#         shell variable to use (CFLAGS, CXXFLAGS or FCFLAGS if not
#         specified, depending on macro)
#
#     - $2 - default
#         value to use for flags if compiler vendor cannot be determined (by
#         default, "")
#
#     - $3 - action-if-found
#         action to take if the compiler vendor has been successfully
#         determined (by default, add the appropriate compiler flags to
#         shellvar)
#
#     - $4 - action-if-not-found
#         action to take if the compiler vendor has not been determined or
#         is unknown (by default, add the default flags, or "" if not
#         specified, to shellvar)
#
#   These macros use AX_COMPILER_VENDOR to determine which flags should be
#   returned for a given compiler.  Not all compilers currently have flags
#   defined for them; patches are welcome.  If need be, compiler flags may
#   be made language-dependent: use a construct like the following:
#
#     [vendor_name], [m4_if(_AC_LANG_PREFIX,[C],   VAR="--relevant-c-flags",dnl
#                     m4_if(_AC_LANG_PREFIX,[CXX], VAR="--relevant-c++-flags",dnl
#                     m4_if(_AC_LANG_PREFIX,[FC],  VAR="--relevant-fortran-flags",dnl
#                     VAR="$2"; FOUND="no")))],
#
#   Note: These macros also depend on AX_PREPEND_FLAG.
#
# LICENSE
#
#   Copyright (c) 2008 Guido U. Draheim <guidod@gmx.de>
#   Copyright (c) 2010 Rhys Ulerich <rhys.ulerich@gmail.com>
#   Copyright (c) 2018 John Zaitseff <J.Zaitseff@zap.org.au>
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
#   with this program. If not, see <https://www.gnu.org/licenses/>.
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

#serial 25

AC_DEFUN([AX_FLAGS_WARN_ALL], [
    AX_REQUIRE_DEFINED([AX_PREPEND_FLAG])dnl
    AC_REQUIRE([AX_COMPILER_VENDOR])dnl

    AS_VAR_PUSHDEF([FLAGS], [m4_default($1,_AC_LANG_PREFIX[]FLAGS)])dnl
    AS_VAR_PUSHDEF([VAR],   [ac_cv_[]_AC_LANG_ABBREV[]flags_warn_all])dnl
    AS_VAR_PUSHDEF([FOUND], [ac_save_[]_AC_LANG_ABBREV[]flags_warn_all_found])dnl

    AC_CACHE_CHECK([FLAGS for most reasonable warnings], VAR, [
	VAR=""
	FOUND="yes"
	dnl  Cases are listed in the order found in ax_compiler_vendor.m4
	AS_CASE("$ax_cv_[]_AC_LANG_ABBREV[]_compiler_vendor",
	    [intel],		[VAR="-w2"],
	    [ibm],		[VAR="-qsrcmsg -qinfo=all:noppt:noppc:noobs:nocnd"],
	    [pathscale],	[],
	    [clang],		[VAR="-Wall"],
	    [cray],		[VAR="-h msglevel 2"],
	    [fujitsu],		[],
	    [sdcc],		[],
	    [sx],		[VAR="-pvctl[,]fullmsg"],
	    [portland],		[],
	    [gnu],		[VAR="-Wall"],
	    [sun],		[VAR="-v"],
	    [hp],		[VAR="+w1"],
	    [dec],		[VAR="-verbose -w0 -warnprotos"],
	    [borland],		[],
	    [comeau],		[],
	    [kai],		[],
	    [lcc],		[],
	    [sgi],		[VAR="-fullwarn"],
	    [microsoft],	[],
	    [metrowerks],	[],
	    [watcom],		[],
	    [tcc],		[],
	    [unknown],		[
				    VAR="$2"
				    FOUND="no"
				],
				[
				    AC_MSG_WARN([Unknown compiler vendor returned by [AX_COMPILER_VENDOR]])
				    VAR="$2"
				    FOUND="no"
				]
	)

	AS_IF([test "x$FOUND" = "xyes"], [dnl
	    m4_default($3, [AS_IF([test "x$VAR" != "x"], [AX_PREPEND_FLAG([$VAR], [FLAGS])])])
	], [dnl
	    m4_default($4, [m4_ifval($2, [AX_PREPEND_FLAG([$VAR], [FLAGS])], [true])])
	])dnl
    ])dnl

    AS_VAR_POPDEF([FOUND])dnl
    AS_VAR_POPDEF([VAR])dnl
    AS_VAR_POPDEF([FLAGS])dnl
])dnl AX_FLAGS_WARN_ALL

AC_DEFUN([AX_CFLAGS_WARN_ALL], [dnl
    AC_LANG_PUSH([C])
    AX_FLAGS_WARN_ALL([$1], [$2], [$3], [$4])
    AC_LANG_POP([C])
])dnl

AC_DEFUN([AX_CXXFLAGS_WARN_ALL], [dnl
    AC_LANG_PUSH([C++])
    AX_FLAGS_WARN_ALL([$1], [$2], [$3], [$4])
    AC_LANG_POP([C++])
])dnl

AC_DEFUN([AX_FCFLAGS_WARN_ALL], [dnl
    AC_LANG_PUSH([Fortran])
    AX_FLAGS_WARN_ALL([$1], [$2], [$3], [$4])
    AC_LANG_POP([Fortran])
])dnl
