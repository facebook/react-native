# ===========================================================================
#     http://www.gnu.org/software/autoconf-archive/ax_boost_context.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_BOOST_CONTEXT
#
# DESCRIPTION
#
#   Test for Context library from the Boost C++ libraries. The macro
#   requires a preceding call to AX_BOOST_BASE. Further documentation is
#   available at <http://randspringer.de/boost/index.html>.
#
#   This macro calls:
#
#     AC_SUBST(BOOST_CONTEXT_LIB)
#
#   And sets:
#
#     HAVE_BOOST_CONTEXT
#
# LICENSE
#
#   Copyright (c) 2008 Thomas Porschberg <thomas@randspringer.de>
#   Copyright (c) 2008 Michael Tindal
#   Copyright (c) 2013 Daniel Casimiro <dan.casimiro@gmail.com>
#
#   Copying and distribution of this file, with or without modification, are
#   permitted in any medium without royalty provided the copyright notice
#   and this notice are preserved. This file is offered as-is, without any
#   warranty.

#serial 1

AC_DEFUN([AX_BOOST_CONTEXT],
[
	AC_ARG_WITH([boost-context],
		AS_HELP_STRING([--with-boost-context@<:@=special-lib@:>@],
		[use the Context library from boost - it is possible to specify a certain library for the linker
			e.g. --with-boost-context=boost_context-gcc-mt ]), [
		if test "$withval" = "no"; then
			want_boost="no"
		elif test "$withval" = "yes"; then
			want_boost="yes"
			ax_boost_user_context_lib=""
		else
			want_boost="yes"
			ax_boost_user_context_lib="$withval"
		fi
		], [want_boost="yes"]
	)

	if test "x$want_boost" = "xyes"; then
		AC_REQUIRE([AC_PROG_CC])
		AC_REQUIRE([AC_CANONICAL_BUILD])

		CPPFLAGS_SAVED="$CPPFLAGS"
		CPPFLAGS="$CPPFLAGS $BOOST_CPPFLAGS"
		export CPPFLAGS

		LDFLAGS_SAVED="$LDFLAGS"
		LDFLAGS="$LDFLAGS $BOOST_LDFLAGS"
		export LDFLAGS

		AC_CACHE_CHECK(whether the Boost::Context library is available,
			ax_cv_boost_context,
			[AC_LANG_PUSH([C++])
			CXXFLAGS_SAVE=$CXXFLAGS

			AC_COMPILE_IFELSE([AC_LANG_PROGRAM(
				[[@%:@include <boost/version.hpp>
#if BOOST_VERSION >= 106100
#include <boost/context/detail/fcontext.hpp>
#else
#include <boost/context/fcontext.hpp>
#endif
]],
				[[#if BOOST_VERSION >= 106100
  boost::context::detail::fcontext_t fc = boost::context::detail::make_fcontext(0, 0, 0);
#elif BOOST_VERSION >= 105600
  boost::context::fcontext_t fc = boost::context::make_fcontext(0, 0, 0);
#else
  boost::context::fcontext_t* fc = boost::context::make_fcontext(0, 0, 0);
#endif
]]
				)],
				ax_cv_boost_context=yes, ax_cv_boost_context=no)
				CXXFLAGS=$CXXFLAGS_SAVE
			AC_LANG_POP([C++])
		])

		if test "x$ax_cv_boost_context" = "xyes"; then
			AC_SUBST(BOOST_CPPFLAGS)

			AC_DEFINE(HAVE_BOOST_CONTEXT,,[define if the Boost::Context library is available])
			BOOSTLIBDIR=`echo $BOOST_LDFLAGS | sed -e 's/@<:@^\/@:>@*//'`

			if test "x$ax_boost_user_context_lib" = "x"; then
				for libextension in `ls $BOOSTLIBDIR/libboost_context*.so* $BOOSTLIBDIR/libboost_context*.dylib* $BOOSTLIBDIR/libboost_context*.a* 2>/dev/null | sed 's,.*/,,' | sed -e 's;^lib\(boost_context.*\)\.so.*$;\1;' -e 's;^lib\(boost_context.*\)\.dylib.*$;\1;' -e 's;^lib\(boost_context.*\)\.a.*$;\1;'` ; do
					ax_lib=${libextension}
					AC_CHECK_LIB($ax_lib, exit,
						[BOOST_CONTEXT_LIB="-l$ax_lib"; AC_SUBST(BOOST_CONTEXT_LIB) link_context="yes"; break],
					[link_context="no"])
				done

				if test "x$link_context" != "xyes"; then
					for libextension in `ls $BOOSTLIBDIR/boost_context*.dll* $BOOSTLIBDIR/boost_context*.a* 2>/dev/null | sed 's,.*/,,' | sed -e 's;^\(boost_context.*\)\.dll.*$;\1;' -e 's;^\(boost_context.*\)\.a.*$;\1;'` ; do
						ax_lib=${libextension}
						AC_CHECK_LIB($ax_lib, exit,
							[BOOST_CONTEXT_LIB="-l$ax_lib"; AC_SUBST(BOOST_CONTEXT_LIB) link_context="yes"; break],
							[link_context="no"])
					done
				fi

			else
				for ax_lib in $ax_boost_user_context_lib boost_context-$ax_boost_user_context_lib; do
					AC_CHECK_LIB($ax_lib, exit,
						[BOOST_CONTEXT_LIB="-l$ax_lib"; AC_SUBST(BOOST_CONTEXT_LIB) link_context="yes"; break],
						[link_context="no"])
				done
			fi

			if test "x$ax_lib" = "x"; then
				AC_MSG_ERROR(Could not find a version of the library!)
			fi

			if test "x$link_context" = "xno"; then
				AC_MSG_ERROR(Could not link against $ax_lib !)
			fi
		fi

		CPPFLAGS="$CPPFLAGS_SAVED"
		LDFLAGS="$LDFLAGS_SAVED"
	fi
])

