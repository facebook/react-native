SUBDIRS = .

lib_LTLIBRARIES = libfollyinit.la

if HAVE_LIBDWARF
FOLLY_SYMBOLIZER=$(top_builddir)/experimental/symbolizer/libfollysymbolizer.la
endif

libfollyinit_la_SOURCES = Init.cpp
libfollyinit_la_LIBADD = $(top_builddir)/libfolly.la $(FOLLY_SYMBOLIZER)
libfollyinit_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION)
