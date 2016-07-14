/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "CSSLayoutTestUtils.h"
#include <stdlib.h>

#ifdef _MSC_VER
#include <float.h>
#define isnan _isnan

/* define fmaxf & fminf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
__forceinline const float fminf(const float a, const float b) {
  return (a < b) ? a : b;
}
#endif
#endif

static bool eq(float a, float b) {
  return fabs(a - b) < 0.0001;
}

static bool are_layout_equal(css_node_t *a, css_node_t *b) {
  if (!eq(a->layout.dimensions[CSS_WIDTH], b->layout.dimensions[CSS_WIDTH]) ||
      !eq(a->layout.dimensions[CSS_HEIGHT], b->layout.dimensions[CSS_HEIGHT]) ||
      !eq(a->layout.position[CSS_TOP], b->layout.position[CSS_TOP]) ||
      !eq(a->layout.position[CSS_LEFT], b->layout.position[CSS_LEFT]) ||
      !eq(a->children_count, b->children_count)) {
    return false;
  }
  for (int i = 0; i < a->children_count; ++i) {
    if (!are_layout_equal(a->get_child(a->context, i), b->get_child(b->context, i))) {
      return false;
    }
  }
  return true;
}

css_dim_t measure(void *context, float width, css_measure_mode_t widthMode, float height, css_measure_mode_t heightMode) {
  const char *text = (const char *)context;
  css_dim_t dim;
  if (strcmp(text, SMALL_TEXT) == 0) {
    if (widthMode == CSS_MEASURE_MODE_UNDEFINED) {
      width = 1000000;
    }
    dim.dimensions[CSS_WIDTH] = fminf(SMALL_WIDTH, width);
    dim.dimensions[CSS_HEIGHT] = SMALL_WIDTH > width ? BIG_HEIGHT : SMALL_HEIGHT;
    return dim;
  }
  if (strcmp(text, LONG_TEXT) == 0) {
    if (widthMode == CSS_MEASURE_MODE_UNDEFINED) {
      width = 1000000;
    }
    dim.dimensions[CSS_WIDTH] = fminf(BIG_WIDTH, width);
    dim.dimensions[CSS_HEIGHT] = BIG_WIDTH > width ? BIG_HEIGHT : SMALL_HEIGHT;
    return dim;
  }

  if (strcmp(text, MEASURE_WITH_RATIO_2) == 0) {
    if (widthMode == CSS_MEASURE_MODE_EXACTLY) {
      dim.dimensions[CSS_WIDTH] = width;
      dim.dimensions[CSS_HEIGHT] = width * 2;
    } else if (heightMode == CSS_MEASURE_MODE_EXACTLY) {
      dim.dimensions[CSS_WIDTH] = height * 2;
      dim.dimensions[CSS_HEIGHT] = height;
    } else if (widthMode == CSS_MEASURE_MODE_AT_MOST) {
      dim.dimensions[CSS_WIDTH] = width;
      dim.dimensions[CSS_HEIGHT] = width * 2;
    } else if (heightMode == CSS_MEASURE_MODE_AT_MOST) {
      dim.dimensions[CSS_WIDTH] = height * 2;
      dim.dimensions[CSS_HEIGHT] = height;
    } else {
      dim.dimensions[CSS_WIDTH] = 99999;
      dim.dimensions[CSS_HEIGHT] = 99999;
    }
    return dim;
  }

  if (strcmp(text, MEASURE_WITH_MATCH_PARENT) == 0) {
    if (widthMode == CSS_MEASURE_MODE_UNDEFINED) {
      width = 99999;
    }
    if (heightMode == CSS_MEASURE_MODE_UNDEFINED) {
      height = 99999;
    }
    dim.dimensions[CSS_WIDTH] = width;
    dim.dimensions[CSS_HEIGHT] = height;
    return dim;
  }

  // Should not go here
  dim.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
  dim.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;
  return dim;
}

bool test(css_node_t *style, css_node_t *expected_layout) {
  layoutNode(style, CSS_UNDEFINED, CSS_UNDEFINED, (css_direction_t)-1);
  return are_layout_equal(style, expected_layout);
}

static css_node_t* get_child(void *context, int i) {
  css_node_t* children = (css_node_t*)context;
  return &children[i];
}

static bool is_dirty(void *context) {
  (void)context; // remove unused warning
  return true;
}

static void init_test_css_node(css_node_t *node) {
  node->get_child = get_child;
  node->is_dirty = is_dirty;
}

css_node_t *new_test_css_node(void) {
  css_node_t *node = new_css_node();
  init_test_css_node(node);
  return node;
}

void init_css_node_children(css_node_t *node, int children_count) {
  node->context = calloc((size_t)children_count, sizeof(css_node_t));
  for (int i = 0; i < children_count; ++i) {
    init_css_node(node->get_child(node->context, i));
    init_test_css_node(node->get_child(node->context, i));
  }
  node->children_count = children_count;
}
