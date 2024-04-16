#include "LongDouble.h"
#include <stdio.h>
#include <stdarg.h>
#include <float.h>

#if defined (__CYGWIN__) || defined(__INTERIX) || defined(_MSC_VER)
# define strtold(str, endptr)    ((long double) strtod((str), (endptr)))
#endif /* defined (__CYGWIN__) */

static VALUE rb_cBigDecimal = Qnil;
static VALUE bigdecimal_load(VALUE unused);
static VALUE bigdecimal_failed(VALUE value, VALUE exc);

VALUE
rbffi_longdouble_new(long double ld)
{
    if (!RTEST(rb_cBigDecimal)) {
        /* allow fallback if the bigdecimal library is unavailable in future ruby versions */
        rb_cBigDecimal = rb_rescue(bigdecimal_load, Qnil, bigdecimal_failed, rb_cObject);
    }

    if (RTEST(rb_cBigDecimal) && rb_cBigDecimal != rb_cObject) {
        char buf[128];
        return rb_funcall(rb_mKernel, rb_intern("BigDecimal"), 1, rb_str_new(buf, sprintf(buf, "%.35Le", ld)));
    }

    /* Fall through to handling as a float */
    return rb_float_new(ld);
}

long double
rbffi_num2longdouble(VALUE value)
{
    if (TYPE(value) == T_FLOAT) {
        return rb_num2dbl(value);
    }

    if (!RTEST(rb_cBigDecimal) && rb_const_defined(rb_cObject, rb_intern("BigDecimal"))) {
        rb_cBigDecimal = rb_const_get(rb_cObject, rb_intern("BigDecimal"));
    }

    if (RTEST(rb_cBigDecimal) && rb_cBigDecimal != rb_cObject && RTEST(rb_obj_is_kind_of(value, rb_cBigDecimal))) {
        VALUE s = rb_funcall(value, rb_intern("to_s"), 1, rb_str_new2("E"));
        long double ret = strtold(RSTRING_PTR(s), NULL);
        RB_GC_GUARD(s);
        return ret;
    }

    /* Fall through to handling as a float */
    return rb_num2dbl(value);
}


static VALUE
bigdecimal_load(VALUE unused)
{
    rb_require("bigdecimal");
    return rb_const_get(rb_cObject, rb_intern("BigDecimal"));
}

static VALUE
bigdecimal_failed(VALUE value, VALUE exc)
{
    return value;
}
