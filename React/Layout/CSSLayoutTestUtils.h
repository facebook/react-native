/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_LAYOUT_TEXT_UTILS_H
#define __CSS_LAYOUT_TEXT_UTILS_H

#include <stdio.h>
#include <string.h>

#include "CSSMacros.h"
#include "Layout.h"

#define SMALL_WIDTH 35
#define SMALL_HEIGHT 18
#define BIG_WIDTH 172
#define BIG_HEIGHT 36
#define SMALL_TEXT "small"
#define LONG_TEXT "loooooooooong with space"
#define MEASURE_WITH_RATIO_2 "measureWithRatio2"
#define MEASURE_WITH_MATCH_PARENT "measureWithMatchParent"

CSS_EXTERN_C_BEGIN

bool test(css_node_t *style, css_node_t *expected_layout);
css_dim_t measure(void *context, float width, css_measure_mode_t widthMode, float height, css_measure_mode_t heightMode);
void init_css_node_children(css_node_t *node, int children_count);
css_node_t *new_test_css_node(void);

CSS_EXTERN_C_END

#endif
