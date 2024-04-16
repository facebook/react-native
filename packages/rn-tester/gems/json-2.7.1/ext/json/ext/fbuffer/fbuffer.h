
#ifndef _FBUFFER_H_
#define _FBUFFER_H_

#include "ruby.h"

#ifndef RHASH_SIZE
#define RHASH_SIZE(hsh) (RHASH(hsh)->tbl->num_entries)
#endif

#ifndef RFLOAT_VALUE
#define RFLOAT_VALUE(val) (RFLOAT(val)->value)
#endif

#ifndef RARRAY_LEN
#define RARRAY_LEN(ARRAY) RARRAY(ARRAY)->len
#endif
#ifndef RSTRING_PTR
#define RSTRING_PTR(string) RSTRING(string)->ptr
#endif
#ifndef RSTRING_LEN
#define RSTRING_LEN(string) RSTRING(string)->len
#endif

#ifdef PRIsVALUE
# define RB_OBJ_CLASSNAME(obj) rb_obj_class(obj)
# define RB_OBJ_STRING(obj) (obj)
#else
# define PRIsVALUE "s"
# define RB_OBJ_CLASSNAME(obj) rb_obj_classname(obj)
# define RB_OBJ_STRING(obj) StringValueCStr(obj)
#endif

#ifdef HAVE_RUBY_ENCODING_H
#include "ruby/encoding.h"
#define FORCE_UTF8(obj) rb_enc_associate((obj), rb_utf8_encoding())
#else
#define FORCE_UTF8(obj)
#endif

/* We don't need to guard objects for rbx, so let's do nothing at all. */
#ifndef RB_GC_GUARD
#define RB_GC_GUARD(object)
#endif

typedef struct FBufferStruct {
    unsigned long initial_length;
    char *ptr;
    unsigned long len;
    unsigned long capa;
} FBuffer;

#define FBUFFER_INITIAL_LENGTH_DEFAULT 1024

#define FBUFFER_PTR(fb) (fb->ptr)
#define FBUFFER_LEN(fb) (fb->len)
#define FBUFFER_CAPA(fb) (fb->capa)
#define FBUFFER_PAIR(fb) FBUFFER_PTR(fb), FBUFFER_LEN(fb)

static FBuffer *fbuffer_alloc(unsigned long initial_length);
static void fbuffer_free(FBuffer *fb);
static void fbuffer_clear(FBuffer *fb);
static void fbuffer_append(FBuffer *fb, const char *newstr, unsigned long len);
#ifdef JSON_GENERATOR
static void fbuffer_append_long(FBuffer *fb, long number);
#endif
static void fbuffer_append_char(FBuffer *fb, char newchr);
#ifdef JSON_GENERATOR
static FBuffer *fbuffer_dup(FBuffer *fb);
static VALUE fbuffer_to_s(FBuffer *fb);
#endif

static FBuffer *fbuffer_alloc(unsigned long initial_length)
{
    FBuffer *fb;
    if (initial_length <= 0) initial_length = FBUFFER_INITIAL_LENGTH_DEFAULT;
    fb = ALLOC(FBuffer);
    memset((void *) fb, 0, sizeof(FBuffer));
    fb->initial_length = initial_length;
    return fb;
}

static void fbuffer_free(FBuffer *fb)
{
    if (fb->ptr) ruby_xfree(fb->ptr);
    ruby_xfree(fb);
}

static void fbuffer_clear(FBuffer *fb)
{
    fb->len = 0;
}

static void fbuffer_inc_capa(FBuffer *fb, unsigned long requested)
{
    unsigned long required;

    if (!fb->ptr) {
        fb->ptr = ALLOC_N(char, fb->initial_length);
        fb->capa = fb->initial_length;
    }

    for (required = fb->capa; requested > required - fb->len; required <<= 1);

    if (required > fb->capa) {
        REALLOC_N(fb->ptr, char, required);
        fb->capa = required;
    }
}

static void fbuffer_append(FBuffer *fb, const char *newstr, unsigned long len)
{
    if (len > 0) {
        fbuffer_inc_capa(fb, len);
        MEMCPY(fb->ptr + fb->len, newstr, char, len);
        fb->len += len;
    }
}

#ifdef JSON_GENERATOR
static void fbuffer_append_str(FBuffer *fb, VALUE str)
{
    const char *newstr = StringValuePtr(str);
    unsigned long len = RSTRING_LEN(str);

    RB_GC_GUARD(str);

    fbuffer_append(fb, newstr, len);
}
#endif

static void fbuffer_append_char(FBuffer *fb, char newchr)
{
    fbuffer_inc_capa(fb, 1);
    *(fb->ptr + fb->len) = newchr;
    fb->len++;
}

#ifdef JSON_GENERATOR
static void freverse(char *start, char *end)
{
    char c;

    while (end > start) {
        c = *end, *end-- = *start, *start++ = c;
    }
}

static long fltoa(long number, char *buf)
{
    static char digits[] = "0123456789";
    long sign = number;
    char* tmp = buf;

    if (sign < 0) number = -number;
    do *tmp++ = digits[number % 10]; while (number /= 10);
    if (sign < 0) *tmp++ = '-';
    freverse(buf, tmp - 1);
    return tmp - buf;
}

static void fbuffer_append_long(FBuffer *fb, long number)
{
    char buf[20];
    unsigned long len = fltoa(number, buf);
    fbuffer_append(fb, buf, len);
}

static FBuffer *fbuffer_dup(FBuffer *fb)
{
    unsigned long len = fb->len;
    FBuffer *result;

    result = fbuffer_alloc(len);
    fbuffer_append(result, FBUFFER_PAIR(fb));
    return result;
}

static VALUE fbuffer_to_s(FBuffer *fb)
{
    VALUE result = rb_str_new(FBUFFER_PTR(fb), FBUFFER_LEN(fb));
    fbuffer_free(fb);
    FORCE_UTF8(result);
    return result;
}
#endif
#endif
