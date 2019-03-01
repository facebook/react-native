# We want to access the "PC" (Program Counter) register from a struct
# ucontext.  Every system has its own way of doing that.  We try all the
# possibilities we know about.  Note REG_PC should come first (REG_RIP
# is also defined on solaris, but does the wrong thing).

# OpenBSD doesn't have ucontext.h, but we can get PC from ucontext_t
# by using signal.h.

# The first argument of AC_PC_FROM_UCONTEXT will be invoked when we
# cannot find a way to obtain PC from ucontext.

AC_DEFUN([AC_PC_FROM_UCONTEXT],
  [AC_CHECK_HEADERS(ucontext.h)
   AC_CHECK_HEADERS(sys/ucontext.h)       # ucontext on OS X 10.6 (at least)
   AC_MSG_CHECKING([how to access the program counter from a struct ucontext])
   pc_fields="           uc_mcontext.gregs[[REG_PC]]"  # Solaris x86 (32 + 64 bit)
   pc_fields="$pc_fields uc_mcontext.gregs[[REG_EIP]]" # Linux (i386)
   pc_fields="$pc_fields uc_mcontext.gregs[[REG_RIP]]" # Linux (x86_64)
   pc_fields="$pc_fields uc_mcontext.sc_ip"            # Linux (ia64)
   pc_fields="$pc_fields uc_mcontext.uc_regs->gregs[[PT_NIP]]" # Linux (ppc)
   pc_fields="$pc_fields uc_mcontext.gregs[[R15]]"     # Linux (arm old [untested])
   pc_fields="$pc_fields uc_mcontext.arm_pc"           # Linux (arm new [untested])
   pc_fields="$pc_fields uc_mcontext.mc_eip"           # FreeBSD (i386)
   pc_fields="$pc_fields uc_mcontext.mc_rip"           # FreeBSD (x86_64 [untested])
   pc_fields="$pc_fields uc_mcontext.__gregs[[_REG_EIP]]"  # NetBSD (i386)
   pc_fields="$pc_fields uc_mcontext.__gregs[[_REG_RIP]]"  # NetBSD (x86_64)
   pc_fields="$pc_fields uc_mcontext->ss.eip"          # OS X (i386, <=10.4)
   pc_fields="$pc_fields uc_mcontext->__ss.__eip"      # OS X (i386, >=10.5)
   pc_fields="$pc_fields uc_mcontext->ss.rip"          # OS X (x86_64)
   pc_fields="$pc_fields uc_mcontext->__ss.__rip"      # OS X (>=10.5 [untested])
   pc_fields="$pc_fields uc_mcontext->ss.srr0"         # OS X (ppc, ppc64 [untested])
   pc_fields="$pc_fields uc_mcontext->__ss.__srr0"     # OS X (>=10.5 [untested])
   pc_field_found=false
   for pc_field in $pc_fields; do
     if ! $pc_field_found; then
       if test "x$ac_cv_header_sys_ucontext_h" = xyes; then
         AC_TRY_COMPILE([#define _GNU_SOURCE 1
                         #include <sys/ucontext.h>],
                        [ucontext_t u; return u.$pc_field == 0;],
                        AC_DEFINE_UNQUOTED(PC_FROM_UCONTEXT, $pc_field,
                                           How to access the PC from a struct ucontext)
                        AC_MSG_RESULT([$pc_field])
                        pc_field_found=true)
       else
         AC_TRY_COMPILE([#define _GNU_SOURCE 1
                         #include <ucontext.h>],
                        [ucontext_t u; return u.$pc_field == 0;],
                        AC_DEFINE_UNQUOTED(PC_FROM_UCONTEXT, $pc_field,
                                           How to access the PC from a struct ucontext)
                        AC_MSG_RESULT([$pc_field])
                        pc_field_found=true)
       fi
     fi
   done
   if ! $pc_field_found; then
     pc_fields="           sc_eip"  # OpenBSD (i386)
     pc_fields="$pc_fields sc_rip"  # OpenBSD (x86_64)
     for pc_field in $pc_fields; do
       if ! $pc_field_found; then
         AC_TRY_COMPILE([#include <signal.h>],
                        [ucontext_t u; return u.$pc_field == 0;],
                        AC_DEFINE_UNQUOTED(PC_FROM_UCONTEXT, $pc_field,
                                           How to access the PC from a struct ucontext)
                        AC_MSG_RESULT([$pc_field])
                        pc_field_found=true)
       fi
     done
   fi
   if ! $pc_field_found; then
     [$1]
   fi])
