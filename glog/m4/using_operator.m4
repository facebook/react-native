AC_DEFUN([AC_CXX_USING_OPERATOR],
  [AC_CACHE_CHECK(
      whether compiler supports using ::operator<<,
      ac_cv_cxx_using_operator,
      [AC_LANG_SAVE
       AC_LANG_CPLUSPLUS
       AC_TRY_COMPILE([#include <iostream>
                       std::ostream& operator<<(std::ostream&, struct s);],
                      [using ::operator<<; return 0;],
                      ac_cv_cxx_using_operator=1,
		      ac_cv_cxx_using_operator=0)
      AC_LANG_RESTORE])
  if test "$ac_cv_cxx_using_operator" = 1; then
    AC_DEFINE(HAVE_USING_OPERATOR, 1, [define if the compiler supports using expression for operator])
  fi])
