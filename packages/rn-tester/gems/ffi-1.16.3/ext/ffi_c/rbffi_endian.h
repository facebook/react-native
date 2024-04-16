#ifndef JFFI_ENDIAN_H
#define JFFI_ENDIAN_H

#ifndef _MSC_VER
#include <sys/param.h>
#endif

#include <sys/types.h>

#if defined(__linux__) || defined(__CYGWIN__) || defined(__GNU__) || defined(__GLIBC__) || defined(__HAIKU__)
# include <endian.h>
# if !defined(LITTLE_ENDIAN) && defined(__LITTLE_ENDIAN)
#  define LITTLE_ENDIAN __LITTLE_ENDIAN
# endif
# if !defined(BIG_ENDIAN) && defined(__BIG_ENDIAN)
#  define BIG_ENDIAN __BIG_ENDIAN
# endif
# if !defined(BYTE_ORDER) && defined(__BYTE_ORDER)
#  define BYTE_ORDER __BYTE_ORDER
# endif
#endif

#ifdef __sun
# include <sys/byteorder.h>
# define LITTLE_ENDIAN 1234
# define BIG_ENDIAN 4321
# if defined(_BIG_ENDIAN)
#  define BYTE_ORDER BIG_ENDIAN
# elif defined(_LITTLE_ENDIAN)
#  define BYTE_ORDER LITTLE_ENDIAN
# else
#  error "Cannot determine endian-ness"
# endif
#endif

#if defined(_AIX) && !defined(BYTE_ORDER)
# define LITTLE_ENDIAN 1234
# define BIG_ENDIAN 4321
# if defined(__BIG_ENDIAN__)
#  define BYTE_ORDER BIG_ENDIAN
# elif defined(__LITTLE_ENDIAN__)
#  define BYTE_ORDER LITTLE_ENDIAN
# else
#  error "Cannot determine endian-ness"
# endif
#endif

#if defined(_WIN32)
# define LITTLE_ENDIAN 1234
# define BIG_ENDIAN 4321
# define BYTE_ORDER LITTLE_ENDIAN
#endif

#if !defined(BYTE_ORDER) || !defined(LITTLE_ENDIAN) || !defined(BIG_ENDIAN)
#  error "Cannot determine the endian-ness of this platform"
#endif

#endif /* JFFI_ENDIAN_H */

