LIBLETNAME = double-conversion
LIBLET_NO_PRECOMP = 1

!include $(WAREHOUSEIMPORTDIR)\libletmake\x-none\nmake\make.inc

INCLUDES = $(INCLUDES); \
    $(OPENSOURCE_REACTNATIVE)\OfficeISS\double-conversion; \

SOURCES_SHARED = \
    ..\bignum.cc \
    ..\bignum-dtoa.cc \
    ..\cached-powers.cc \
    ..\diy-fp.cc \
    ..\double-conversion.cc \
    ..\fast-dtoa.cc \
    ..\fixed-dtoa.cc \
    ..\strtod.cc \

SOURCES_ANDROID = \
    $(SOURCES_SHARED) \
