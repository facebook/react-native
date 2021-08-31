LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := libevent

LOCAL_SRC_FILES := event.c \
  	buffer.c \
	bufferevent.c \
	bufferevent_filter.c \
	bufferevent_pair.c \
	bufferevent_ratelim.c \
	bufferevent_sock.c \
	epoll.c \
	evmap.c \
	evthread.c \
	evthread_pthread.c \
	evutil.c \
	evutil_rand.c \
	evutil_time.c \
	listener.c \
	log.c \
	poll.c \
	signal.c \
	strlcpy.c \
	select.c

LOCAL_CFLAGS := -DNDEBUG -O2 -Wno-unused-function -Wno-unneeded-internal-declaration -std=c11

LOCAL_C_INCLUDES := $(LOCAL_PATH)/include/
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/include/

# link against libc as well
LOCAL_EXPORT_LDLIBS := -lc

include $(BUILD_STATIC_LIBRARY)
