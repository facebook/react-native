#ifndef _GENERATOR_H_
#define _GENERATOR_H_

#include <math.h>
#include <ctype.h>

#include "ruby.h"

#ifdef HAVE_RUBY_RE_H
#include "ruby/re.h"
#else
#include "re.h"
#endif

#ifndef rb_intern_str
#define rb_intern_str(string) SYM2ID(rb_str_intern(string))
#endif

#ifndef rb_obj_instance_variables
#define rb_obj_instance_variables(object) rb_funcall(object, rb_intern("instance_variables"), 0)
#endif

#define option_given_p(opts, key) RTEST(rb_funcall(opts, i_key_p, 1, key))

/* unicode definitions */

#define UNI_STRICT_CONVERSION 1

typedef unsigned long  UTF32; /* at least 32 bits */
typedef unsigned short UTF16; /* at least 16 bits */
typedef unsigned char  UTF8;  /* typically 8 bits */

#define UNI_REPLACEMENT_CHAR (UTF32)0x0000FFFD
#define UNI_MAX_BMP (UTF32)0x0000FFFF
#define UNI_MAX_UTF16 (UTF32)0x0010FFFF
#define UNI_MAX_UTF32 (UTF32)0x7FFFFFFF
#define UNI_MAX_LEGAL_UTF32 (UTF32)0x0010FFFF

#define UNI_SUR_HIGH_START  (UTF32)0xD800
#define UNI_SUR_HIGH_END    (UTF32)0xDBFF
#define UNI_SUR_LOW_START   (UTF32)0xDC00
#define UNI_SUR_LOW_END     (UTF32)0xDFFF

static const int halfShift  = 10; /* used for shifting by 10 bits */

static const UTF32 halfBase = 0x0010000UL;
static const UTF32 halfMask = 0x3FFUL;

static unsigned char isLegalUTF8(const UTF8 *source, unsigned long length);
static void unicode_escape(char *buf, UTF16 character);
static void unicode_escape_to_buffer(FBuffer *buffer, char buf[6], UTF16 character);
static void convert_UTF8_to_JSON_ASCII(FBuffer *buffer, VALUE string, char script_safe);
static void convert_UTF8_to_JSON(FBuffer *buffer, VALUE string, char script_safe);
static char *fstrndup(const char *ptr, unsigned long len);

/* ruby api and some helpers */

typedef struct JSON_Generator_StateStruct {
    char *indent;
    long indent_len;
    char *space;
    long space_len;
    char *space_before;
    long space_before_len;
    char *object_nl;
    long object_nl_len;
    char *array_nl;
    long array_nl_len;
    FBuffer *array_delim;
    FBuffer *object_delim;
    FBuffer *object_delim2;
    long max_nesting;
    char allow_nan;
    char ascii_only;
    char script_safe;
    char strict;
    long depth;
    long buffer_initial_length;
} JSON_Generator_State;

#define GET_STATE_TO(self, state) \
    TypedData_Get_Struct(self, JSON_Generator_State, &JSON_Generator_State_type, state)

#define GET_STATE(self)                       \
    JSON_Generator_State *state;              \
    GET_STATE_TO(self, state)

#define GENERATE_JSON(type)                                                                     \
    FBuffer *buffer;                                                                            \
    VALUE Vstate;                                                                               \
    JSON_Generator_State *state;                                                                \
                                                                                                \
    rb_scan_args(argc, argv, "01", &Vstate);                                                    \
    Vstate = cState_from_state_s(cState, Vstate);                                               \
    TypedData_Get_Struct(Vstate, JSON_Generator_State, &JSON_Generator_State_type, state);	\
    buffer = cState_prepare_buffer(Vstate);                                                     \
    generate_json_##type(buffer, Vstate, state, self);                                          \
    return fbuffer_to_s(buffer)

static VALUE mHash_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mArray_to_json(int argc, VALUE *argv, VALUE self);
#ifdef RUBY_INTEGER_UNIFICATION
static VALUE mInteger_to_json(int argc, VALUE *argv, VALUE self);
#else
static VALUE mFixnum_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mBignum_to_json(int argc, VALUE *argv, VALUE self);
#endif
static VALUE mFloat_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mString_included_s(VALUE self, VALUE modul);
static VALUE mString_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mString_to_json_raw_object(VALUE self);
static VALUE mString_to_json_raw(int argc, VALUE *argv, VALUE self);
static VALUE mString_Extend_json_create(VALUE self, VALUE o);
static VALUE mTrueClass_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mFalseClass_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mNilClass_to_json(int argc, VALUE *argv, VALUE self);
static VALUE mObject_to_json(int argc, VALUE *argv, VALUE self);
static void State_free(void *state);
static VALUE cState_s_allocate(VALUE klass);
static VALUE cState_configure(VALUE self, VALUE opts);
static VALUE cState_to_h(VALUE self);
static void generate_json(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_object(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_array(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_string(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_null(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_false(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_true(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
#ifdef RUBY_INTEGER_UNIFICATION
static void generate_json_integer(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
#endif
static void generate_json_fixnum(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_bignum(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static void generate_json_float(FBuffer *buffer, VALUE Vstate, JSON_Generator_State *state, VALUE obj);
static VALUE cState_partial_generate(VALUE self, VALUE obj);
static VALUE cState_generate(VALUE self, VALUE obj);
static VALUE cState_initialize(int argc, VALUE *argv, VALUE self);
static VALUE cState_from_state_s(VALUE self, VALUE opts);
static VALUE cState_indent(VALUE self);
static VALUE cState_indent_set(VALUE self, VALUE indent);
static VALUE cState_space(VALUE self);
static VALUE cState_space_set(VALUE self, VALUE space);
static VALUE cState_space_before(VALUE self);
static VALUE cState_space_before_set(VALUE self, VALUE space_before);
static VALUE cState_object_nl(VALUE self);
static VALUE cState_object_nl_set(VALUE self, VALUE object_nl);
static VALUE cState_array_nl(VALUE self);
static VALUE cState_array_nl_set(VALUE self, VALUE array_nl);
static VALUE cState_max_nesting(VALUE self);
static VALUE cState_max_nesting_set(VALUE self, VALUE depth);
static VALUE cState_allow_nan_p(VALUE self);
static VALUE cState_ascii_only_p(VALUE self);
static VALUE cState_depth(VALUE self);
static VALUE cState_depth_set(VALUE self, VALUE depth);
static VALUE cState_script_safe(VALUE self);
static VALUE cState_script_safe_set(VALUE self, VALUE depth);
static VALUE cState_strict(VALUE self);
static VALUE cState_strict_set(VALUE self, VALUE strict);
static FBuffer *cState_prepare_buffer(VALUE self);
#ifndef ZALLOC
#define ZALLOC(type) ((type *)ruby_zalloc(sizeof(type)))
static inline void *ruby_zalloc(size_t n)
{
    void *p = ruby_xmalloc(n);
    memset(p, 0, n);
    return p;
}
#endif
#ifdef TypedData_Make_Struct
static const rb_data_type_t JSON_Generator_State_type;
#define NEW_TYPEDDATA_WRAPPER 1
#else
#define TypedData_Make_Struct(klass, type, ignore, json) Data_Make_Struct(klass, type, NULL, State_free, json)
#define TypedData_Get_Struct(self, JSON_Generator_State, ignore, json) Data_Get_Struct(self, JSON_Generator_State, json)
#endif

#endif
