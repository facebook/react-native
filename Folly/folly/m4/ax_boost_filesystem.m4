# ===========================================================================
#    http://www.gnu.org/software/autoconf-archive/ax_boost_filesystem.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_BOOST_FILESYSTEM
#
# DESCRIPTION
#
#   Test for Filesystem library from the Boost C++ libraries. The macro
#   requires a preceding call to AX_BOOST_BASE. Further documentation is
#   available at <http://randspringer.de/boost/index.html>.
#
#   This macro calls:
#
#     AC_SUBST(BOOST_FILESYSTEM_LIB)
#
#   And sets:
#
#     HAVE_BOOST_FILESYSTEM
#
# LICENSE
#
#   Copyright (c) 2009 Thomas Porschberg <thomas@randspringer.de>
#   Copyright (c) 2009 Michael Tindal
#   Copyright (c) 2009 Roman Rybalko <libtorrent@romanr.info>
#
#   Copying and distribution of this file, with or without modification, are
#   permitted in any medium without royalty provided the copyright notice
#   and this notice are preserved. This file is offered as-is, without any
#   warranty.

#serial 26

AC_DEFUN([AX_BOOST_FILESYSTEM],
[
	AC_ARG_WITH([boost-filesystem],
	AS_HELP_STRING([--with-boost-filesystem@<:@=special-lib@:>@],
                   [use the Filesystem library from boost - it is possible to specify a certain library for the linker
                        e.g. --with-boost-filesystem=boost_filesystem-gcc-mt ]),
        [
        if test "$withval" = "no"; then
	   	want_boost="no"
        elif test "$withval" = "yes"; then
            want_boost="yes"
            ax_boost_user_filesystem_lib=""
        else
		    want_boost="yes"
			ax_boost_user_filesystem_lib="$withval"
				fi
        ],
        [want_boost="yes"]
	)

	if test "x$want_boost" = "xyes"; then
        AC_REQUIRE([AC_PROG_CC])
		CPPFLAGS_SAVED="$CPPFLAGS"
			CPPFLAGS="$CPPFLAGS $BOOST_CPPFLAGS"
					    export CPPFLAGS

					    	   LDFLAGS_SAVED="$LDFLAGS"
							LDFLAGS="$LDFLAGS $BOOST_LDFLAGS"
									  export LDFLAGS

									  	 LIBS_SAVED=$LIBS
											LIBS="$LIBS $BOOST_SYSTEM_LIB"
												    export LIBS

        AC_CACHE_CHECK(whether the Boost::Filesystem library is available,
			       	   		     	        ax_cv_boost_filesystem,
        [AC_LANG_PUSH([C++])
         AC_COMPILE_IFELSE([AC_LANG_PROGRAM([[@%:@include <boost/filesystem/path.hpp>]],
                                   [[using namespace boost::filesystem;
                                   path my_path( "foo/bar/data.txt" );
                                   return 0;]])],
								       ax_cv_boost_filesystem=yes, ax_cv_boost_filesystem=no)
         AC_LANG_POP([C++])
		])
			if test "x$ax_cv_boost_filesystem" = "xyes"; then
			   	AC_DEFINE(HAVE_BOOST_FILESYSTEM,,[define if the Boost::Filesystem library is available])
            BOOSTLIBDIR=`echo $BOOST_LDFLAGS | sed -e 's/@<:@^\/@:>@*//'`
            if test "x$ax_boost_user_filesystem_lib" = "x"; then
                for libextension in `ls -r $BOOSTLIBDIR/libboost_filesystem* 2>/dev/null | sed 's,.*/lib,,' | sed 's,\..*,,'` ; do
                     ax_lib=${libextension}
					    AC_CHECK_LIB($ax_lib, exit,
                                 [BOOST_FILESYSTEM_LIB="-l$ax_lib"; AC_SUBST(BOOST_FILESYSTEM_LIB) link_filesystem="yes"; break],
                                 [link_filesystem="no"])
							done
                if test "x$link_filesystem" != "xyes"; then
                for libextension in `ls -r $BOOSTLIBDIR/boost_filesystem* 2>/dev/null | sed 's,.*/,,' | sed -e 's,\..*,,'` ; do
                     ax_lib=${libextension}
					    AC_CHECK_LIB($ax_lib, exit,
                                 [BOOST_FILESYSTEM_LIB="-l$ax_lib"; AC_SUBST(BOOST_FILESYSTEM_LIB) link_filesystem="yes"; break],
                                 [link_filesystem="no"])
							done
								    fi
            else
               for ax_lib in $ax_boost_user_filesystem_lib boost_filesystem-$ax_boost_user_filesystem_lib; do
	       	   	           AC_CHECK_LIB($ax_lib, exit,
                                   [BOOST_FILESYSTEM_LIB="-l$ax_lib"; AC_SUBST(BOOST_FILESYSTEM_LIB) link_filesystem="yes"; break],
                                   [link_filesystem="no"])
                  done

            fi
            if test "x$ax_lib" = "x"; then
                AC_MSG_ERROR(Could not find a version of the library!)
            fi
			if test "x$link_filesystem" != "xyes"; then
			   			    AC_MSG_ERROR(Could not link against $ax_lib !)
						    		       	   fi
										fi

											CPPFLAGS="$CPPFLAGS_SAVED"
												LDFLAGS="$LDFLAGS_SAVED"
													LIBS="$LIBS_SAVED"
													fi
])