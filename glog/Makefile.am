## Process this file with automake to produce Makefile.in

AUTOMAKE_OPTIONS=subdir-objects

# Make sure that when we re-make ./configure, we get the macros we need
ACLOCAL_AMFLAGS = -I m4

# This is so we can #include <glog/foo>
AM_CPPFLAGS = -I$(top_srcdir)/src

# This is mostly based on configure options
AM_CXXFLAGS =

# These are good warnings to turn on by default
if GCC
  AM_CXXFLAGS += -Wall -Wwrite-strings -Woverloaded-virtual -Wno-sign-compare
endif

# These are x86-specific, having to do with frame-pointers
if X86_64
if ENABLE_FRAME_POINTERS
  AM_CXXFLAGS += -fno-omit-frame-pointer
else
  # TODO(csilvers): check if -fomit-frame-pointer might be in $(CXXFLAGS),
  #                 before setting this.
  AM_CXXFLAGS += -DNO_FRAME_POINTER
endif
endif

if DISABLE_RTTI
  AM_CXXFLAGS += -fno-rtti
endif

glogincludedir = $(includedir)/glog
## The .h files you want to install (that is, .h files that people
## who install this package can include in their own applications.)
## We have to include both the .h and .h.in forms.  The latter we
## put in noinst_HEADERS.
gloginclude_HEADERS = src/glog/log_severity.h
nodist_gloginclude_HEADERS = src/glog/logging.h src/glog/raw_logging.h src/glog/vlog_is_on.h src/glog/stl_logging.h
noinst_HEADERS = src/glog/logging.h.in src/glog/raw_logging.h.in src/glog/vlog_is_on.h.in src/glog/stl_logging.h.in

docdir = $(prefix)/share/doc/$(PACKAGE)-$(VERSION)
## This is for HTML and other documentation you want to install.
## Add your documentation files (in doc/) in addition to these
## top-level boilerplate files.  Also add a TODO file if you have one.
dist_doc_DATA = AUTHORS COPYING ChangeLog INSTALL NEWS README README.windows \
                doc/designstyle.css doc/glog.html

## The libraries (.so's) you want to install
lib_LTLIBRARIES =

# The libraries libglog depends on.
COMMON_LIBS = $(PTHREAD_LIBS) $(GFLAGS_LIBS) $(UNWIND_LIBS)
# Compile switches for our unittest.
TEST_CFLAGS = $(GTEST_CFLAGS) $(GMOCK_CFLAGS) $(GFLAGS_CFLAGS) \
              $(MINGW_CFLAGS) $(AM_CXXFLAGS)
# Libraries for our unittest.
TEST_LIBS = $(GTEST_LIBS) $(GMOCK_LIBS) $(GFLAGS_LIBS)

## unittests you want to run when people type 'make check'.
## TESTS is for binary unittests, check_SCRIPTS for script-based unittests.
## TESTS_ENVIRONMENT sets environment variables for when you run unittest,
## but it only seems to take effect for *binary* unittests (argh!)
TESTS =
TESTS_ENVIRONMENT =
check_SCRIPTS =
# Every time you add a unittest to check_SCRIPTS, add it here too
noinst_SCRIPTS =
# Binaries used for script-based unittests.
TEST_BINARIES =

TESTS += logging_unittest
logging_unittest_SOURCES = $(gloginclude_HEADERS) \
                           src/logging_unittest.cc \
                           src/config_for_unittests.h \
                           src/mock-log.h
nodist_logging_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
logging_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
logging_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
logging_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

check_SCRIPTS += logging_striplog_test_sh
noinst_SCRIPTS += src/logging_striplog_test.sh
logging_striplog_test_sh: logging_striptest0 logging_striptest2 logging_striptest10
	$(top_srcdir)/src/logging_striplog_test.sh

check_SCRIPTS += demangle_unittest_sh
noinst_SCRIPTS += src/demangle_unittest.sh
demangle_unittest_sh: demangle_unittest
	$(builddir)/demangle_unittest  # force to create lt-demangle_unittest
	$(top_srcdir)/src/demangle_unittest.sh

check_SCRIPTS += signalhandler_unittest_sh
noinst_SCRIPTS += src/signalhandler_unittest.sh
signalhandler_unittest_sh: signalhandler_unittest
	$(builddir)/signalhandler_unittest  # force to create lt-signalhandler_unittest
	$(top_srcdir)/src/signalhandler_unittest.sh

TEST_BINARIES += logging_striptest0
logging_striptest0_SOURCES = $(gloginclude_HEADERS) \
                             src/logging_striptest_main.cc
nodist_logging_striptest0_SOURCES = $(nodist_gloginclude_HEADERS)
logging_striptest0_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
logging_striptest0_LDFLAGS = $(PTHREAD_CFLAGS)
logging_striptest0_LDADD = libglog.la $(COMMON_LIBS)

TEST_BINARIES += logging_striptest2
logging_striptest2_SOURCES = $(gloginclude_HEADERS) \
                             src/logging_striptest2.cc
nodist_logging_striptest2_SOURCES = $(nodist_gloginclude_HEADERS)
logging_striptest2_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
logging_striptest2_LDFLAGS = $(PTHREAD_CFLAGS)
logging_striptest2_LDADD = libglog.la $(COMMON_LIBS)

TEST_BINARIES += logging_striptest10
logging_striptest10_SOURCES = $(gloginclude_HEADERS) \
                              src/logging_striptest10.cc
nodist_logging_striptest10_SOURCES = $(nodist_gloginclude_HEADERS)
logging_striptest10_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
logging_striptest10_LDFLAGS = $(PTHREAD_CFLAGS)
logging_striptest10_LDADD = libglog.la $(COMMON_LIBS)

TESTS += demangle_unittest
demangle_unittest_SOURCES = $(gloginclude_HEADERS) \
                            src/demangle_unittest.cc
nodist_demangle_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
demangle_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
demangle_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
demangle_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

TESTS += stacktrace_unittest
stacktrace_unittest_SOURCES = $(gloginclude_HEADERS) \
                              src/stacktrace_unittest.cc
nodist_stacktrace_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
stacktrace_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
stacktrace_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
stacktrace_unittest_LDADD = libglog.la $(COMMON_LIBS)

TESTS += symbolize_unittest
symbolize_unittest_SOURCES = $(gloginclude_HEADERS) \
                              src/symbolize_unittest.cc
nodist_symbolize_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
symbolize_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
symbolize_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
symbolize_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

TESTS += stl_logging_unittest
stl_logging_unittest_SOURCES = $(gloginclude_HEADERS) \
                               src/stl_logging_unittest.cc
nodist_stl_logging_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
stl_logging_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
stl_logging_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
stl_logging_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

TEST_BINARIES += signalhandler_unittest
signalhandler_unittest_SOURCES = $(gloginclude_HEADERS) \
                               src/signalhandler_unittest.cc
nodist_signalhandler_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
signalhandler_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
signalhandler_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
signalhandler_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

TESTS += utilities_unittest
utilities_unittest_SOURCES = $(gloginclude_HEADERS) \
                             src/utilities_unittest.cc
nodist_utilities_unittest_SOURCES = $(nodist_gloginclude_HEADERS)
utilities_unittest_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
utilities_unittest_LDFLAGS = $(PTHREAD_CFLAGS)
utilities_unittest_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)

if HAVE_GMOCK
TESTS += mock_log_test
mock_log_test_SOURCES = $(gloginclude_HEADERS) \
                        src/mock-log_test.cc
nodist_mock_log_test_SOURCES = $(nodist_gloginclude_HEADERS)
mock_log_test_CXXFLAGS = $(PTHREAD_CFLAGS) $(TEST_CFLAGS)
mock_log_test_LDFLAGS = $(PTHREAD_CFLAGS)
mock_log_test_LDADD = libglog.la $(COMMON_LIBS) $(TEST_LIBS)
endif

## vvvv RULES TO MAKE THE LIBRARIES, BINARIES, AND UNITTESTS

lib_LTLIBRARIES += libglog.la
libglog_la_SOURCES = $(gloginclude_HEADERS) \
                       src/logging.cc src/raw_logging.cc src/vlog_is_on.cc \
                       src/utilities.cc src/utilities.h \
                       src/demangle.cc src/demangle.h \
                       src/stacktrace.h \
                       src/stacktrace_generic-inl.h \
                       src/stacktrace_libunwind-inl.h \
                       src/stacktrace_powerpc-inl.h \
                       src/stacktrace_x86-inl.h \
                       src/stacktrace_x86_64-inl.h \
                       src/symbolize.cc src/symbolize.h \
                       src/signalhandler.cc \
                       src/base/mutex.h src/base/googleinit.h \
                       src/base/commandlineflags.h src/googletest.h
nodist_libglog_la_SOURCES = $(nodist_gloginclude_HEADERS)

libglog_la_CXXFLAGS = $(PTRHEAD_CFLAGS) $(GFLAGS_CFLAGS) $(MINGW_CFLAGS) \
                      $(AM_CXXFLAGS) -DNDEBUG
libglog_la_LDFLAGS = $(PTRHEAD_CFLAGS) $(GFLAGS_LDFLAGS)
libglog_la_LIBADD = $(COMMON_LIBS)

## The location of the windows project file for each binary we make
WINDOWS_PROJECTS = google-glog.sln
WINDOWS_PROJECTS += vsprojects/libglog/libglog.vcproj
WINDOWS_PROJECTS += vsprojects/logging_unittest/logging_unittest.vcproj
WINDOWS_PROJECTS += vsprojects/libglog_static/libglog_static.vcproj
WINDOWS_PROJECTS += vsprojects/logging_unittest_static/logging_unittest_static.vcproj

## ^^^^ END OF RULES TO MAKE THE LIBRARIES, BINARIES, AND UNITTESTS


## This should always include $(TESTS), but may also include other
## binaries that you compile but don't want automatically installed.
noinst_PROGRAMS = $(TESTS) $(TEST_BINARIES)

rpm: dist-gzip packages/rpm.sh packages/rpm/rpm.spec
	@cd packages && ./rpm.sh ${PACKAGE} ${VERSION}

deb: dist-gzip packages/deb.sh packages/deb/*
	@cd packages && ./deb.sh ${PACKAGE} ${VERSION}

# Windows wants write permission to .vcproj files and maybe even sln files.
dist-hook:
	test -e "$(distdir)/vsprojects" \
	   && chmod -R u+w $(distdir)/*.sln $(distdir)/vsprojects/

libtool: $(LIBTOOL_DEPS)
	$(SHELL) ./config.status --recheck

EXTRA_DIST = packages/rpm.sh packages/rpm/rpm.spec \
	packages/deb.sh packages/deb/* \
	$(SCRIPTS) src/logging_unittest.err src/demangle_unittest.txt \
	src/windows/config.h src/windows/port.h src/windows/port.cc \
	src/windows/preprocess.sh \
	src/windows/glog/log_severity.h src/windows/glog/logging.h \
	src/windows/glog/raw_logging.h src/windows/glog/stl_logging.h \
	src/windows/glog/vlog_is_on.h \
	$(WINDOWS_PROJECTS)

CLEANFILES = core demangle.dm demangle.nm signalhandler.out* \
	signalhandler_unittest.*.log.INFO.*

# Add pkgconfig file
pkgconfigdir = $(libdir)/pkgconfig
pkgconfig_DATA = libglog.pc
