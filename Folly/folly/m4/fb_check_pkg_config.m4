AC_DEFUN([FB_CHECK_PKG_CONFIG],
  [AC_REQUIRE([PKG_PROG_PKG_CONFIG])
   PKG_CHECK_MODULES($1, $2,
     [PKG_DEPS="$PKG_DEPS $2"],
     [AC_MSG_NOTICE([$2.pc not found, treating as legacy dependency])]
   )
  ]
)
