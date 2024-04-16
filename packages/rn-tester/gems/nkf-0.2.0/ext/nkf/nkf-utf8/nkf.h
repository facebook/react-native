/*
 *
 * nkf.h - Header file for nkf
 *
 */

#ifndef NKF_H
#define NKF_H

/* Wrapper of configurations */

#ifndef MIME_DECODE_DEFAULT
#define MIME_DECODE_DEFAULT STRICT_MIME
#endif
#ifndef X0201_DEFAULT
#define X0201_DEFAULT TRUE
#endif

#if defined(DEFAULT_NEWLINE) && DEFAULT_NEWLINE == 0x0D0A
#elif defined(DEFAULT_NEWLINE) && DEFAULT_NEWLINE == 0x0D
#else
#define DEFAULT_NEWLINE 0x0A
#endif
#ifdef HELP_OUTPUT_STDERR
#define HELP_OUTPUT stderr
#else
#define HELP_OUTPUT stdout
#endif


/* Compatibility definitions */

#ifdef nkf_char
#elif defined(INT_IS_SHORT)
typedef long nkf_char;
#define NKF_INT32_C(n)   (n##L)
#else
typedef int nkf_char;
#define NKF_INT32_C(n)   (n)
#endif

#if (defined(__TURBOC__) || defined(_MSC_VER) || defined(LSI_C) || (defined(__WATCOMC__) && defined(__386__) && !defined(__LINUX__)) || defined(__MINGW32__) || defined(__EMX__) || defined(__MSDOS__) || defined(__WINDOWS__) || defined(__DOS__) || defined(__OS2__)) && !defined(MSDOS)
#define MSDOS
#if (defined(__Win32__) || defined(_WIN32)) && !defined(__WIN32__)
#define __WIN32__
#endif
#endif

#ifdef PERL_XS
#undef OVERWRITE
#endif

#ifndef PERL_XS
#include <stdio.h>
#endif

#include <stdlib.h>
#include <string.h>

#if defined(MSDOS) || defined(__OS2__)
#include <fcntl.h>
#include <io.h>
#if defined(_MSC_VER) || defined(__WATCOMC__)
#define mktemp _mktemp
#endif
#endif

#ifdef MSDOS
#ifdef LSI_C
#define setbinmode(fp) fsetbin(fp)
#elif defined(__DJGPP__)
#include <libc/dosio.h>
void  setbinmode(FILE *fp)
{
    /* we do not use libc's setmode(), which changes COOKED/RAW mode in device. */
    int fd, m;
    fd = fileno(fp);
    m = (__file_handle_modes[fd] & (~O_TEXT)) | O_BINARY;
    __file_handle_set(fd, m);
}
#else /* Microsoft C, Turbo C */
#define setbinmode(fp) setmode(fileno(fp), O_BINARY)
#endif
#else /* UNIX */
#define setbinmode(fp) (void)(fp)
#endif

#ifdef _IOFBF /* SysV and MSDOS, Windows */
#define       setvbuffer(fp, buf, size)       setvbuf(fp, buf, _IOFBF, size)
#else /* BSD */
#define       setvbuffer(fp, buf, size)       setbuffer(fp, buf, size)
#endif

/*Borland C++ 4.5 EasyWin*/
#if defined(__TURBOC__) && defined(_Windows) && !defined(__WIN32__) /*Easy Win */
#define         EASYWIN
#ifndef __WIN16__
#define __WIN16__
#endif
#include <windows.h>
#endif

#ifdef OVERWRITE
/* added by satoru@isoternet.org */
#if defined(__EMX__)
#include <sys/types.h>
#endif
#include <sys/stat.h>
#if !defined(MSDOS) || defined(__DJGPP__) /* UNIX, djgpp */
#include <unistd.h>
#if defined(__WATCOMC__)
#include <sys/utime.h>
#else
#include <utime.h>
#endif
#else /* defined(MSDOS) */
#ifdef __WIN32__
#ifdef __BORLANDC__ /* BCC32 */
#include <utime.h>
#else /* !defined(__BORLANDC__) */
#include <sys/utime.h>
#endif /* (__BORLANDC__) */
#else /* !defined(__WIN32__) */
#if defined(_MSC_VER) || defined(__MINGW32__) || defined(__WATCOMC__) || defined(__OS2__) || defined(__EMX__) || defined(__IBMC__) || defined(__IBMCPP__)  /* VC++, MinGW, Watcom, emx+gcc, IBM VAC++ */
#include <sys/utime.h>
#elif defined(__TURBOC__) /* BCC */
#include <utime.h>
#elif defined(LSI_C) /* LSI C */
#endif /* (__WIN32__) */
#endif
#endif
#endif

#if !defined(DEFAULT_CODE_JIS) && !defined(DEFAULT_CODE_SJIS) && \
	!defined(DEFAULT_CODE_WINDOWS_31J) && !defined(DEFAULT_CODE_EUC) && \
	!defined(DEFAULT_CODE_UTF8) && !defined(DEFAULT_CODE_LOCALE)
#define DEFAULT_CODE_LOCALE
#endif

#ifdef DEFAULT_CODE_LOCALE

#if defined(__WIN32__) /* not win32 should be posix */
# ifndef HAVE_LOCALE_H
#  define HAVE_LOCALE_H
# endif
#elif defined(__OS2__)
# undef HAVE_LANGINFO_H /* We do not use kLIBC's langinfo. */
# ifndef HAVE_LOCALE_H
#  define HAVE_LOCALE_H
# endif
#elif defined(MSDOS)
# ifndef HAVE_LOCALE_H
#  define HAVE_LOCALE_H
# endif
#elif defined(__BIONIC__) /* bionic doesn't have locale */
#else
# ifndef HAVE_LANGINFO_H
#  define HAVE_LANGINFO_H
# endif
# ifndef HAVE_LOCALE_H
#  define HAVE_LOCALE_H
# endif
#endif

#ifdef HAVE_LANGINFO_H
#include <langinfo.h>
#endif
#ifdef HAVE_LOCALE_H
#include <locale.h>
#endif

#endif /* DEFAULT_CODE_LOCALE */

#define         FALSE   0
#define         TRUE    1

#ifndef ARG_UNUSED
#if defined(__GNUC__)
#  define ARG_UNUSED  __attribute__ ((unused))
#else
#  define ARG_UNUSED
#endif
#endif

#ifdef WIN32DLL
#include "nkf32.h"
#endif

#endif /* NKF_H */
