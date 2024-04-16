AC_DEFUN([GCC_AS_CFI_PSEUDO_OP],
[AC_CACHE_CHECK([assembler .cfi pseudo-op support],
    gcc_cv_as_cfi_pseudo_op, [
    gcc_cv_as_cfi_pseudo_op=unknown
    AC_TRY_COMPILE([asm (".cfi_sections\n\t.cfi_startproc\n\t.cfi_endproc");],,
		   [gcc_cv_as_cfi_pseudo_op=yes],
		   [gcc_cv_as_cfi_pseudo_op=no])
 ])
 if test "x$gcc_cv_as_cfi_pseudo_op" = xyes; then
    AC_DEFINE(HAVE_AS_CFI_PSEUDO_OP, 1,
	      [Define if your assembler supports .cfi_* directives.])
 fi
])
