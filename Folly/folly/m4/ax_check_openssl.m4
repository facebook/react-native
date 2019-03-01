# ===========================================================================
#     http://www.gnu.org/software/autoconf-archive/ax_check_openssl.html
# ===========================================================================
#
# SYNOPSIS
#
#   AX_CHECK_OPENSSL([action-if-found[, action-if-not-found]])
#
# DESCRIPTION
#
#   Look for OpenSSL in a number of default spots, or in a user-selected
#   spot (via --with-openssl).  Sets
#
#     OPENSSL_INCLUDES to the include directives required
#     OPENSSL_LIBS to the -l directives required
#     OPENSSL_LDFLAGS to the -L or -R flags required
#
#   and calls ACTION-IF-FOUND or ACTION-IF-NOT-FOUND appropriately
#
#   This macro sets OPENSSL_INCLUDES such that source files should use the
#   openssl/ directory in include directives:
#
#     #include <openssl/hmac.h>
#
# LICENSE
#
#   Copyright (c) 2009,2010 Zmanda Inc. <http://www.zmanda.com/>
#   Copyright (c) 2009,2010 Dustin J. Mitchell <dustin@zmanda.com>
#
#   Copying and distribution of this file, with or without modification, are
#   permitted in any medium without royalty provided the copyright notice
#   and this notice are preserved. This file is offered as-is, without any
#   warranty.

#serial 9

AU_ALIAS([CHECK_SSL], [AX_CHECK_OPENSSL])
AC_DEFUN([AX_CHECK_OPENSSL], [
    found=false
    AC_ARG_WITH([openssl],
        [AS_HELP_STRING([--with-openssl=DIR],
            [root of the OpenSSL directory])],
        [
            case "$withval" in
            "" | y | ye | yes | n | no)
            AC_MSG_ERROR([Invalid --with-openssl value])
              ;;
            *) ssldirs="$withval"
              ;;
            esac
        ], [
            # if pkg-config is installed and openssl has installed a .pc file,
            # then use that information and don't search ssldirs
            AC_CHECK_TOOL([PKG_CONFIG], [pkg-config])
            if test x"$PKG_CONFIG" != x""; then
                OPENSSL_LDFLAGS=`$PKG_CONFIG openssl --libs-only-L 2>/dev/null`
                if test $? = 0; then
                    OPENSSL_LIBS=`$PKG_CONFIG openssl --libs-only-l 2>/dev/null`
                    OPENSSL_INCLUDES=`$PKG_CONFIG openssl --cflags-only-I 2>/dev/null`
                    found=true
                fi
            fi

            # no such luck; use some default ssldirs
            if ! $found; then
                ssldirs="/usr/local/ssl /usr/lib/ssl /usr/ssl /usr/pkg /usr/local /usr"
            fi
        ]
        )


    # note that we #include <openssl/foo.h>, so the OpenSSL headers have to be in
    # an 'openssl' subdirectory

    if ! $found; then
        OPENSSL_INCLUDES=
        for ssldir in $ssldirs; do
            AC_MSG_CHECKING([for openssl/ssl.h in $ssldir])
            if test -f "$ssldir/include/openssl/ssl.h"; then
                OPENSSL_INCLUDES="-I$ssldir/include"
                OPENSSL_LDFLAGS="-L$ssldir/lib"
                OPENSSL_LIBS="-lssl -lcrypto"
                found=true
                AC_MSG_RESULT([yes])
                break
            else
                AC_MSG_RESULT([no])
            fi
        done

        # if the file wasn't found, well, go ahead and try the link anyway -- maybe
        # it will just work!
    fi

    # try the preprocessor and linker with our new flags,
    # being careful not to pollute the global LIBS, LDFLAGS, and CPPFLAGS

    AC_MSG_CHECKING([whether compiling and linking against OpenSSL works])
    echo "Trying link with OPENSSL_LDFLAGS=$OPENSSL_LDFLAGS;" \
        "OPENSSL_LIBS=$OPENSSL_LIBS; OPENSSL_INCLUDES=$OPENSSL_INCLUDES" >&AS_MESSAGE_LOG_FD

    save_LIBS="$LIBS"
    save_LDFLAGS="$LDFLAGS"
    save_CPPFLAGS="$CPPFLAGS"
    LDFLAGS="$LDFLAGS $OPENSSL_LDFLAGS"
    LIBS="$OPENSSL_LIBS $LIBS"
    CPPFLAGS="$OPENSSL_INCLUDES $CPPFLAGS"
    AC_LINK_IFELSE(
        [AC_LANG_PROGRAM([#include <openssl/ssl.h>], [SSL_new(NULL)])],
        [
            AC_MSG_RESULT([yes])
            $1
        ], [
            AC_MSG_RESULT([no])
            $2
        ])
    CPPFLAGS="$save_CPPFLAGS"
    LDFLAGS="$save_LDFLAGS"
    LIBS="$save_LIBS"

    AC_SUBST([OPENSSL_INCLUDES])
    AC_SUBST([OPENSSL_LIBS])
    AC_SUBST([OPENSSL_LDFLAGS])
])
