// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <stdarg.h>
#include <stdio.h>

int vsnprintf_safe(char *str, size_t str_len, const char *format, va_list args);