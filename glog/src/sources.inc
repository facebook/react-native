LIBLETNAME = glog
LIBLET_NO_PRECOMP = 1

!include $(WAREHOUSEIMPORTDIR)\libletmake\x-none\nmake\make.inc

SOURCES_SHARED = \
    ..\demangle.cc \
    ..\logging.cc \
    ..\raw_logging.cc \
    ..\signalhandler.cc \
    ..\symbolize.cc \
    ..\utilities.cc \
    ..\vlog_is_on.cc \

SOURCES_ANDROID = \
    $(SOURCES_SHARED) \
