# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(PANGO_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/pango-1.50.12)

# Core pango sources (excluding pangocairo, pangoxft, pangowin32)
file(GLOB PANGO_CORE_SOURCES ${PANGO_SRC_DIR}/pango/*.c)
list(FILTER PANGO_CORE_SOURCES EXCLUDE REGEX "pangocairo")
list(FILTER PANGO_CORE_SOURCES EXCLUDE REGEX "pangoxft")
list(FILTER PANGO_CORE_SOURCES EXCLUDE REGEX "pangowin32")
list(FILTER PANGO_CORE_SOURCES EXCLUDE REGEX "pango-utils-system")
list(FILTER PANGO_CORE_SOURCES EXCLUDE REGEX "test")

add_library(pango STATIC ${PANGO_CORE_SOURCES})

target_include_directories(pango
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${PANGO_SRC_DIR}
        ${PANGO_SRC_DIR}/pango
)

target_compile_definitions(pango
    PUBLIC
        PANGO_COMPILATION=1
        G_LOG_DOMAIN="Pango"
    PRIVATE
        HAVE_CONFIG_H=1
        _POSIX_C_SOURCE=200809L
        _GNU_SOURCE=1
        SYSCONFDIR="/etc"
        LIBDIR="/usr/lib"
)

target_compile_options(pango
    PRIVATE
        -Wno-sign-compare
        -Wno-unused-parameter
        -Wno-missing-field-initializers
        -Wno-deprecated-declarations
)

target_link_libraries(pango
    PUBLIC
        glib_core
        gobject
        fribidi
        harfbuzz
        fontconfig
)

# PangoFT2 sources
file(GLOB PANGOFT2_SOURCES ${PANGO_SRC_DIR}/pango/pangoft2*.c)
# Also include pango-ot sources
file(GLOB PANGO_OT_SOURCES ${PANGO_SRC_DIR}/pango/pango-ot*.c)

add_library(pangoft2 STATIC ${PANGOFT2_SOURCES} ${PANGO_OT_SOURCES})

target_include_directories(pangoft2
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${PANGO_SRC_DIR}
        ${PANGO_SRC_DIR}/pango
)

target_compile_definitions(pangoft2
    PRIVATE
        PANGO_COMPILATION=1
        G_LOG_DOMAIN="Pango"
        HAVE_CONFIG_H=1
        _POSIX_C_SOURCE=200809L
        _GNU_SOURCE=1
)

target_compile_options(pangoft2
    PRIVATE
        -Wno-sign-compare
        -Wno-unused-parameter
        -Wno-missing-field-initializers
        -Wno-deprecated-declarations
)

target_link_libraries(pangoft2
    PUBLIC
        pango
        freetype
)
