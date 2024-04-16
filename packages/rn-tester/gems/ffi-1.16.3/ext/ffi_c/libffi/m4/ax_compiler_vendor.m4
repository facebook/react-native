# ===========================================================================
#    https://www.gnu.org/software/autoconf-archive/ax_compiler_vendor.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_COMPILER_VENDOR
#
# DESCRIPTION
#
#   Determine the vendor of the C, C++ or Fortran compiler.  The vendor is
#   returned in the cache variable $ax_cv_c_compiler_vendor for C,
#   $ax_cv_cxx_compiler_vendor for C++ or $ax_cv_fc_compiler_vendor for
#   (modern) Fortran.  The value is one of "intel", "ibm", "pathscale",
#   "clang" (LLVM), "cray", "fujitsu", "sdcc", "sx", "nvhpc" (NVIDIA HPC
#   Compiler), "portland" (PGI), "gnu" (GCC), "sun" (Oracle Developer
#   Studio), "hp", "dec", "borland", "comeau", "kai", "lcc", "sgi",
#   "microsoft", "metrowerks", "watcom", "tcc" (Tiny CC) or "unknown" (if
#   the compiler cannot be determined).
#
#   To check for a Fortran compiler, you must first call AC_FC_PP_SRCEXT
#   with an appropriate preprocessor-enabled extension.  For example:
#
#     AC_LANG_PUSH([Fortran])
#     AC_PROG_FC
#     AC_FC_PP_SRCEXT([F])
#     AX_COMPILER_VENDOR
#     AC_LANG_POP([Fortran])
#
# LICENSE
#
#   Copyright (c) 2008 Steven G. Johnson <stevenj@alum.mit.edu>
#   Copyright (c) 2008 Matteo Frigo
#   Copyright (c) 2018-19 John Zaitseff <J.Zaitseff@zap.org.au>
#
#   This program is free software: you can redistribute it and/or modify it
#   under the terms of the GNU General Public License as published by the
#   Free Software Foundation, either version 3 of the License, or (at your
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

#serial 32

AC_DEFUN([AX_COMPILER_VENDOR], [dnl
    AC_CACHE_CHECK([for _AC_LANG compiler vendor], ax_cv_[]_AC_LANG_ABBREV[]_compiler_vendor, [dnl
	dnl  If you modify this list of vendors, please add similar support
	dnl  to ax_compiler_version.m4 if at all possible.
	dnl
	dnl  Note: Do NOT check for GCC first since some other compilers
	dnl  define __GNUC__ to remain compatible with it.  Compilers that
	dnl  are very slow to start (such as Intel) are listed first.

	vendors="
		intel:		__ICC,__ECC,__INTEL_COMPILER
		ibm:		__xlc__,__xlC__,__IBMC__,__IBMCPP__,__ibmxl__
		pathscale:	__PATHCC__,__PATHSCALE__
		clang:		__clang__
		cray:		_CRAYC
		fujitsu:	__FUJITSU
		sdcc:		SDCC,__SDCC
		sx:		_SX
		nvhpc:		__NVCOMPILER
		portland:	__PGI
		gnu:		__GNUC__
		sun:		__SUNPRO_C,__SUNPRO_CC,__SUNPRO_F90,__SUNPRO_F95
		hp:		__HP_cc,__HP_aCC
		dec:		__DECC,__DECCXX,__DECC_VER,__DECCXX_VER
		borland:	__BORLANDC__,__CODEGEARC__,__TURBOC__
		comeau:		__COMO__
		kai:		__KCC
		lcc:		__LCC__
		sgi:		__sgi,sgi
		microsoft:	_MSC_VER
		metrowerks:	__MWERKS__
		watcom:		__WATCOMC__
		tcc:		__TINYC__
		unknown:	UNKNOWN
	"
	for ventest in $vendors; do
	    case $ventest in
		*:)
		    vendor=$ventest
		    continue
		    ;;
		*)
		    vencpp="defined("`echo $ventest | sed 's/,/) || defined(/g'`")"
		    ;;
	    esac

	    AC_COMPILE_IFELSE([AC_LANG_PROGRAM([], [[
#if !($vencpp)
      thisisanerror;
#endif
	    ]])], [break])
	done

	ax_cv_[]_AC_LANG_ABBREV[]_compiler_vendor=`echo $vendor | cut -d: -f1`
    ])
])dnl
