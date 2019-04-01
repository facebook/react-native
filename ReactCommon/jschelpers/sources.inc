LIBLETNAME = JSCHelpers

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

INCLUDES = $(INCLUDES); \
	$(PKGJAVASCRIPTCORE_TEMP)\build\native\include; \

SOURCES_SHARED = \
	..\Unicode.cpp \

!ifndef NOJSC
SOURCES_SHARED = \
	$(SOURCES_SHARED) \
	..\JSCJSException.cpp \
	..\JSCHelpers.cpp \
	..\JSCWrapper.cpp \
	..\systemJSCWrapper.cpp \
	..\Value.cpp \
!endif

SOURCES_WIN32 = $(SOURCES_SHARED) \

SOURCES_ANDROID = \
    ..\JSCHelpers.cpp \
    ..\Unicode.cpp \
    ..\Value.cpp \
	..\JSCDroidSamplingProfiler.cpp \

SOURCES_WINRT = $(SOURCES_SHARED) \
