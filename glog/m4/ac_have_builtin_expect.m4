AC_DEFUN([AX_C___BUILTIN_EXPECT], [
  AC_MSG_CHECKING(for __builtin_expect)
  AC_CACHE_VAL(ac_cv___builtin_expect, [
    AC_TRY_COMPILE(
      [int foo(void) { if (__builtin_expect(0, 0)) return 1; return 0; }],
      [],
      ac_cv___builtin_expect=yes,
      ac_cv___builtin_expect=no
    )])
  if test "$ac_cv___builtin_expect" = "yes"; then
    AC_DEFINE(HAVE___BUILTIN_EXPECT, 1, [define if your compiler has __builtin_expect])
  fi
  AC_MSG_RESULT($ac_cv___builtin_expect)
])
