AC_DEFUN([AX_C___SYNC_VAL_COMPARE_AND_SWAP], [
  AC_MSG_CHECKING(for __sync_val_compare_and_swap)
  AC_CACHE_VAL(ac_cv___sync_val_compare_and_swap, [
    AC_TRY_LINK(
      [],
      [int a; if (__sync_val_compare_and_swap(&a, 0, 1)) return 1; return 0;],
      ac_cv___sync_val_compare_and_swap=yes,
      ac_cv___sync_val_compare_and_swap=no
    )])
  if test "$ac_cv___sync_val_compare_and_swap" = "yes"; then
    AC_DEFINE(HAVE___SYNC_VAL_COMPARE_AND_SWAP, 1, [define if your compiler has __sync_val_compare_and_swap])
  fi
  AC_MSG_RESULT($ac_cv___sync_val_compare_and_swap)
])
