# TODO(csilvers): it would be better to actually try to link against
# -pthreads, to make sure it defines these methods, but that may be
# too hard, since pthread support is really tricky.

# Check for support for pthread_rwlock_init() etc.
# These aren't posix, but are widely supported.  To get them on linux,
# you need to define _XOPEN_SOURCE first, so this check assumes your
# application does that.
#
# Note: OS X (as of 6/1/06) seems to support pthread_rwlock, but
# doesn't define PTHREAD_RWLOCK_INITIALIZER.  Therefore, we don't test
# that particularly macro.  It's probably best if you don't use that
# macro in your code either.

AC_DEFUN([AC_RWLOCK],
[AC_CACHE_CHECK(support for pthread_rwlock_* functions,
ac_cv_rwlock,
[AC_LANG_SAVE
 AC_LANG_C
 AC_TRY_COMPILE([#define _XOPEN_SOURCE 500
                 #include <pthread.h>],
		[pthread_rwlock_t l; pthread_rwlock_init(&l, NULL);
                 pthread_rwlock_rdlock(&l); 
                 return 0;],
                ac_cv_rwlock=yes, ac_cv_rwlock=no)
 AC_LANG_RESTORE
])
if test "$ac_cv_rwlock" = yes; then
  AC_DEFINE(HAVE_RWLOCK,1,[define if the compiler implements pthread_rwlock_*])
fi
])
