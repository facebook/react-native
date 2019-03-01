SUBDIRS = .

lib_LTLIBRARIES = libfollysymbolizer.la

libfollysymbolizer_la_SOURCES = \
	Elf.cpp \
	ElfCache.cpp \
	Dwarf.cpp \
	LineReader.cpp \
	SignalHandler.cpp \
	StackTrace.cpp \
	Symbolizer.cpp

libfollysymbolizer_la_LIBADD = $(top_builddir)/libfolly.la
libfollysymbolizer_la_LDFLAGS = $(AM_LDFLAGS) -version-info $(LT_VERSION)
