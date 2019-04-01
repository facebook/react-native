LIBLETNAME = V8Helpers

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

INCLUDES = $(INCLUDES); \
	$(PKGJAVASCRIPTCORE_TEMP)\build\native\include; \

SOURCES_ANDROID = \
	..\V8Utils.cpp \