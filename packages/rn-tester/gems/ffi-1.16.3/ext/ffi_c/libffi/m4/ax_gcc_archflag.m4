# ===========================================================================
#     https://www.gnu.org/software/autoconf-archive/ax_gcc_archflag.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_GCC_ARCHFLAG([PORTABLE?], [ACTION-SUCCESS], [ACTION-FAILURE])
#
# DESCRIPTION
#
#   This macro tries to guess the "native" arch corresponding to the target
#   architecture for use with gcc's -march=arch or -mtune=arch flags. If
#   found, the cache variable $ax_cv_gcc_archflag is set to this flag and
#   ACTION-SUCCESS is executed; otherwise $ax_cv_gcc_archflag is set to
#   "unknown" and ACTION-FAILURE is executed. The default ACTION-SUCCESS is
#   to add $ax_cv_gcc_archflag to the end of $CFLAGS.
#
#   PORTABLE? should be either [yes] (default) or [no]. In the former case,
#   the flag is set to -mtune (or equivalent) so that the architecture is
#   only used for tuning, but the instruction set used is still portable. In
#   the latter case, the flag is set to -march (or equivalent) so that
#   architecture-specific instructions are enabled.
#
#   The user can specify --with-gcc-arch=<arch> in order to override the
#   macro's choice of architecture, or --without-gcc-arch to disable this.
#
#   When cross-compiling, or if $CC is not gcc, then ACTION-FAILURE is
#   called unless the user specified --with-gcc-arch manually.
#
#   Requires macros: AX_CHECK_COMPILE_FLAG, AX_GCC_X86_CPUID
#
#   (The main emphasis here is on recent CPUs, on the principle that doing
#   high-performance computing on old hardware is uncommon.)
#
# LICENSE
#
#   Copyright (c) 2008 Steven G. Johnson <stevenj@alum.mit.edu>
#   Copyright (c) 2008 Matteo Frigo
#   Copyright (c) 2014 Tsukasa Oi
#   Copyright (c) 2017-2018 Alexey Kopytov
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

AC_DEFUN([AX_GCC_ARCHFLAG],
[AC_REQUIRE([AC_PROG_CC])
AC_REQUIRE([AC_CANONICAL_HOST])
AC_REQUIRE([AC_PROG_SED])
AC_REQUIRE([AX_COMPILER_VENDOR])

AC_ARG_WITH(gcc-arch, [AS_HELP_STRING([--with-gcc-arch=<arch>], [use architecture <arch> for gcc -march/-mtune, instead of guessing])],
	ax_gcc_arch=$withval, ax_gcc_arch=yes)

AC_MSG_CHECKING([for gcc architecture flag])
AC_MSG_RESULT([])
AC_CACHE_VAL(ax_cv_gcc_archflag,
[
ax_cv_gcc_archflag="unknown"

if test "$GCC" = yes; then

if test "x$ax_gcc_arch" = xyes; then
ax_gcc_arch=""
if test "$cross_compiling" = no; then
case $host_cpu in
  i[[3456]]86*|x86_64*|amd64*) # use cpuid codes
     AX_GCC_X86_CPUID(0)
     AX_GCC_X86_CPUID(1)
     case $ax_cv_gcc_x86_cpuid_0 in
       *:756e6547:6c65746e:49656e69) # Intel
          case $ax_cv_gcc_x86_cpuid_1 in
	    *5[[4578]]?:*:*:*) ax_gcc_arch="pentium-mmx pentium" ;;
	    *5[[123]]?:*:*:*) ax_gcc_arch=pentium ;;
	    *0?61?:*:*:*|?61?:*:*:*|61?:*:*:*) ax_gcc_arch=pentiumpro ;;
	    *0?6[[356]]?:*:*:*|?6[[356]]?:*:*:*|6[[356]]?:*:*:*) ax_gcc_arch="pentium2 pentiumpro" ;;
	    *0?6[[78ab]]?:*:*:*|?6[[78ab]]?:*:*:*|6[[78ab]]?:*:*:*) ax_gcc_arch="pentium3 pentiumpro" ;;
	    *0?6[[9d]]?:*:*:*|?6[[9d]]?:*:*:*|6[[9d]]?:*:*:*|*1?65?:*:*:*) ax_gcc_arch="pentium-m pentium3 pentiumpro" ;;
	    *0?6e?:*:*:*|?6e?:*:*:*|6e?:*:*:*) ax_gcc_arch="yonah pentium-m pentium3 pentiumpro" ;;
	    *0?6f?:*:*:*|?6f?:*:*:*|6f?:*:*:*|*1?66?:*:*:*) ax_gcc_arch="core2 pentium-m pentium3 pentiumpro" ;;
	    *1?6[[7d]]?:*:*:*) ax_gcc_arch="penryn core2 pentium-m pentium3 pentiumpro" ;;
	    *1?6[[aef]]?:*:*:*|*2?6e?:*:*:*) ax_gcc_arch="nehalem corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *2?6[[5cf]]?:*:*:*) ax_gcc_arch="westmere corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *2?6[[ad]]?:*:*:*) ax_gcc_arch="sandybridge corei7-avx corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *3?6[[ae]]?:*:*:*) ax_gcc_arch="ivybridge core-avx-i corei7-avx corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *3?6[[cf]]?:*:*:*|*4?6[[56]]?:*:*:*) ax_gcc_arch="haswell core-avx2 core-avx-i corei7-avx corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *3?6d?:*:*:*|*4?6[[7f]]?:*:*:*|*5?66?:*:*:*) ax_gcc_arch="broadwell core-avx2 core-avx-i corei7-avx corei7 core2 pentium-m pentium3 pentiumpro" ;;
	    *1?6c?:*:*:*|*2?6[[67]]?:*:*:*|*3?6[[56]]?:*:*:*) ax_gcc_arch="bonnell atom core2 pentium-m pentium3 pentiumpro" ;;
	    *3?67?:*:*:*|*[[45]]?6[[ad]]?:*:*:*) ax_gcc_arch="silvermont atom core2 pentium-m pentium3 pentiumpro" ;;
	    *000?f[[012]]?:*:*:*|?f[[012]]?:*:*:*|f[[012]]?:*:*:*) ax_gcc_arch="pentium4 pentiumpro" ;;
	    *000?f[[346]]?:*:*:*|?f[[346]]?:*:*:*|f[[346]]?:*:*:*) ax_gcc_arch="nocona prescott pentium4 pentiumpro" ;;
	    # fallback
	    *5??:*:*:*) ax_gcc_arch=pentium ;;
	    *??6??:*:*:*) ax_gcc_arch="core2 pentiumpro" ;;
	    *6??:*:*:*) ax_gcc_arch=pentiumpro ;;
	    *00??f??:*:*:*|??f??:*:*:*|?f??:*:*:*|f??:*:*:*) ax_gcc_arch="pentium4 pentiumpro" ;;
          esac ;;
       *:68747541:444d4163:69746e65) # AMD
          case $ax_cv_gcc_x86_cpuid_1 in
	    *5[[67]]?:*:*:*) ax_gcc_arch=k6 ;;
	    *5[[8]]?:*:*:*) ax_gcc_arch="k6-2 k6" ;;
	    *5[[9d]]?:*:*:*) ax_gcc_arch="k6-3 k6" ;;
	    *6[[12]]?:*:*:*) ax_gcc_arch="athlon k7" ;;
	    *6[[34]]?:*:*:*) ax_gcc_arch="athlon-tbird k7" ;;
	    *6[[678a]]?:*:*:*) ax_gcc_arch="athlon-xp athlon-4 athlon k7" ;;
	    *000?f[[4578bcef]]?:*:*:*|?f[[4578bcef]]?:*:*:*|f[[4578bcef]]?:*:*:*|*001?f[[4578bcf]]?:*:*:*|1?f[[4578bcf]]?:*:*:*) ax_gcc_arch="athlon64 k8" ;;
	    *002?f[[13457bcf]]?:*:*:*|2?f[[13457bcf]]?:*:*:*|*004?f[[138bcf]]?:*:*:*|4?f[[138bcf]]?:*:*:*|*005?f[[df]]?:*:*:*|5?f[[df]]?:*:*:*|*006?f[[8bcf]]?:*:*:*|6?f[[8bcf]]?:*:*:*|*007?f[[cf]]?:*:*:*|7?f[[cf]]?:*:*:*|*00c?f1?:*:*:*|c?f1?:*:*:*|*020?f3?:*:*:*|20?f3?:*:*:*) ax_gcc_arch="athlon64-sse3 k8-sse3 athlon64 k8" ;;
	    *010?f[[245689a]]?:*:*:*|10?f[[245689a]]?:*:*:*|*030?f1?:*:*:*|30?f1?:*:*:*) ax_gcc_arch="barcelona amdfam10 k8" ;;
	    *050?f[[12]]?:*:*:*|50?f[[12]]?:*:*:*) ax_gcc_arch="btver1 amdfam10 k8" ;;
	    *060?f1?:*:*:*|60?f1?:*:*:*) ax_gcc_arch="bdver1 amdfam10 k8" ;;
	    *060?f2?:*:*:*|60?f2?:*:*:*|*061?f[[03]]?:*:*:*|61?f[[03]]?:*:*:*) ax_gcc_arch="bdver2 bdver1 amdfam10 k8" ;;
	    *063?f0?:*:*:*|63?f0?:*:*:*) ax_gcc_arch="bdver3 bdver2 bdver1 amdfam10 k8" ;;
	    *07[[03]]?f0?:*:*:*|7[[03]]?f0?:*:*:*) ax_gcc_arch="btver2 btver1 amdfam10 k8" ;;
	    # fallback
	    *0[[13]]??f??:*:*:*|[[13]]??f??:*:*:*) ax_gcc_arch="barcelona amdfam10 k8" ;;
	    *020?f??:*:*:*|20?f??:*:*:*) ax_gcc_arch="athlon64-sse3 k8-sse3 athlon64 k8" ;;
	    *05??f??:*:*:*|5??f??:*:*:*) ax_gcc_arch="btver1 amdfam10 k8" ;;
	    *060?f??:*:*:*|60?f??:*:*:*) ax_gcc_arch="bdver1 amdfam10 k8" ;;
	    *061?f??:*:*:*|61?f??:*:*:*) ax_gcc_arch="bdver2 bdver1 amdfam10 k8" ;;
	    *06??f??:*:*:*|6??f??:*:*:*) ax_gcc_arch="bdver3 bdver2 bdver1 amdfam10 k8" ;;
	    *070?f??:*:*:*|70?f??:*:*:*) ax_gcc_arch="btver2 btver1 amdfam10 k8" ;;
	    *???f??:*:*:*) ax_gcc_arch="amdfam10 k8" ;;
          esac ;;
	*:746e6543:736c7561:48727561) # IDT / VIA (Centaur)
	   case $ax_cv_gcc_x86_cpuid_1 in
	     *54?:*:*:*) ax_gcc_arch=winchip-c6 ;;
	     *5[[89]]?:*:*:*) ax_gcc_arch=winchip2 ;;
	     *66?:*:*:*) ax_gcc_arch=winchip2 ;;
	     *6[[78]]?:*:*:*) ax_gcc_arch=c3 ;;
	     *6[[9adf]]?:*:*:*) ax_gcc_arch="c3-2 c3" ;;
	   esac ;;
     esac
     if test x"$ax_gcc_arch" = x; then # fallback
	case $host_cpu in
	  i586*) ax_gcc_arch=pentium ;;
	  i686*) ax_gcc_arch=pentiumpro ;;
        esac
     fi
     ;;

  sparc*)
     AC_PATH_PROG([PRTDIAG], [prtdiag], [prtdiag], [$PATH:/usr/platform/`uname -i`/sbin/:/usr/platform/`uname -m`/sbin/])
     cputype=`(((grep cpu /proc/cpuinfo | cut -d: -f2) ; ($PRTDIAG -v |grep -i sparc) ; grep -i cpu /var/run/dmesg.boot ) | head -n 1) 2> /dev/null`
     cputype=`echo "$cputype" | tr -d ' -' | $SED 's/SPARCIIi/SPARCII/' |tr $as_cr_LETTERS $as_cr_letters`
     case $cputype in
         *ultrasparciv*) ax_gcc_arch="ultrasparc4 ultrasparc3 ultrasparc v9" ;;
         *ultrasparciii*) ax_gcc_arch="ultrasparc3 ultrasparc v9" ;;
         *ultrasparc*) ax_gcc_arch="ultrasparc v9" ;;
         *supersparc*|*tms390z5[[05]]*) ax_gcc_arch="supersparc v8" ;;
         *hypersparc*|*rt62[[056]]*) ax_gcc_arch="hypersparc v8" ;;
         *cypress*) ax_gcc_arch=cypress ;;
     esac ;;

  alphaev5) ax_gcc_arch=ev5 ;;
  alphaev56) ax_gcc_arch=ev56 ;;
  alphapca56) ax_gcc_arch="pca56 ev56" ;;
  alphapca57) ax_gcc_arch="pca57 pca56 ev56" ;;
  alphaev6) ax_gcc_arch=ev6 ;;
  alphaev67) ax_gcc_arch=ev67 ;;
  alphaev68) ax_gcc_arch="ev68 ev67" ;;
  alphaev69) ax_gcc_arch="ev69 ev68 ev67" ;;
  alphaev7) ax_gcc_arch="ev7 ev69 ev68 ev67" ;;
  alphaev79) ax_gcc_arch="ev79 ev7 ev69 ev68 ev67" ;;

  powerpc*)
     cputype=`((grep cpu /proc/cpuinfo | head -n 1 | cut -d: -f2 | cut -d, -f1 | $SED 's/ //g') ; /usr/bin/machine ; /bin/machine; grep CPU /var/run/dmesg.boot | head -n 1 | cut -d" " -f2) 2> /dev/null`
     cputype=`echo $cputype | $SED -e 's/ppc//g;s/ *//g'`
     case $cputype in
       *750*) ax_gcc_arch="750 G3" ;;
       *740[[0-9]]*) ax_gcc_arch="$cputype 7400 G4" ;;
       *74[[4-5]][[0-9]]*) ax_gcc_arch="$cputype 7450 G4" ;;
       *74[[0-9]][[0-9]]*) ax_gcc_arch="$cputype G4" ;;
       *970*) ax_gcc_arch="970 G5 power4";;
       *POWER4*|*power4*|*gq*) ax_gcc_arch="power4 970";;
       *POWER5*|*power5*|*gr*|*gs*) ax_gcc_arch="power5 power4 970";;
       603ev|8240) ax_gcc_arch="$cputype 603e 603";;
       *POWER7*) ax_gcc_arch="power7";;
       *POWER8*) ax_gcc_arch="power8";;
       *POWER9*) ax_gcc_arch="power9";;
       *POWER10*) ax_gcc_arch="power10";;
       *) ax_gcc_arch=$cputype ;;
     esac
     ax_gcc_arch="$ax_gcc_arch powerpc"
     ;;
  aarch64)
     cpuimpl=`grep 'CPU implementer' /proc/cpuinfo 2> /dev/null | cut -d: -f2 | tr -d " " | head -n 1`
     cpuarch=`grep 'CPU architecture' /proc/cpuinfo 2> /dev/null | cut -d: -f2 | tr -d " " | head -n 1`
     cpuvar=`grep 'CPU variant' /proc/cpuinfo 2> /dev/null | cut -d: -f2 | tr -d " " | head -n 1`
     case $cpuimpl in
       0x42) case $cpuarch in
               8) case $cpuvar in
                    0x0) ax_gcc_arch="thunderx2t99 vulcan armv8.1-a armv8-a+lse armv8-a native" ;;
                  esac
                  ;;
             esac
             ;;
       0x43) case $cpuarch in
               8) case $cpuvar in
                    0x0) ax_gcc_arch="thunderx armv8-a native" ;;
                    0x1) ax_gcc_arch="thunderx+lse armv8.1-a armv8-a+lse armv8-a native" ;;
                  esac
                  ;;
             esac
             ;;
      esac
      ;;
esac
fi # not cross-compiling
fi # guess arch

if test "x$ax_gcc_arch" != x -a "x$ax_gcc_arch" != xno; then
if test "x[]m4_default([$1],yes)" = xyes; then # if we require portable code
  flag_prefixes="-mtune="
  if test "x$ax_cv_[]_AC_LANG_ABBREV[]_compiler_vendor" = xclang; then flag_prefixes="-march="; fi
  # -mcpu=$arch and m$arch generate nonportable code on every arch except
  # x86.  And some other arches (e.g. Alpha) don't accept -mtune.  Grrr.
  case $host_cpu in i*86|x86_64*|amd64*) flag_prefixes="$flag_prefixes -mcpu= -m";; esac
else
  flag_prefixes="-march= -mcpu= -m"
fi
for flag_prefix in $flag_prefixes; do
  for arch in $ax_gcc_arch; do
    flag="$flag_prefix$arch"
    AX_CHECK_COMPILE_FLAG($flag, [if test "x$ax_cv_[]_AC_LANG_ABBREV[]_compiler_vendor" = xclang; then
      if test "x[]m4_default([$1],yes)" = xyes; then
	if test "x$flag" = "x-march=$arch"; then flag=-mtune=$arch; fi
      fi
    fi; ax_cv_gcc_archflag=$flag; break])
  done
  test "x$ax_cv_gcc_archflag" = xunknown || break
done
fi

fi # $GCC=yes
])
AC_MSG_CHECKING([for gcc architecture flag])
AC_MSG_RESULT($ax_cv_gcc_archflag)
if test "x$ax_cv_gcc_archflag" = xunknown; then
  m4_default([$3],:)
else
  m4_default([$2], [CFLAGS="$CFLAGS $ax_cv_gcc_archflag"])
fi
])
