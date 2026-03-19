/* glibconfig.h - generated for Fantom build (Linux x86_64) */
#ifndef GLIBCONFIG_H
#define GLIBCONFIG_H

#include <limits.h>
#include <float.h>
#include <stddef.h>
#include <stdint.h>

#define GLIB_HAVE_ALLOCA_H 1

typedef int8_t gint8;
typedef uint8_t guint8;
typedef int16_t gint16;
typedef uint16_t guint16;
typedef int32_t gint32;
typedef uint32_t guint32;
typedef int64_t gint64;
typedef uint64_t guint64;

#define G_GINT16_MODIFIER "h"
#define G_GINT16_FORMAT "hi"
#define G_GUINT16_FORMAT "hu"
#define G_GINT32_MODIFIER ""
#define G_GINT32_FORMAT "i"
#define G_GUINT32_FORMAT "u"
#define G_GINT64_MODIFIER "l"
#define G_GINT64_FORMAT "li"
#define G_GUINT64_FORMAT "lu"
#define G_GINT64_CONSTANT(val) (val##L)
#define G_GUINT64_CONSTANT(val) (val##UL)

#define GLIB_SIZEOF_VOID_P 8
#define GLIB_SIZEOF_LONG 8
#define GLIB_SIZEOF_SIZE_T 8
#define GLIB_SIZEOF_SSIZE_T 8

typedef signed long gssize;
typedef unsigned long gsize;
#define G_GSIZE_MODIFIER "l"
#define G_GSSIZE_MODIFIER "l"
#define G_GSIZE_FORMAT "lu"
#define G_GSSIZE_FORMAT "li"
#define G_MAXSIZE G_MAXULONG

#define GPOINTER_TO_INT(p) ((gint)(glong)(p))
#define GPOINTER_TO_UINT(p) ((guint)(gulong)(p))
#define GINT_TO_POINTER(i) ((gpointer)(glong)(i))
#define GUINT_TO_POINTER(u) ((gpointer)(gulong)(u))

typedef signed long gintptr;
typedef unsigned long guintptr;
#define G_GINTPTR_MODIFIER "l"
#define G_GINTPTR_FORMAT "li"
#define G_GUINTPTR_FORMAT "lu"

#define GLIB_MAJOR_VERSION 2
#define GLIB_MINOR_VERSION 78
#define GLIB_MICRO_VERSION 3

#define G_OS_UNIX 1

#define G_VA_COPY va_copy

#ifdef __LP64__
#define GLIB_SIZEOF_LONG 8
#define GLIB_SIZEOF_SIZE_T 8
#define GLIB_SIZEOF_SSIZE_T 8
#endif

typedef unsigned int GQuark;

#define G_BYTE_ORDER G_LITTLE_ENDIAN

#define GINT16_TO_LE(val) ((gint16)(val))
#define GUINT16_TO_LE(val) ((guint16)(val))
#define GINT16_TO_BE(val) ((gint16)GUINT16_SWAP_LE_BE(val))
#define GUINT16_TO_BE(val) (GUINT16_SWAP_LE_BE(val))
#define GINT32_TO_LE(val) ((gint32)(val))
#define GUINT32_TO_LE(val) ((guint32)(val))
#define GINT32_TO_BE(val) ((gint32)GUINT32_SWAP_LE_BE(val))
#define GUINT32_TO_BE(val) (GUINT32_SWAP_LE_BE(val))
#define GINT64_TO_LE(val) ((gint64)(val))
#define GUINT64_TO_LE(val) ((guint64)(val))
#define GINT64_TO_BE(val) ((gint64)GUINT64_SWAP_LE_BE(val))
#define GUINT64_TO_BE(val) (GUINT64_SWAP_LE_BE(val))

#define GLONG_TO_LE(val) ((glong)GINT64_TO_LE(val))
#define GULONG_TO_LE(val) ((gulong)GUINT64_TO_LE(val))
#define GLONG_TO_BE(val) ((glong)GINT64_TO_BE(val))
#define GULONG_TO_BE(val) ((gulong)GUINT64_TO_BE(val))
#define GINT_TO_LE(val) ((gint)GINT32_TO_LE(val))
#define GUINT_TO_LE(val) ((guint)GUINT32_TO_LE(val))
#define GINT_TO_BE(val) ((gint)GINT32_TO_BE(val))
#define GUINT_TO_BE(val) ((guint)GUINT32_TO_BE(val))
#define GSIZE_TO_LE(val) ((gsize)GUINT64_TO_LE(val))
#define GSSIZE_TO_LE(val) ((gssize)GINT64_TO_LE(val))
#define GSIZE_TO_BE(val) ((gsize)GUINT64_TO_BE(val))
#define GSSIZE_TO_BE(val) ((gssize)GINT64_TO_BE(val))

#define G_HAVE_GINT64 1

#define G_MODULE_SUFFIX "so"

typedef int GPid;
#define G_PID_FORMAT "i"

#define GLIB_SYSDEF_POLLIN =1
#define GLIB_SYSDEF_POLLOUT =4
#define GLIB_SYSDEF_POLLPRI =2
#define GLIB_SYSDEF_POLLHUP =16
#define GLIB_SYSDEF_POLLERR =8
#define GLIB_SYSDEF_POLLNVAL =32

#define G_HAVE_GROWING_STACK 0
#define G_GNUC_INTERNAL __attribute__((visibility("hidden")))

#define G_THREADS_ENABLED 1
#define G_THREADS_IMPL_POSIX 1

typedef struct _GMutex {
  union {
    void *p;
    unsigned int i[2];
  };
} GMutex;

typedef union _GSystemThread {
  char data[8];
  double dummy_double;
  void *dummy_pointer;
  long dummy_long;
} GSystemThread;

#define GLIB_HAVE_SYSTEM_THREAD_STRUCT 1

#define G_ATOMIC_LOCK_FREE 1

#define G_GNUC_BEGIN_IGNORE_DEPRECATIONS \
  _Pragma("GCC diagnostic push") _Pragma("GCC diagnostic ignored \"-Wdeprecated-declarations\"")
#define G_GNUC_END_IGNORE_DEPRECATIONS _Pragma("GCC diagnostic pop")

#endif /* GLIBCONFIG_H */
