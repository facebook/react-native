/**
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in from github!                       !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Go to https://github.com/facebook/css-layout            !!
 * !! 2) Make a pull request and get it merged                   !!
 * !! 3) Copy the file from github to here                       !!
 * !!    (don't forget to keep this header)                      !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * @generated
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
 #ifndef __cplusplus
 #include <stdbool.h>
 #endif

 // Not defined in MSVC++
 #ifndef NAN
 static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
 #define NAN (*(const float *)__nan)
 #endif

 #define CSS_UNDEFINED NAN

 typedef enum {
   CSS_DIRECTION_INHERIT = 0,
   CSS_DIRECTION_LTR,
   CSS_DIRECTION_RTL
 } css_direction_t;

 typedef enum {
   CSS_FLEX_DIRECTION_COLUMN = 0,
   CSS_FLEX_DIRECTION_COLUMN_REVERSE,
   CSS_FLEX_DIRECTION_ROW,
   CSS_FLEX_DIRECTION_ROW_REVERSE
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
   CSS_START,
   CSS_END,
   CSS_POSITION_COUNT
 } css_position_t;

 typedef enum {
   CSS_MEASURE_MODE_UNDEFINED = 0,
   CSS_MEASURE_MODE_EXACTLY,
   CSS_MEASURE_MODE_AT_MOST
 } css_measure_mode_t;

 typedef enum {
   CSS_WIDTH = 0,
   CSS_HEIGHT
 } css_dimension_t;

 typedef struct {
   float position[4];
   float dimensions[2];
   css_direction_t direction;

   // Instead of recomputing the entire layout every single time, we
   // cache some information to break early when nothing changed
   bool should_update;
   float last_requested_dimensions[2];
   float last_parent_max_width;
   float last_parent_max_height;
   float last_dimensions[2];
   float last_position[2];
   css_direction_t last_direction;
 } css_layout_t;

 typedef struct {
   float dimensions[2];
 } css_dim_t;

 typedef struct {
   css_direction_t direction;
   css_flex_direction_t flex_direction;
   css_justify_t justify_content;
   css_align_t align_content;
   css_align_t align_items;
   css_align_t align_self;
   css_position_type_t position_type;
   css_wrap_type_t flex_wrap;
   float flex;
   float margin[6];
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
   float padding[6];
   float border[6];
   float dimensions[2];
   float minDimensions[2];
   float maxDimensions[2];
 } css_style_t;

 typedef struct css_node css_node_t;
 struct css_node {
   css_style_t style;
   css_layout_t layout;
   int children_count;
   int line_index;

   css_node_t *next_absolute_child;
   css_node_t *next_flex_child;

   css_dim_t (*measure)(void *context, float width, css_measure_mode_t widthMode, float height, css_measure_mode_t heightMode);
   void (*print)(void *context);
   struct css_node* (*get_child)(void *context, int i);
   bool (*is_dirty)(void *context);
   void *context;
 };

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

 bool isUndefined(float value);

 // Function that computes the layout!
 void layoutNode(css_node_t *node, float maxWidth, float maxHeight, css_direction_t parentDirection);

 // Reset the calculated layout values for a given node. You should call this before `layoutNode`.
 void resetNodeLayout(css_node_t *node);

 #endif
