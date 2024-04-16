# ===========================================================================
#       https://www.gnu.org/software/autoconf-archive/ax_cc_maxopt.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_CC_MAXOPT
#
# DESCRIPTION
#
#   Try to turn on "good" C optimization flags for various compilers and
#   architectures, for some definition of "good". (In our case, good for
#   FFTW and hopefully for other scientific codes. Modify as needed.)
#
#   The user can override the flags by setting the CFLAGS environment
#   variable. The user can also specify --enable-portable-binary in order to
#   disable any optimization flags that might result in a binary that only
#   runs on the host architecture.
#
#   Note also that the flags assume that ANSI C aliasing rules are followed
#   by the code (e.g. for gcc's -fstrict-aliasing), and that floating-point
#   computations can be re-ordered as needed.
#
#   Requires macros: AX_CHECK_COMPILE_FLAG, AX_COMPILER_VENDOR,
#   AX_GCC_ARCHFLAG, AX_GCC_X86_CPUID.
#
# LICENSE
#
#   Copyright (c) 2008 Steven G. Johnson <stevenj@alum.mit.edu>
#   Copyright (c) 2008 Matteo Frigo
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

#serial 22

AC_DEFUN([AX_CC_MAXOPT],
[
AC_REQUIRE([AC_PROG_CC])
AC_REQUIRE([AX_COMPILER_VENDOR])
AC_REQUIRE([AC_CANONICAL_HOST])

AC_ARG_ENABLE(portable-binary, [AS_HELP_STRING([--enable-portable-binary], [disable compiler optimizations that would produce unportable binaries])],
	acx_maxopt_portable=$enableval, acx_maxopt_portable=no)

# Try to determine "good" native compiler flags if none specified via CFLAGS
if test "x$ac_test_CFLAGS" = "x"; then
  case $ax_cv_c_compiler_vendor in
    dec) CFLAGS="$CFLAGS -newc -w0 -O5 -ansi_alias -ansi_args -fp_reorder -tune host"
	 if test "x$acx_maxopt_portable" = xno; then
           CFLAGS="$CFLAGS -arch host"
         fi;;

    sun) CFLAGS="$CFLAGS -native -fast -xO5 -dalign"
	 if test "x$acx_maxopt_portable" = xyes; then
	   CFLAGS="$CFLAGS -xarch=generic"
         fi;;

    hp)  CFLAGS="$CFLAGS +Oall +Optrs_ansi +DSnative"
	 if test "x$acx_maxopt_portable" = xyes; then
	   CFLAGS="$CFLAGS +DAportable"
	 fi;;

    ibm) if test "x$acx_maxopt_portable" = xno; then
           xlc_opt="-qarch=auto -qtune=auto"
	 else
           xlc_opt="-qtune=auto"
	 fi
         AX_CHECK_COMPILE_FLAG($xlc_opt,
		CFLAGS="$CFLAGS -O3 -qansialias -w $xlc_opt",
               [CFLAGS="$CFLAGS -O3 -qansialias -w"
                echo "******************************************************"
                echo "*  You seem to have the IBM  C compiler.  It is      *"
                echo "*  recommended for best performance that you use:    *"
                echo "*                                                    *"
                echo "*    CFLAGS=-O3 -qarch=xxx -qtune=xxx -qansialias -w *"
                echo "*                      ^^^        ^^^                *"
                echo "*  where xxx is pwr2, pwr3, 604, or whatever kind of *"
                echo "*  CPU you have.  (Set the CFLAGS environment var.   *"
                echo "*  and re-run configure.)  For more info, man cc.    *"
                echo "******************************************************"])
         ;;

    intel) CFLAGS="$CFLAGS -O3 -ansi_alias"
	if test "x$acx_maxopt_portable" = xno; then
	  icc_archflag=unknown
	  icc_flags=""
	  case $host_cpu in
	    i686*|x86_64*)
              # icc accepts gcc assembly syntax, so these should work:
	      AX_GCC_X86_CPUID(0)
              AX_GCC_X86_CPUID(1)
	      case $ax_cv_gcc_x86_cpuid_0 in # see AX_GCC_ARCHFLAG
                *:756e6547:6c65746e:49656e69) # Intel
                  case $ax_cv_gcc_x86_cpuid_1 in
		    *0?6[[78ab]]?:*:*:*|?6[[78ab]]?:*:*:*|6[[78ab]]?:*:*:*) icc_flags="-xK" ;;
		    *0?6[[9d]]?:*:*:*|?6[[9d]]?:*:*:*|6[[9d]]?:*:*:*|*1?65?:*:*:*) icc_flags="-xSSE2 -xB -xK" ;;
		    *0?6e?:*:*:*|?6e?:*:*:*|6e?:*:*:*) icc_flags="-xSSE3 -xP -xO -xB -xK" ;;
		    *0?6f?:*:*:*|?6f?:*:*:*|6f?:*:*:*|*1?66?:*:*:*) icc_flags="-xSSSE3 -xT -xB -xK" ;;
		    *1?6[[7d]]?:*:*:*) icc_flags="-xSSE4.1 -xS -xT -xB -xK" ;;
		    *1?6[[aef]]?:*:*:*|*2?6[[5cef]]?:*:*:*) icc_flags="-xSSE4.2 -xS -xT -xB -xK" ;;
		    *2?6[[ad]]?:*:*:*) icc_flags="-xAVX -SSE4.2 -xS -xT -xB -xK" ;;
		    *3?6[[ae]]?:*:*:*) icc_flags="-xCORE-AVX-I -xAVX -SSE4.2 -xS -xT -xB -xK" ;;
		    *3?6[[cf]]?:*:*:*|*4?6[[56]]?:*:*:*) icc_flags="-xCORE-AVX2 -xCORE-AVX-I -xAVX -SSE4.2 -xS -xT -xB -xK" ;;
		    *000?f[[346]]?:*:*:*|?f[[346]]?:*:*:*|f[[346]]?:*:*:*) icc_flags="-xSSE3 -xP -xO -xN -xW -xK" ;;
		    *00??f??:*:*:*|??f??:*:*:*|?f??:*:*:*|f??:*:*:*) icc_flags="-xSSE2 -xN -xW -xK" ;;
                  esac ;;
              esac ;;
          esac
          if test "x$icc_flags" != x; then
            for flag in $icc_flags; do
              AX_CHECK_COMPILE_FLAG($flag, [icc_archflag=$flag; break])
            done
          fi
          AC_MSG_CHECKING([for icc architecture flag])
	  AC_MSG_RESULT($icc_archflag)
          if test "x$icc_archflag" != xunknown; then
            CFLAGS="$CFLAGS $icc_archflag"
          fi
        fi
	;;

    nvhpc)
     # default optimization flags for nvhpc
     CFLAGS="$CFLAGS -O3"
     ;;

    gnu)
     # default optimization flags for gcc on all systems
     CFLAGS="$CFLAGS -O3 -fomit-frame-pointer"

     # -malign-double for x86 systems
     # LIBFFI_LOCAL: don't do this.
     # The testsuite doesn't use these flags and we'll get test failures.
     # AX_CHECK_COMPILE_FLAG(-malign-double, CFLAGS="$CFLAGS -malign-double")

     #  -fstrict-aliasing for gcc-2.95+
     AX_CHECK_COMPILE_FLAG(-fstrict-aliasing,
	CFLAGS="$CFLAGS -fstrict-aliasing")

     # note that we enable "unsafe" fp optimization with other compilers, too
     AX_CHECK_COMPILE_FLAG(-ffast-math, CFLAGS="$CFLAGS -ffast-math")

     AX_GCC_ARCHFLAG($acx_maxopt_portable)
     ;;

    microsoft)
     # default optimization flags for MSVC opt builds
     CFLAGS="$CFLAGS -O2"
     ;;
  esac

  if test -z "$CFLAGS"; then
	echo ""
	echo "********************************************************"
        echo "* WARNING: Don't know the best CFLAGS for this system  *"
        echo "* Use ./configure CFLAGS=... to specify your own flags *"
	echo "* (otherwise, a default of CFLAGS=-O3 will be used)    *"
	echo "********************************************************"
	echo ""
        CFLAGS="$CFLAGS -O3"
  fi

  AX_CHECK_COMPILE_FLAG($CFLAGS, [], [
	echo ""
        echo "********************************************************"
        echo "* WARNING: The guessed CFLAGS don't seem to work with  *"
        echo "* your compiler.                                       *"
        echo "* Use ./configure CFLAGS=... to specify your own flags *"
        echo "********************************************************"
        echo ""
  ])

fi
])
