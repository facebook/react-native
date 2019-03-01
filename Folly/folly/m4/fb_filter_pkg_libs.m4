AC_DEFUN([FB_FILTER_PKG_LIBS],
  [AC_REQUIRE([AC_PROG_SED])
   deps_=`for p in $PKG_DEPS; do pkg-config --libs $p; done`
   filter_=`for l in $deps_;dnl
     do echo $l | $SED -e 's%\(-l.*\)%-e s/\1//%' -e '/^-L/d';dnl
     done`
   PKG_LIBS=`echo $1 | $SED $filter_`
  ]
)
