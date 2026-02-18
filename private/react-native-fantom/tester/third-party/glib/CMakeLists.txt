# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(GLIB_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/glib-2.78.3)

# glib core sources
file(GLOB GLIB_CORE_SOURCES
    ${GLIB_SRC_DIR}/glib/*.c
)

# Exclude platform-specific and unnecessary files
list(FILTER GLIB_CORE_SOURCES EXCLUDE REGEX "glib/tests/")
list(FILTER GLIB_CORE_SOURCES EXCLUDE REGEX "win32")
list(FILTER GLIB_CORE_SOURCES EXCLUDE REGEX "glib/gspawn-helper")

# gobject sources
file(GLOB GOBJECT_SOURCES
    ${GLIB_SRC_DIR}/gobject/*.c
)
list(FILTER GOBJECT_SOURCES EXCLUDE REGEX "gobject/tests/")

add_library(glib_core STATIC ${GLIB_CORE_SOURCES})
target_include_directories(glib_core
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${GLIB_SRC_DIR}
        ${GLIB_SRC_DIR}/glib
)
target_compile_definitions(glib_core
    PUBLIC
        GLIB_COMPILATION=1
        G_LOG_DOMAIN="GLib"
        _GNU_SOURCE=1
        _POSIX_C_SOURCE=200809L
    PRIVATE
        HAVE_CONFIG_H=1
)
target_compile_options(glib_core
    PRIVATE
        -Wno-sign-compare
        -Wno-unused-parameter
        -Wno-implicit-fallthrough
        -Wno-missing-field-initializers
)
target_link_libraries(glib_core PUBLIC ffi pthread)

add_library(gobject STATIC ${GOBJECT_SOURCES})
target_include_directories(gobject
    PUBLIC
        ${GLIB_SRC_DIR}
        ${GLIB_SRC_DIR}/gobject
)
target_compile_definitions(gobject
    PUBLIC
        GOBJECT_COMPILATION=1
        G_LOG_DOMAIN="GLib-GObject"
    PRIVATE
        HAVE_CONFIG_H=1
        _GNU_SOURCE=1
)
target_compile_options(gobject
    PRIVATE
        -Wno-sign-compare
        -Wno-unused-parameter
        -Wno-implicit-fallthrough
        -Wno-missing-field-initializers
)
target_link_libraries(gobject PUBLIC glib_core ffi)

# Convenience alias matching what pango expects
add_library(glib ALIAS glib_core)
