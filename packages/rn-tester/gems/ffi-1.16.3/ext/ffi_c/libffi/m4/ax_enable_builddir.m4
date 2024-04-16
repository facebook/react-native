# ===========================================================================
#    https://www.gnu.org/software/autoconf-archive/ax_enable_builddir.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_ENABLE_BUILDDIR [(dirstring-or-command [,Makefile.mk [,-all]])]
#
# DESCRIPTION
#
#   If the current configure was run within the srcdir then we move all
#   configure-files into a subdir and let the configure steps continue
#   there. We provide an option --disable-builddir to suppress the move into
#   a separate builddir.
#
#   Defaults:
#
#     $1 = $host (overridden with $HOST)
#     $2 = Makefile.mk
#     $3 = -all
#
#   This macro must be called before AM_INIT_AUTOMAKE. It creates a default
#   toplevel srcdir Makefile from the information found in the created
#   toplevel builddir Makefile. It just copies the variables and
#   rule-targets, each extended with a default rule-execution that recurses
#   into the build directory of the current "HOST". You can override the
#   auto-detection through `config.guess` and build-time of course, as in
#
#     make HOST=i386-mingw-cross
#
#   which can of course set at configure time as well using
#
#     configure --host=i386-mingw-cross
#
#   After the default has been created, additional rules can be appended
#   that will not just recurse into the subdirectories and only ever exist
#   in the srcdir toplevel makefile - these parts are read from the $2 =
#   Makefile.mk file
#
#   The automatic rules are usually scanning the toplevel Makefile for lines
#   like '#### $host |$builddir' to recognize the place where to recurse
#   into. Usually, the last one is the only one used. However, almost all
#   targets have an additional "*-all" rule which makes the script to
#   recurse into _all_ variants of the current HOST (!!) setting. The "-all"
#   suffix can be overridden for the macro as well.
#
#   a special rule is only given for things like "dist" that will copy the
#   tarball from the builddir to the sourcedir (or $(PUB)) for reason of
#   convenience.
#
# LICENSE
#
#   Copyright (c) 2009 Guido U. Draheim <guidod@gmx.de>
#   Copyright (c) 2009 Alan Jenkins <alan-jenkins@tuffmail.co.uk>
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

#serial 30

AC_DEFUN([AX_ENABLE_BUILDDIR],[
AC_REQUIRE([AC_CANONICAL_HOST])[]dnl
AC_REQUIRE([AC_CANONICAL_TARGET])[]dnl
AC_REQUIRE([AX_CONFIGURE_ARGS])[]dnl
AC_REQUIRE([AM_AUX_DIR_EXPAND])[]dnl
AC_BEFORE([$0],[AM_INIT_AUTOMAKE])dnl
AS_VAR_PUSHDEF([SUB],[ax_enable_builddir])dnl
AS_VAR_PUSHDEF([AUX],[ax_enable_builddir_auxdir])dnl
AS_VAR_PUSHDEF([SED],[ax_enable_builddir_sed])dnl
SUB="."
AC_ARG_ENABLE([builddir], AS_HELP_STRING(
  [--disable-builddir],[disable automatic build in subdir of sources])
  ,[SUB="$enableval"], [SUB="auto"])
if test ".$ac_srcdir_defaulted" != ".no" ; then
if test ".$srcdir" = ".." ; then
  if test -f config.status ; then
    AC_MSG_NOTICE(toplevel srcdir already configured... skipping subdir build)
  else
    test ".$SUB" = "."  && SUB="."
    test ".$SUB" = ".no"  && SUB="."
    test ".$TARGET" = "." && TARGET="$target"
    test ".$SUB" = ".auto" && SUB="m4_ifval([$1], [$1],[$TARGET])"
    if test ".$SUB" != ".." ; then    # we know where to go and
      AS_MKDIR_P([$SUB])
      echo __.$SUB.__ > $SUB/conftest.tmp
      cd $SUB
      if grep __.$SUB.__ conftest.tmp >/dev/null 2>/dev/null ; then
        rm conftest.tmp
        AC_MSG_RESULT([continue configure in default builddir "./$SUB"])
      else
        AC_MSG_ERROR([could not change to default builddir "./$SUB"])
      fi
      srcdir=`echo "$SUB" |
              sed -e 's,^\./,,;s,[[^/]]$,&/,;s,[[^/]]*/,../,g;s,[[/]]$,,;'`
      # going to restart from subdirectory location
      test -f $srcdir/config.log   && mv $srcdir/config.log   .
      test -f $srcdir/confdefs.h   && mv $srcdir/confdefs.h   .
      test -f $srcdir/conftest.log && mv $srcdir/conftest.log .
      test -f $srcdir/$cache_file  && mv $srcdir/$cache_file  .
      AC_MSG_RESULT(....exec $SHELL $srcdir/[$]0 "--srcdir=$srcdir" "--enable-builddir=$SUB" ${1+"[$]@"})
      case "[$]0" in # restart
       [[\\/]]* | ?:[[\\/]]*) # Absolute name
         eval $SHELL "'[$]0'" "'--srcdir=$srcdir'" "'--enable-builddir=$SUB'" $ac_configure_args ;;
       *) eval $SHELL "'$srcdir/[$]0'" "'--srcdir=$srcdir'" "'--enable-builddir=$SUB'" $ac_configure_args ;;
      esac ; exit $?
    fi
  fi
fi fi
test ".$SUB" = ".auto" && SUB="."
dnl ac_path_prog uses "set dummy" to override $@ which would defeat the "exec"
AC_PATH_PROG(SED,gsed sed, sed)
AUX="$am_aux_dir"
AS_VAR_POPDEF([SED])dnl
AS_VAR_POPDEF([AUX])dnl
AS_VAR_POPDEF([SUB])dnl
AC_CONFIG_COMMANDS([buildir],[dnl .............. config.status ..............
AS_VAR_PUSHDEF([SUB],[ax_enable_builddir])dnl
AS_VAR_PUSHDEF([TOP],[top_srcdir])dnl
AS_VAR_PUSHDEF([SRC],[ac_top_srcdir])dnl
AS_VAR_PUSHDEF([AUX],[ax_enable_builddir_auxdir])dnl
AS_VAR_PUSHDEF([SED],[ax_enable_builddir_sed])dnl
pushdef([END],[Makefile.mk])dnl
pushdef([_ALL],[ifelse([$3],,[-all],[$3])])dnl
  SRC="$ax_enable_builddir_srcdir"
  if test ".$SUB" = ".." ; then
    if test -f "$TOP/Makefile" ; then
      AC_MSG_NOTICE([skipping TOP/Makefile - left untouched])
    else
      AC_MSG_NOTICE([skipping TOP/Makefile - not created])
    fi
  else
    if test -f "$SRC/Makefile" ; then
      a=`grep "^VERSION " "$SRC/Makefile"` ; b=`grep "^VERSION " Makefile`
      test "$a" != "$b" && rm "$SRC/Makefile"
    fi
    if test -f "$SRC/Makefile" ; then
	echo "$SRC/Makefile : $SRC/Makefile.in" > $tmp/conftemp.mk
	echo "	[]@ echo 'REMOVED,,,' >\$[]@" >> $tmp/conftemp.mk
      eval "${MAKE-make} -f $tmp/conftemp.mk 2>/dev/null >/dev/null"
      if grep '^REMOVED,,,' "$SRC/Makefile" >/dev/null
      then rm $SRC/Makefile ; fi
      cp $tmp/conftemp.mk $SRC/makefiles.mk~      ## DEBUGGING
    fi
    if test ! -f "$SRC/Makefile" ; then
      AC_MSG_NOTICE([create TOP/Makefile guessed from local Makefile])
      x='`' ; cat >$tmp/conftemp.sed <<_EOF
/^\$/n
x
/^\$/bS
x
/\\\\\$/{H;d;}
{H;s/.*//;x;}
bM
:S
x
/\\\\\$/{h;d;}
{h;s/.*//;x;}
:M
s/\\(\\n\\)	/\\1 /g
/^	/d
/^[[	 ]]*[[\\#]]/d
/^VPATH *=/d
s/^srcdir *=.*/srcdir = ./
s/^top_srcdir *=.*/top_srcdir = ./
/[[:=]]/!d
/^\\./d
dnl Now handle rules (i.e. lines containing ":" but not " = ").
/ = /b
/ .= /b
/:/!b
s/:.*/:/
s/ /  /g
s/ \\([[a-z]][[a-z-]]*[[a-zA-Z0-9]]\\)\\([[ :]]\\)/ \\1 \\1[]_ALL\\2/g
s/^\\([[a-z]][[a-z-]]*[[a-zA-Z0-9]]\\)\\([[ :]]\\)/\\1 \\1[]_ALL\\2/
s/  / /g
/^all all[]_ALL[[ :]]/i\\
all-configured : all[]_ALL
dnl dist-all exists... and would make for dist-all-all
s/ [[a-zA-Z0-9-]]*[]_ALL [[a-zA-Z0-9-]]*[]_ALL[]_ALL//g
/[]_ALL[]_ALL/d
a\\
	@ HOST="\$(HOST)\" \\\\\\
	; test ".\$\$HOST" = "." && HOST=$x sh $AUX/config.guess $x \\\\\\
	; BUILD=$x grep "^#### \$\$HOST " Makefile | sed -e 's/.*|//' $x \\\\\\
	; use=$x basename "\$\@" _ALL $x; n=$x echo \$\$BUILD | wc -w $x \\\\\\
	; echo "MAKE \$\$HOST : \$\$n * \$\@"; if test "\$\$n" -eq "0" ; then : \\\\\\
	; BUILD=$x grep "^####.*|" Makefile |tail -1| sed -e 's/.*|//' $x ; fi \\\\\\
	; test ".\$\$BUILD" = "." && BUILD="." \\\\\\
	; test "\$\$use" = "\$\@" && BUILD=$x echo "\$\$BUILD" | tail -1 $x \\\\\\
	; for i in \$\$BUILD ; do test ".\$\$i" = "." && continue \\\\\\
	; (cd "\$\$i" && test ! -f configure && \$(MAKE) \$\$use) || exit; done
dnl special rule add-on: "dist" copies the tarball to $(PUB). (source tree)
/dist[]_ALL *:/a\\
	@ HOST="\$(HOST)\" \\\\\\
	; test ".\$\$HOST" = "." && HOST=$x sh $AUX/config.guess $x \\\\\\
	; BUILD=$x grep "^#### \$\$HOST " Makefile | sed -e 's/.*|//' $x \\\\\\
	; found=$x echo \$\$BUILD | wc -w $x \\\\\\
	; echo "MAKE \$\$HOST : \$\$found \$(PACKAGE)-\$(VERSION).tar.*" \\\\\\
	; if test "\$\$found" -eq "0" ; then : \\\\\\
	; BUILD=$x grep "^#### .*|" Makefile |tail -1| sed -e 's/.*|//' $x \\\\\\
	; fi ; for i in \$\$BUILD ; do test ".\$\$i" = "." && continue \\\\\\
	; for f in \$\$i/\$(PACKAGE)-\$(VERSION).tar.* \\\\\\
	; do test -f "\$\$f" && mv "\$\$f" \$(PUB). ; done ; break ; done
dnl special rule add-on: "dist-foo" copies all the archives to $(PUB). (source tree)
/dist-[[a-zA-Z0-9]]*[]_ALL *:/a\\
	@ HOST="\$(HOST)\" \\\\\\
	; test ".\$\$HOST" = "." && HOST=$x sh ./config.guess $x \\\\\\
	; BUILD=$x grep "^#### \$\$HOST " Makefile | sed -e 's/.*|//' $x \\\\\\
	; found=$x echo \$\$BUILD | wc -w $x \\\\\\
	; echo "MAKE \$\$HOST : \$\$found \$(PACKAGE)-\$(VERSION).*" \\\\\\
	; if test "\$\$found" -eq "0" ; then : \\\\\\
	; BUILD=$x grep "^#### .*|" Makefile |tail -1| sed -e 's/.*|//' $x \\\\\\
	; fi ; for i in \$\$BUILD ; do test ".\$\$i" = "." && continue \\\\\\
	; for f in \$\$i/\$(PACKAGE)-\$(VERSION).* \\\\\\
	; do test -f "\$\$f" && mv "\$\$f" \$(PUB). ; done ; break ; done
dnl special rule add-on: "distclean" removes all local builddirs completely
/distclean[]_ALL *:/a\\
	@ HOST="\$(HOST)\" \\\\\\
	; test ".\$\$HOST" = "." && HOST=$x sh $AUX/config.guess $x \\\\\\
	; BUILD=$x grep "^#### .*|" Makefile | sed -e 's/.*|//' $x \\\\\\
	; use=$x basename "\$\@" _ALL $x; n=$x echo \$\$BUILD | wc -w $x \\\\\\
	; echo "MAKE \$\$HOST : \$\$n * \$\@ (all local builds)" \\\\\\
	; test ".\$\$BUILD" = "." && BUILD="." \\\\\\
	; for i in \$\$BUILD ; do test ".\$\$i" = "." && continue \\\\\\
	; echo "# rm -r \$\$i"; done ; echo "# (sleep 3)" ; sleep 3 \\\\\\
	; for i in \$\$BUILD ; do test ".\$\$i" = "." && continue \\\\\\
	; echo "\$\$i" | grep "^/" > /dev/null && continue \\\\\\
	; echo "\$\$i" | grep "^../" > /dev/null && continue \\\\\\
	; echo "rm -r \$\$i"; (rm -r "\$\$i") ; done ; rm Makefile
_EOF
      cp "$tmp/conftemp.sed" "$SRC/makefile.sed~"            ## DEBUGGING
      $SED -f $tmp/conftemp.sed Makefile >$SRC/Makefile
      if test -f "$SRC/m4_ifval([$2],[$2],[END])" ; then
        AC_MSG_NOTICE([extend TOP/Makefile with TOP/m4_ifval([$2],[$2],[END])])
        cat $SRC/END >>$SRC/Makefile
      fi ; xxxx="####"
      echo "$xxxx CONFIGURATIONS FOR TOPLEVEL MAKEFILE: " >>$SRC/Makefile
      # sanity check
      if grep '^; echo "MAKE ' $SRC/Makefile >/dev/null ; then
        AC_MSG_NOTICE([buggy sed found - it deletes tab in "a" text parts])
        $SED -e '/^@ HOST=/s/^/	/' -e '/^; /s/^/	/' $SRC/Makefile \
          >$SRC/Makefile~
        (test -s $SRC/Makefile~ && mv $SRC/Makefile~ $SRC/Makefile) 2>/dev/null
      fi
    else
      xxxx="\\#\\#\\#\\#"
      # echo "/^$xxxx *$ax_enable_builddir_host /d" >$tmp/conftemp.sed
      echo "s!^$xxxx [[^|]]* | *$SUB *\$!$xxxx ...... $SUB!" >$tmp/conftemp.sed
      $SED -f "$tmp/conftemp.sed" "$SRC/Makefile" >$tmp/mkfile.tmp
        cp "$tmp/conftemp.sed" "$SRC/makefiles.sed~"         ## DEBUGGING
        cp "$tmp/mkfile.tmp"   "$SRC/makefiles.out~"         ## DEBUGGING
      if cmp -s "$SRC/Makefile" "$tmp/mkfile.tmp" 2>/dev/null ; then
        AC_MSG_NOTICE([keeping TOP/Makefile from earlier configure])
        rm "$tmp/mkfile.tmp"
      else
        AC_MSG_NOTICE([reusing TOP/Makefile from earlier configure])
        mv "$tmp/mkfile.tmp" "$SRC/Makefile"
      fi
    fi
    AC_MSG_NOTICE([build in $SUB (HOST=$ax_enable_builddir_host)])
    xxxx="####"
    echo "$xxxx" "$ax_enable_builddir_host" "|$SUB" >>$SRC/Makefile
  fi
popdef([END])dnl
AS_VAR_POPDEF([SED])dnl
AS_VAR_POPDEF([AUX])dnl
AS_VAR_POPDEF([SRC])dnl
AS_VAR_POPDEF([TOP])dnl
AS_VAR_POPDEF([SUB])dnl
],[dnl
ax_enable_builddir_srcdir="$srcdir"                    # $srcdir
ax_enable_builddir_host="$HOST"                        # $HOST / $host
ax_enable_builddir_version="$VERSION"                  # $VERSION
ax_enable_builddir_package="$PACKAGE"                  # $PACKAGE
ax_enable_builddir_auxdir="$ax_enable_builddir_auxdir" # $AUX
ax_enable_builddir_sed="$ax_enable_builddir_sed"       # $SED
ax_enable_builddir="$ax_enable_builddir"               # $SUB
])dnl
])
