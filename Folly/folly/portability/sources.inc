LIBLETNAME = FollyPortability
LIBLET_NO_PRECOMP = 1

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactWindows\make.inc

SOURCES_SHARED = \
	..\SysMman.cpp \
	..\BitsFunctexcept.cpp \

SOURCES_WIN32 = $(SOURCES_SHARED) \

SOURCES_WINRT = $(SOURCES_SHARED) \
