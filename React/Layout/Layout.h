/**
 * @generated SignedSource<<58298c7a8815a8675e970b0347dedfed>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in from github!                       !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Go to https://github.com/facebook/css-layout            !!
 * !! 2) Make a pull request and get it merged                   !!
 * !! 3) Execute ./import.sh to pull in the latest version       !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __LAYOUT_H
#define __LAYOUT_H

#include <math.h>
#include <stdbool.h>
#define CSS_UNDEFINED NAN

typedef enum {
  CSS_FLEX_DIRECTION_COLUMN = 0,
  CSS_FLEX_DIRECTION_ROW
} css_flex_direction_t;

typedef enum {
  CSS_JUSTIFY_FLEX_START = 0,
  CSS_JUSTIFY_CENTER,
  CSS_JUSTIFY_FLEX_END,
  CSS_JUSTIFY_SPACE_BETWEEN,
  CSS_JUSTIFY_SPACE_AROUND
} css_justify_t;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum {
  CSS_ALIGN_AUTO = 0,
  CSS_ALIGN_FLEX_START,
  CSS_ALIGN_CENTER,
  CSS_ALIGN_FLEX_END,
  CSS_ALIGN_STRETCH
} css_align_t;

typedef enum {
  CSS_POSITION_RELATIVE = 0,
  CSS_POSITION_ABSOLUTE
} css_position_type_t;

typedef enum {
  CSS_NOWRAP = 0,
  CSS_WRAP
} css_wrap_type_t;

// Note: left and top are shared between position[2] and position[4], so
// they have to be before right and bottom.
typedef enum {
  CSS_LEFT = 0,
  CSS_TOP,
  CSS_RIGHT,
  CSS_BOTTOM,
  CSS_POSITION_COUNT
} css_position_t;

typedef enum {
  CSS_WIDTH = 0,
  CSS_HEIGHT
} css_dimension_t;

typedef struct {
  float position[2];
  float dimensions[2];

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  bool should_update;
  float last_requested_dimensions[2];
  float last_parent_max_width;
  float last_dimensions[2];
  float last_position[2];
} css_layout_t;

typedef struct {
  float dimensions[2];
} css_dim_t;

typedef struct {
  css_flex_direction_t flex_direction;
  css_justify_t justify_content;
  css_align_t align_items;
  css_align_t align_self;
  css_position_type_t position_type;
  css_wrap_type_t flex_wrap;
  float flex;
  float margin[4];
  float position[4];
  /**
   * You should skip all the rules that contain negative values for the
   * following attributes. For example:
   *   {padding: 10, paddingLeft: -5}
   * should output:
   *   {left: 10 ...}
   * the following two are incorrect:
   *   {left: -5 ...}
   *   {left: 0 ...}
   */
  float padding[4];
  float border[4];
  float dimensions[2];
} css_style_t;

typedef struct css_node {
  css_style_t style;
  css_layout_t layout;
  int children_count;

  css_dim_t (*measure)(void *context, float width);
  void (*print)(void *context);
  struct css_node* (*get_child)(void *context, int i);
  bool (*is_dirty)(void *context);
  void *context;
} css_node_t;


// Lifecycle of nodes and children
css_node_t *new_css_node(void);
void init_css_node(css_node_t *node);
void free_css_node(css_node_t *node);

// Print utilities
typedef enum {
  CSS_PRINT_LAYOUT = 1,
  CSS_PRINT_STYLE = 2,
  CSS_PRINT_CHILDREN = 4,
} css_print_options_t;
void print_css_node(css_node_t *node, css_print_options_t options);

// Function that computes the layout!
void layoutNode(css_node_t *node, float maxWidth);
bool isUndefined(float value);

#endif
