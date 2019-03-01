ACLOCAL_AMFLAGS = -I m4

TESTS = iobuf_test \
        iobuf_cursor_test

check_PROGRAMS = $(TESTS)

iobuf_test_SOURCES = IOBufTest.cpp
iobuf_test_LDADD = $(top_builddir)/libfollyio.la

iobuf_cursor_test_SOURCES = IOBufCursorTest.cpp
iobuf_cursor_test_LDADD = $(top_builddir)/libfollyio.la $(top_builddir)/libfollybenchmark.la
