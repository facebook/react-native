# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -DNDEBUG
        -O2
        -Wno-unused-function
        -Wno-unneeded-internal-declaration
        -std=c11)

add_library(event
        STATIC
        event.c
        buffer.c
        bufferevent.c
        bufferevent_filter.c
        bufferevent_pair.c
        bufferevent_ratelim.c
        bufferevent_sock.c
        epoll.c
        evmap.c
        evthread.c
        evthread_pthread.c
        evutil.c
        evutil_rand.c
        evutil_time.c
        listener.c
        log.c
        poll.c
        signal.c
        strlcpy.c
        select.c)

target_include_directories(event PUBLIC include)

# link against libc as well
target_link_libraries(event c)
