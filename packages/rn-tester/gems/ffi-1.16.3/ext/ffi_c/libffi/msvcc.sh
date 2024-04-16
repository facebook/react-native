#!/bin/sh

# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is the MSVC wrappificator.
#
# The Initial Developer of the Original Code is
# Timothy Wall <twalljava@dev.java.net>.
# Portions created by the Initial Developer are Copyright (C) 2009
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   Daniel Witte <dwitte@mozilla.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

#
# GCC-compatible wrapper for cl.exe and ml.exe. Arguments are given in GCC
# format and translated into something sensible for cl or ml.
#

args_orig=$@
args="-nologo -W3"
linkargs=
static_crt=
debug_crt=
cl="cl"
ml="ml"
safeseh="-safeseh"
output=
libpaths=
libversion=8
verbose=

while [ $# -gt 0 ]
do
  case $1
  in
    --verbose)
      verbose=1
      shift 1
    ;;
    --version)
      args="-help"
      shift 1
    ;;
    -fexceptions)
      # Don't enable exceptions for now.
      #args="$args -EHac"
      shift 1
    ;;
    -m32)
      shift 1
    ;;
    -m64)
      ml="ml64" # "$MSVC/x86_amd64/ml64"
      safeseh=
      shift 1
    ;;
    -marm)
      ml='armasm'
      safeseh=
      shift 1
    ;;
    -marm64)
      ml='armasm64'
      safeseh=
      shift 1
    ;;
    -clang-cl)
      cl="clang-cl"
      shift 1
    ;;
    -O0)
      args="$args -Od"
      shift 1
    ;;
    -O*)
      # Runtime error checks (enabled by setting -RTC1 in the -DFFI_DEBUG
      # case below) are not compatible with optimization flags and will
      # cause the build to fail. Therefore, drop the optimization flag if
      # -DFFI_DEBUG is also set.
      case $args_orig in
        *-DFFI_DEBUG*)
          args="$args"
        ;;
        *)
          # The ax_cc_maxopt.m4 macro from the upstream autoconf-archive
          # project doesn't support MSVC and therefore ends up trying to
          # use -O3. Use the equivalent "max optimization" flag for MSVC
          # instead of erroring out.
          case $1 in
            -O3)
              args="$args -O2"
            ;;
            *)
              args="$args $1"
            ;;
          esac
          opt="true"
        ;;
      esac
      shift 1
    ;;
    -g)
      # Enable debug symbol generation.
      args="$args -Zi"
      shift 1
    ;;
    -DFFI_DEBUG)
      # Enable runtime error checks.
      args="$args -RTC1"
      defines="$defines $1"
      shift 1
    ;;
    -DUSE_STATIC_RTL)
      # Link against static CRT.
      static_crt=1
      shift 1
    ;;
    -DUSE_DEBUG_RTL)
      # Link against debug CRT.
      debug_crt=1
      shift 1
    ;;
    -c)
      args="$args -c"
      args="$(echo $args | sed 's%/Fe%/Fo%g')"
      single="-c"
      shift 1
    ;;
    -D*=*)
      name="$(echo $1|sed 's/-D\([^=][^=]*\)=.*/\1/g')"
      value="$(echo $1|sed 's/-D[^=][^=]*=//g')"
      args="$args -D${name}='$value'"
      defines="$defines -D${name}='$value'"
      shift 1
    ;;
    -D*)
      args="$args $1"
      defines="$defines $1"
      shift 1
    ;;
    -I)
      p=$(cygpath -ma "$2")
      args="$args -I\"$p\""
      includes="$includes -I\"$p\""
      shift 2
    ;;
    -I*)
      p=$(cygpath -ma "${1#-I}")
      args="$args -I\"$p\""
      includes="$includes -I\"$p\""
      shift 1
    ;;
    -L)
      p=$(cygpath -ma $2)
      linkargs="$linkargs -LIBPATH:$p"
      shift 2
    ;;
    -L*)
      p=$(cygpath -ma ${1#-L})
      linkargs="$linkargs -LIBPATH:$p"
      shift 1
    ;;
    -link)
      # add next argument verbatim to linker args
      linkargs="$linkargs $2"
      shift 2
      ;;
    -l*)
      case $1
      in
        -lffi)
          linkargs="$linkargs lib${1#-l}-${libversion}.lib"
          ;;
        *)
          # ignore other libraries like -lm, hope they are
          # covered by MSVCRT
          # linkargs="$linkargs ${1#-l}.lib"
          ;;
      esac
      shift 1
    ;;
    -W|-Wextra)
      # TODO map extra warnings
      shift 1
    ;;
    -Wall)
      # -Wall on MSVC is overzealous, and we already build with -W3. Nothing
      # to do here.
      shift 1
    ;;
    -pedantic)
      # libffi tests -pedantic with -Wall, so drop it also.
      shift 1
    ;;
    -warn)
      # ignore -warn all from libtool as well.
      if test "$2" = "all"; then
        shift 2
      else
        args="$args -warn"
        shift 1
      fi
    ;;
    -Werror)
      args="$args -WX"
      shift 1
    ;;
    -W*)
      # TODO map specific warnings
      shift 1
    ;;
    -S)
      args="$args -FAs"
      shift 1
    ;;
    -o)
      outdir="$(dirname $2)"
      base="$(basename $2|sed 's/\.[^.]*//g')"
      if [ -n "$single" ]; then 
        output="-Fo$2"
      else
        output="-Fe$2"
      fi
      armasm_output="-o $2"
      if [ -n "$assembly" ]; then
        args="$args $output"
      else
        args="$args $output -Fd$outdir/$base -Fp$outdir/$base -Fa$outdir/$base"
      fi
      shift 2
    ;;
    *.S)
      src="$(cygpath -ma $1)"
      assembly="true"
      shift 1
    ;;
    *.c)
      args="$args $(cygpath -ma $1)"
      shift 1
    ;;
    *)
      # Assume it's an MSVC argument, and pass it through.
      args="$args $1"
      shift 1
    ;;
  esac
done

if [ -n "$linkargs" ]; then

    # If -Zi is specified, certain optimizations are implicitly disabled
    # by MSVC. Add back those optimizations if this is an optimized build.
    # NOTE: These arguments must come after all others.
    if [ -n "$opt" ]; then
	linkargs="$linkargs -OPT:REF -OPT:ICF -INCREMENTAL:NO"
    fi

    args="$args -link $linkargs"
fi

if [ -n "$static_crt" ]; then
    md=-MT
else
    md=-MD
fi

if [ -n "$debug_crt" ]; then
    md="${md}d"
fi

if [ -n "$assembly" ]; then
    if [ -z "$outdir" ]; then
      outdir="."
    fi
    ppsrc="$outdir/$(basename $src|sed 's/.S$/.asm/g')"

    if [ $ml = "armasm" ]; then
      defines="$defines -D_M_ARM"
    fi

    if [ $ml = "armasm64" ]; then
      defines="$defines -D_M_ARM64"
    fi

    if test -n "$verbose"; then
      echo "$cl -nologo -EP $includes $defines $src > $ppsrc"
    fi

    eval "\"$cl\" -nologo -EP $includes $defines $src" > $ppsrc || exit $?
    output="$(echo $output | sed 's%/F[dpa][^ ]*%%g')"
    if [ $ml = "armasm" ]; then
      args="-nologo -g -oldit $armasm_output $ppsrc -errorReport:prompt"
    elif [ $ml = "armasm64" ]; then
      args="-nologo -g $armasm_output $ppsrc -errorReport:prompt"
    else
      args="-nologo $safeseh $single $output $ppsrc"
    fi

    if test -n "$verbose"; then
      echo "$ml $args"
    fi

    eval "\"$ml\" $args"
    result=$?

    # required to fix ml64 broken output?
    #mv *.obj $outdir
else
    args="$md $args"

    if test -n "$verbose"; then
      echo "$cl $args"
    fi
    # Return an error code of 1 if an invalid command line parameter is passed
    # instead of just ignoring it. Any output that is not a warning or an
    # error is filtered so this command behaves more like gcc. cl.exe prints
    # the name of the compiled file otherwise, which breaks the dejagnu checks
    # for excess warnings and errors.
    eval "(\"$cl\" $args 2>&1 1>&3 | \
          awk '{print \$0} /D9002/ {error=1} END{exit error}' >&2) 3>&1 | \
          awk '/warning|error/'"
    result=$?
fi

exit $result

# vim: noai:ts=4:sw=4
