LIBLETNAME = FollyLang

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

SOURCES_SHARED = \
	..\Assume.cpp \
	..\ColdClass.cpp \

SOURCES_WIN32 = $(SOURCES_SHARED) \

SOURCES_ANDROID = \
        $(SOURCES_SHARED) \
	..\SafeAssert.cpp \

SOURCES_WINRT = $(SOURCES_SHARED) \

