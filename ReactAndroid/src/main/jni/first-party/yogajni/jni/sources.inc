LIBLETNAME = yoga

!include $(OPENSOURCE_REACTNATIVE)\OfficeISS\ReactCommon\make.inc

!LISTFILES -recursive YogaHeaders = $(OPENSOURCE_REACTNATIVETARGETDIR)\include\yoga *.h

HEADERS = $(HEADERS) \
    $(YogaHeaders) \

SOURCES_SHARED = \
    ..\YGJNI.cpp \

SOURCES_ANDROID = $(SOURCES_SHARED) \
