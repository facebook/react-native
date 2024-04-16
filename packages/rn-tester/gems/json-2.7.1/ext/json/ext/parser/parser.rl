#include "../fbuffer/fbuffer.h"
#include "parser.h"

#if defined HAVE_RUBY_ENCODING_H
# define EXC_ENCODING rb_utf8_encoding(),
# ifndef HAVE_RB_ENC_RAISE
static void
enc_raise(rb_encoding *enc, VALUE exc, const char *fmt, ...)
{
    va_list args;
    VALUE mesg;

    va_start(args, fmt);
    mesg = rb_enc_vsprintf(enc, fmt, args);
    va_end(args);

    rb_exc_raise(rb_exc_new3(exc, mesg));
}
#   define rb_enc_raise enc_raise
# endif
#else
# define EXC_ENCODING /* nothing */
# define rb_enc_raise rb_raise
#endif

/* unicode */

static const signed char digit_values[256] = {
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1,
    -1, -1, -1, -1, -1, -1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1
};

static UTF32 unescape_unicode(const unsigned char *p)
{
    signed char b;
    UTF32 result = 0;
    b = digit_values[p[0]];
    if (b < 0) return UNI_REPLACEMENT_CHAR;
    result = (result << 4) | (unsigned char)b;
    b = digit_values[p[1]];
    if (b < 0) return UNI_REPLACEMENT_CHAR;
    result = (result << 4) | (unsigned char)b;
    b = digit_values[p[2]];
    if (b < 0) return UNI_REPLACEMENT_CHAR;
    result = (result << 4) | (unsigned char)b;
    b = digit_values[p[3]];
    if (b < 0) return UNI_REPLACEMENT_CHAR;
    result = (result << 4) | (unsigned char)b;
    return result;
}

static int convert_UTF32_to_UTF8(char *buf, UTF32 ch)
{
    int len = 1;
    if (ch <= 0x7F) {
        buf[0] = (char) ch;
    } else if (ch <= 0x07FF) {
        buf[0] = (char) ((ch >> 6) | 0xC0);
        buf[1] = (char) ((ch & 0x3F) | 0x80);
        len++;
    } else if (ch <= 0xFFFF) {
        buf[0] = (char) ((ch >> 12) | 0xE0);
        buf[1] = (char) (((ch >> 6) & 0x3F) | 0x80);
        buf[2] = (char) ((ch & 0x3F) | 0x80);
        len += 2;
    } else if (ch <= 0x1fffff) {
        buf[0] =(char) ((ch >> 18) | 0xF0);
        buf[1] =(char) (((ch >> 12) & 0x3F) | 0x80);
        buf[2] =(char) (((ch >> 6) & 0x3F) | 0x80);
        buf[3] =(char) ((ch & 0x3F) | 0x80);
        len += 3;
    } else {
        buf[0] = '?';
    }
    return len;
}

static VALUE mJSON, mExt, cParser, eParserError, eNestingError;
static VALUE CNaN, CInfinity, CMinusInfinity;

static ID i_json_creatable_p, i_json_create, i_create_id, i_create_additions,
          i_chr, i_max_nesting, i_allow_nan, i_symbolize_names,
          i_object_class, i_array_class, i_decimal_class, i_key_p,
          i_deep_const_get, i_match, i_match_string, i_aset, i_aref,
          i_leftshift, i_new, i_try_convert, i_freeze, i_uminus;

%%{
    machine JSON_common;

    cr                  = '\n';
    cr_neg              = [^\n];
    ws                  = [ \t\r\n];
    c_comment           = '/*' ( any* - (any* '*/' any* ) ) '*/';
    cpp_comment         = '//' cr_neg* cr;
    comment             = c_comment | cpp_comment;
    ignore              = ws | comment;
    name_separator      = ':';
    value_separator     = ',';
    Vnull               = 'null';
    Vfalse              = 'false';
    Vtrue               = 'true';
    VNaN                = 'NaN';
    VInfinity           = 'Infinity';
    VMinusInfinity      = '-Infinity';
    begin_value         = [nft\"\-\[\{NI] | digit;
    begin_object        = '{';
    end_object          = '}';
    begin_array         = '[';
    end_array           = ']';
    begin_string        = '"';
    begin_name          = begin_string;
    begin_number        = digit | '-';
}%%

%%{
    machine JSON_object;
    include JSON_common;

    write data;

    action parse_value {
        VALUE v = Qnil;
        char *np = JSON_parse_value(json, fpc, pe, &v, current_nesting);
        if (np == NULL) {
            fhold; fbreak;
        } else {
            if (NIL_P(json->object_class)) {
                OBJ_FREEZE(last_name);
                rb_hash_aset(*result, last_name, v);
            } else {
                rb_funcall(*result, i_aset, 2, last_name, v);
            }
            fexec np;
        }
    }

    action parse_name {
        char *np;
        json->parsing_name = 1;
        np = JSON_parse_string(json, fpc, pe, &last_name);
        json->parsing_name = 0;
        if (np == NULL) { fhold; fbreak; } else fexec np;
    }

    action exit { fhold; fbreak; }

    pair  = ignore* begin_name >parse_name ignore* name_separator ignore* begin_value >parse_value;
    next_pair   = ignore* value_separator pair;

    main := (
      begin_object
      (pair (next_pair)*)? ignore*
      end_object
    ) @exit;
}%%

static char *JSON_parse_object(JSON_Parser *json, char *p, char *pe, VALUE *result, int current_nesting)
{
    int cs = EVIL;
    VALUE last_name = Qnil;
    VALUE object_class = json->object_class;

    if (json->max_nesting && current_nesting > json->max_nesting) {
        rb_raise(eNestingError, "nesting of %d is too deep", current_nesting);
    }

    *result = NIL_P(object_class) ? rb_hash_new() : rb_class_new_instance(0, 0, object_class);

    %% write init;
    %% write exec;

    if (cs >= JSON_object_first_final) {
        if (json->create_additions) {
            VALUE klassname;
            if (NIL_P(json->object_class)) {
              klassname = rb_hash_aref(*result, json->create_id);
            } else {
              klassname = rb_funcall(*result, i_aref, 1, json->create_id);
            }
            if (!NIL_P(klassname)) {
                VALUE klass = rb_funcall(mJSON, i_deep_const_get, 1, klassname);
                if (RTEST(rb_funcall(klass, i_json_creatable_p, 0))) {
                    *result = rb_funcall(klass, i_json_create, 1, *result);
                }
            }
        }
        return p + 1;
    } else {
        return NULL;
    }
}


%%{
    machine JSON_value;
    include JSON_common;

    write data;

    action parse_null {
        *result = Qnil;
    }
    action parse_false {
        *result = Qfalse;
    }
    action parse_true {
        *result = Qtrue;
    }
    action parse_nan {
        if (json->allow_nan) {
            *result = CNaN;
        } else {
            rb_enc_raise(EXC_ENCODING eParserError, "unexpected token at '%s'", p - 2);
        }
    }
    action parse_infinity {
        if (json->allow_nan) {
            *result = CInfinity;
        } else {
            rb_enc_raise(EXC_ENCODING eParserError, "unexpected token at '%s'", p - 7);
        }
    }
    action parse_string {
        char *np = JSON_parse_string(json, fpc, pe, result);
        if (np == NULL) { fhold; fbreak; } else fexec np;
    }

    action parse_number {
        char *np;
        if(pe > fpc + 8 && !strncmp(MinusInfinity, fpc, 9)) {
            if (json->allow_nan) {
                *result = CMinusInfinity;
                fexec p + 10;
                fhold; fbreak;
            } else {
                rb_enc_raise(EXC_ENCODING eParserError, "unexpected token at '%s'", p);
            }
        }
        np = JSON_parse_float(json, fpc, pe, result);
        if (np != NULL) fexec np;
        np = JSON_parse_integer(json, fpc, pe, result);
        if (np != NULL) fexec np;
        fhold; fbreak;
    }

    action parse_array {
        char *np;
        np = JSON_parse_array(json, fpc, pe, result, current_nesting + 1);
        if (np == NULL) { fhold; fbreak; } else fexec np;
    }

    action parse_object {
        char *np;
        np =  JSON_parse_object(json, fpc, pe, result, current_nesting + 1);
        if (np == NULL) { fhold; fbreak; } else fexec np;
    }

    action exit { fhold; fbreak; }

main := ignore* (
              Vnull @parse_null |
              Vfalse @parse_false |
              Vtrue @parse_true |
              VNaN @parse_nan |
              VInfinity @parse_infinity |
              begin_number >parse_number |
              begin_string >parse_string |
              begin_array >parse_array |
              begin_object >parse_object
        ) ignore* %*exit;
}%%

static char *JSON_parse_value(JSON_Parser *json, char *p, char *pe, VALUE *result, int current_nesting)
{
    int cs = EVIL;

    %% write init;
    %% write exec;

    if (json->freeze) {
        OBJ_FREEZE(*result);
    }

    if (cs >= JSON_value_first_final) {
        return p;
    } else {
        return NULL;
    }
}

%%{
    machine JSON_integer;

    write data;

    action exit { fhold; fbreak; }

    main := '-'? ('0' | [1-9][0-9]*) (^[0-9]? @exit);
}%%

static char *JSON_parse_integer(JSON_Parser *json, char *p, char *pe, VALUE *result)
{
    int cs = EVIL;

    %% write init;
    json->memo = p;
    %% write exec;

    if (cs >= JSON_integer_first_final) {
        long len = p - json->memo;
        fbuffer_clear(json->fbuffer);
        fbuffer_append(json->fbuffer, json->memo, len);
        fbuffer_append_char(json->fbuffer, '\0');
        *result = rb_cstr2inum(FBUFFER_PTR(json->fbuffer), 10);
        return p + 1;
    } else {
        return NULL;
    }
}

%%{
    machine JSON_float;
    include JSON_common;

    write data;

    action exit { fhold; fbreak; }

    main := '-'? (
              (('0' | [1-9][0-9]*) '.' [0-9]+ ([Ee] [+\-]?[0-9]+)?)
              | (('0' | [1-9][0-9]*) ([Ee] [+\-]?[0-9]+))
             )  (^[0-9Ee.\-]? @exit );
}%%

static char *JSON_parse_float(JSON_Parser *json, char *p, char *pe, VALUE *result)
{
    int cs = EVIL;

    %% write init;
    json->memo = p;
    %% write exec;

    if (cs >= JSON_float_first_final) {
        VALUE mod = Qnil;
        ID method_id = 0;
        if (rb_respond_to(json->decimal_class, i_try_convert)) {
            mod = json->decimal_class;
            method_id = i_try_convert;
        } else if (rb_respond_to(json->decimal_class, i_new)) {
            mod = json->decimal_class;
            method_id = i_new;
        } else if (RB_TYPE_P(json->decimal_class, T_CLASS)) {
            VALUE name = rb_class_name(json->decimal_class);
            const char *name_cstr = RSTRING_PTR(name);
            const char *last_colon = strrchr(name_cstr, ':');
            if (last_colon) {
                const char *mod_path_end = last_colon - 1;
                VALUE mod_path = rb_str_substr(name, 0, mod_path_end - name_cstr);
                mod = rb_path_to_class(mod_path);

                const char *method_name_beg = last_colon + 1;
                long before_len = method_name_beg - name_cstr;
                long len = RSTRING_LEN(name) - before_len;
                VALUE method_name = rb_str_substr(name, before_len, len);
                method_id = SYM2ID(rb_str_intern(method_name));
            } else {
                mod = rb_mKernel;
                method_id = SYM2ID(rb_str_intern(name));
            }
        }

        long len = p - json->memo;
        fbuffer_clear(json->fbuffer);
        fbuffer_append(json->fbuffer, json->memo, len);
        fbuffer_append_char(json->fbuffer, '\0');

        if (method_id) {
            VALUE text = rb_str_new2(FBUFFER_PTR(json->fbuffer));
            *result = rb_funcallv(mod, method_id, 1, &text);
        } else {
            *result = DBL2NUM(rb_cstr_to_dbl(FBUFFER_PTR(json->fbuffer), 1));
        }

        return p + 1;
    } else {
        return NULL;
    }
}


%%{
    machine JSON_array;
    include JSON_common;

    write data;

    action parse_value {
        VALUE v = Qnil;
        char *np = JSON_parse_value(json, fpc, pe, &v, current_nesting);
        if (np == NULL) {
            fhold; fbreak;
        } else {
            if (NIL_P(json->array_class)) {
                rb_ary_push(*result, v);
            } else {
                rb_funcall(*result, i_leftshift, 1, v);
            }
            fexec np;
        }
    }

    action exit { fhold; fbreak; }

    next_element  = value_separator ignore* begin_value >parse_value;

    main := begin_array ignore*
          ((begin_value >parse_value ignore*)
           (ignore* next_element ignore*)*)?
          end_array @exit;
}%%

static char *JSON_parse_array(JSON_Parser *json, char *p, char *pe, VALUE *result, int current_nesting)
{
    int cs = EVIL;
    VALUE array_class = json->array_class;

    if (json->max_nesting && current_nesting > json->max_nesting) {
        rb_raise(eNestingError, "nesting of %d is too deep", current_nesting);
    }
    *result = NIL_P(array_class) ? rb_ary_new() : rb_class_new_instance(0, 0, array_class);

    %% write init;
    %% write exec;

    if(cs >= JSON_array_first_final) {
        return p + 1;
    } else {
        rb_enc_raise(EXC_ENCODING eParserError, "unexpected token at '%s'", p);
        return NULL;
    }
}

static const size_t MAX_STACK_BUFFER_SIZE = 128;
static VALUE json_string_unescape(char *string, char *stringEnd, int intern, int symbolize)
{
    VALUE result = Qnil;
    size_t bufferSize = stringEnd - string;
    char *p = string, *pe = string, *unescape, *bufferStart, *buffer;
    int unescape_len;
    char buf[4];

    if (bufferSize > MAX_STACK_BUFFER_SIZE) {
# ifdef HAVE_RB_ENC_INTERNED_STR
      bufferStart = buffer = ALLOC_N(char, bufferSize ? bufferSize : 1);
# else
      bufferStart = buffer = ALLOC_N(char, bufferSize);
# endif
    } else {
# ifdef HAVE_RB_ENC_INTERNED_STR
      bufferStart = buffer = ALLOCA_N(char, bufferSize ? bufferSize : 1);
# else
      bufferStart = buffer = ALLOCA_N(char, bufferSize);
# endif
    }

    while (pe < stringEnd) {
        if (*pe == '\\') {
            unescape = (char *) "?";
            unescape_len = 1;
            if (pe > p) {
              MEMCPY(buffer, p, char, pe - p);
              buffer += pe - p;
            }
            switch (*++pe) {
                case 'n':
                    unescape = (char *) "\n";
                    break;
                case 'r':
                    unescape = (char *) "\r";
                    break;
                case 't':
                    unescape = (char *) "\t";
                    break;
                case '"':
                    unescape = (char *) "\"";
                    break;
                case '\\':
                    unescape = (char *) "\\";
                    break;
                case 'b':
                    unescape = (char *) "\b";
                    break;
                case 'f':
                    unescape = (char *) "\f";
                    break;
                case 'u':
                    if (pe > stringEnd - 4) {
                      if (bufferSize > MAX_STACK_BUFFER_SIZE) {
                        ruby_xfree(bufferStart);
                      }
                      rb_enc_raise(
                        EXC_ENCODING eParserError,
                        "incomplete unicode character escape sequence at '%s'", p
                      );
                    } else {
                        UTF32 ch = unescape_unicode((unsigned char *) ++pe);
                        pe += 3;
                        if (UNI_SUR_HIGH_START == (ch & 0xFC00)) {
                            pe++;
                            if (pe > stringEnd - 6) {
                              if (bufferSize > MAX_STACK_BUFFER_SIZE) {
                                ruby_xfree(bufferStart);
                              }
                              rb_enc_raise(
                                EXC_ENCODING eParserError,
                                "incomplete surrogate pair at '%s'", p
                                );
                            }
                            if (pe[0] == '\\' && pe[1] == 'u') {
                                UTF32 sur = unescape_unicode((unsigned char *) pe + 2);
                                ch = (((ch & 0x3F) << 10) | ((((ch >> 6) & 0xF) + 1) << 16)
                                        | (sur & 0x3FF));
                                pe += 5;
                            } else {
                                unescape = (char *) "?";
                                break;
                            }
                        }
                        unescape_len = convert_UTF32_to_UTF8(buf, ch);
                        unescape = buf;
                    }
                    break;
                default:
                    p = pe;
                    continue;
            }
            MEMCPY(buffer, unescape, char, unescape_len);
            buffer += unescape_len;
            p = ++pe;
        } else {
            pe++;
        }
    }

    if (pe > p) {
      MEMCPY(buffer, p, char, pe - p);
      buffer += pe - p;
    }

# ifdef HAVE_RB_ENC_INTERNED_STR
      if (intern) {
        result = rb_enc_interned_str(bufferStart, (long)(buffer - bufferStart), rb_utf8_encoding());
      } else {
        result = rb_utf8_str_new(bufferStart, (long)(buffer - bufferStart));
      }
      if (bufferSize > MAX_STACK_BUFFER_SIZE) {
        ruby_xfree(bufferStart);
      }
# else
      result = rb_utf8_str_new(bufferStart, (long)(buffer - bufferStart));

      if (bufferSize > MAX_STACK_BUFFER_SIZE) {
        ruby_xfree(bufferStart);
      }

      if (intern) {
  # if STR_UMINUS_DEDUPE_FROZEN
        // Starting from MRI 2.8 it is preferable to freeze the string
        // before deduplication so that it can be interned directly
        // otherwise it would be duplicated first which is wasteful.
        result = rb_funcall(rb_str_freeze(result), i_uminus, 0);
  # elif STR_UMINUS_DEDUPE
        // MRI 2.5 and older do not deduplicate strings that are already
        // frozen.
        result = rb_funcall(result, i_uminus, 0);
  # else
        result = rb_str_freeze(result);
  # endif
      }
# endif

    if (symbolize) {
      result = rb_str_intern(result);
    }

    return result;
}

%%{
    machine JSON_string;
    include JSON_common;

    write data;

    action parse_string {
        *result = json_string_unescape(json->memo + 1, p, json->parsing_name || json-> freeze, json->parsing_name && json->symbolize_names);
        if (NIL_P(*result)) {
            fhold;
            fbreak;
        } else {
            fexec p + 1;
        }
    }

    action exit { fhold; fbreak; }

    main := '"' ((^([\"\\] | 0..0x1f) | '\\'[\"\\/bfnrt] | '\\u'[0-9a-fA-F]{4} | '\\'^([\"\\/bfnrtu]|0..0x1f))* %parse_string) '"' @exit;
}%%

static int
match_i(VALUE regexp, VALUE klass, VALUE memo)
{
    if (regexp == Qundef) return ST_STOP;
    if (RTEST(rb_funcall(klass, i_json_creatable_p, 0)) &&
      RTEST(rb_funcall(regexp, i_match, 1, rb_ary_entry(memo, 0)))) {
        rb_ary_push(memo, klass);
        return ST_STOP;
    }
    return ST_CONTINUE;
}

static char *JSON_parse_string(JSON_Parser *json, char *p, char *pe, VALUE *result)
{
    int cs = EVIL;
    VALUE match_string;

    %% write init;
    json->memo = p;
    %% write exec;

    if (json->create_additions && RTEST(match_string = json->match_string)) {
          VALUE klass;
          VALUE memo = rb_ary_new2(2);
          rb_ary_push(memo, *result);
          rb_hash_foreach(match_string, match_i, memo);
          klass = rb_ary_entry(memo, 1);
          if (RTEST(klass)) {
              *result = rb_funcall(klass, i_json_create, 1, *result);
          }
    }

    if (cs >= JSON_string_first_final) {
        return p + 1;
    } else {
        return NULL;
    }
}

/*
 * Document-class: JSON::Ext::Parser
 *
 * This is the JSON parser implemented as a C extension. It can be configured
 * to be used by setting
 *
 *  JSON.parser = JSON::Ext::Parser
 *
 * with the method parser= in JSON.
 *
 */

static VALUE convert_encoding(VALUE source)
{
#ifdef HAVE_RUBY_ENCODING_H
  rb_encoding *enc = rb_enc_get(source);
  if (enc == rb_ascii8bit_encoding()) {
    if (OBJ_FROZEN(source)) {
      source = rb_str_dup(source);
    }
    FORCE_UTF8(source);
  } else {
    source = rb_str_conv_enc(source, rb_enc_get(source), rb_utf8_encoding());
  }
#endif
    return source;
}

/*
 * call-seq: new(source, opts => {})
 *
 * Creates a new JSON::Ext::Parser instance for the string _source_.
 *
 * It will be configured by the _opts_ hash. _opts_ can have the following
 * keys:
 *
 * _opts_ can have the following keys:
 * * *max_nesting*: The maximum depth of nesting allowed in the parsed data
 *   structures. Disable depth checking with :max_nesting => false|nil|0, it
 *   defaults to 100.
 * * *allow_nan*: If set to true, allow NaN, Infinity and -Infinity in
 *   defiance of RFC 4627 to be parsed by the Parser. This option defaults to
 *   false.
 * * *symbolize_names*: If set to true, returns symbols for the names
 *   (keys) in a JSON object. Otherwise strings are returned, which is
 *   also the default. It's not possible to use this option in
 *   conjunction with the *create_additions* option.
 * * *create_additions*: If set to false, the Parser doesn't create
 *   additions even if a matching class and create_id was found. This option
 *   defaults to false.
 * * *object_class*: Defaults to Hash
 * * *array_class*: Defaults to Array
 */
static VALUE cParser_initialize(int argc, VALUE *argv, VALUE self)
{
    VALUE source, opts;
    GET_PARSER_INIT;

    if (json->Vsource) {
        rb_raise(rb_eTypeError, "already initialized instance");
    }
    rb_scan_args(argc, argv, "1:", &source, &opts);
    if (!NIL_P(opts)) {
	VALUE tmp = ID2SYM(i_max_nesting);
	if (option_given_p(opts, tmp)) {
	    VALUE max_nesting = rb_hash_aref(opts, tmp);
	    if (RTEST(max_nesting)) {
		Check_Type(max_nesting, T_FIXNUM);
		json->max_nesting = FIX2INT(max_nesting);
	    } else {
		json->max_nesting = 0;
	    }
	} else {
	    json->max_nesting = 100;
	}
	tmp = ID2SYM(i_allow_nan);
	if (option_given_p(opts, tmp)) {
	    json->allow_nan = RTEST(rb_hash_aref(opts, tmp)) ? 1 : 0;
	} else {
	    json->allow_nan = 0;
	}
	tmp = ID2SYM(i_symbolize_names);
	if (option_given_p(opts, tmp)) {
	    json->symbolize_names = RTEST(rb_hash_aref(opts, tmp)) ? 1 : 0;
	} else {
	    json->symbolize_names = 0;
	}
	tmp = ID2SYM(i_freeze);
	if (option_given_p(opts, tmp)) {
	    json->freeze = RTEST(rb_hash_aref(opts, tmp)) ? 1 : 0;
	} else {
	    json->freeze = 0;
	}
	tmp = ID2SYM(i_create_additions);
	if (option_given_p(opts, tmp)) {
	    json->create_additions = RTEST(rb_hash_aref(opts, tmp));
	} else {
	    json->create_additions = 0;
	}
	if (json->symbolize_names && json->create_additions) {
	    rb_raise(rb_eArgError,
		     "options :symbolize_names and :create_additions cannot be "
		     " used in conjunction");
	}
	tmp = ID2SYM(i_create_id);
	if (option_given_p(opts, tmp)) {
	    json->create_id = rb_hash_aref(opts, tmp);
	} else {
	    json->create_id = rb_funcall(mJSON, i_create_id, 0);
	}
	tmp = ID2SYM(i_object_class);
	if (option_given_p(opts, tmp)) {
	    json->object_class = rb_hash_aref(opts, tmp);
	} else {
	    json->object_class = Qnil;
	}
	tmp = ID2SYM(i_array_class);
	if (option_given_p(opts, tmp)) {
	    json->array_class = rb_hash_aref(opts, tmp);
	} else {
	    json->array_class = Qnil;
	}
	tmp = ID2SYM(i_decimal_class);
	if (option_given_p(opts, tmp)) {
	    json->decimal_class = rb_hash_aref(opts, tmp);
	} else {
	    json->decimal_class = Qnil;
	}
	tmp = ID2SYM(i_match_string);
	if (option_given_p(opts, tmp)) {
	    VALUE match_string = rb_hash_aref(opts, tmp);
	    json->match_string = RTEST(match_string) ? match_string : Qnil;
	} else {
	    json->match_string = Qnil;
	}
    } else {
        json->max_nesting = 100;
        json->allow_nan = 0;
        json->create_additions = 0;
        json->create_id = Qnil;
        json->object_class = Qnil;
        json->array_class = Qnil;
        json->decimal_class = Qnil;
    }
    source = convert_encoding(StringValue(source));
    StringValue(source);
    json->len = RSTRING_LEN(source);
    json->source = RSTRING_PTR(source);;
    json->Vsource = source;
    return self;
}

%%{
    machine JSON;

    write data;

    include JSON_common;

    action parse_value {
        char *np = JSON_parse_value(json, fpc, pe, &result, 0);
        if (np == NULL) { fhold; fbreak; } else fexec np;
    }

    main := ignore* (
            begin_value >parse_value
            ) ignore*;
}%%

/*
 * call-seq: parse()
 *
 *  Parses the current JSON text _source_ and returns the complete data
 *  structure as a result.
 *  It raises JSON::ParserError if fail to parse.
 */
static VALUE cParser_parse(VALUE self)
{
  char *p, *pe;
  int cs = EVIL;
  VALUE result = Qnil;
  GET_PARSER;

  %% write init;
  p = json->source;
  pe = p + json->len;
  %% write exec;

  if (cs >= JSON_first_final && p == pe) {
    return result;
  } else {
    rb_enc_raise(EXC_ENCODING eParserError, "unexpected token at '%s'", p);
    return Qnil;
  }
}

static void JSON_mark(void *ptr)
{
    JSON_Parser *json = ptr;
    rb_gc_mark_maybe(json->Vsource);
    rb_gc_mark_maybe(json->create_id);
    rb_gc_mark_maybe(json->object_class);
    rb_gc_mark_maybe(json->array_class);
    rb_gc_mark_maybe(json->decimal_class);
    rb_gc_mark_maybe(json->match_string);
}

static void JSON_free(void *ptr)
{
    JSON_Parser *json = ptr;
    fbuffer_free(json->fbuffer);
    ruby_xfree(json);
}

static size_t JSON_memsize(const void *ptr)
{
    const JSON_Parser *json = ptr;
    return sizeof(*json) + FBUFFER_CAPA(json->fbuffer);
}

#ifdef NEW_TYPEDDATA_WRAPPER
static const rb_data_type_t JSON_Parser_type = {
    "JSON/Parser",
    {JSON_mark, JSON_free, JSON_memsize,},
#ifdef RUBY_TYPED_FREE_IMMEDIATELY
    0, 0,
    RUBY_TYPED_FREE_IMMEDIATELY,
#endif
};
#endif

static VALUE cJSON_parser_s_allocate(VALUE klass)
{
    JSON_Parser *json;
    VALUE obj = TypedData_Make_Struct(klass, JSON_Parser, &JSON_Parser_type, json);
    json->fbuffer = fbuffer_alloc(0);
    return obj;
}

/*
 * call-seq: source()
 *
 * Returns a copy of the current _source_ string, that was used to construct
 * this Parser.
 */
static VALUE cParser_source(VALUE self)
{
    GET_PARSER;
    return rb_str_dup(json->Vsource);
}

void Init_parser(void)
{
#ifdef HAVE_RB_EXT_RACTOR_SAFE
    rb_ext_ractor_safe(true);
#endif

#undef rb_intern
    rb_require("json/common");
    mJSON = rb_define_module("JSON");
    mExt = rb_define_module_under(mJSON, "Ext");
    cParser = rb_define_class_under(mExt, "Parser", rb_cObject);
    eParserError = rb_path2class("JSON::ParserError");
    eNestingError = rb_path2class("JSON::NestingError");
    rb_gc_register_mark_object(eParserError);
    rb_gc_register_mark_object(eNestingError);
    rb_define_alloc_func(cParser, cJSON_parser_s_allocate);
    rb_define_method(cParser, "initialize", cParser_initialize, -1);
    rb_define_method(cParser, "parse", cParser_parse, 0);
    rb_define_method(cParser, "source", cParser_source, 0);

    CNaN = rb_const_get(mJSON, rb_intern("NaN"));
    rb_gc_register_mark_object(CNaN);

    CInfinity = rb_const_get(mJSON, rb_intern("Infinity"));
    rb_gc_register_mark_object(CInfinity);

    CMinusInfinity = rb_const_get(mJSON, rb_intern("MinusInfinity"));
    rb_gc_register_mark_object(CMinusInfinity);

    i_json_creatable_p = rb_intern("json_creatable?");
    i_json_create = rb_intern("json_create");
    i_create_id = rb_intern("create_id");
    i_create_additions = rb_intern("create_additions");
    i_chr = rb_intern("chr");
    i_max_nesting = rb_intern("max_nesting");
    i_allow_nan = rb_intern("allow_nan");
    i_symbolize_names = rb_intern("symbolize_names");
    i_object_class = rb_intern("object_class");
    i_array_class = rb_intern("array_class");
    i_decimal_class = rb_intern("decimal_class");
    i_match = rb_intern("match");
    i_match_string = rb_intern("match_string");
    i_key_p = rb_intern("key?");
    i_deep_const_get = rb_intern("deep_const_get");
    i_aset = rb_intern("[]=");
    i_aref = rb_intern("[]");
    i_leftshift = rb_intern("<<");
    i_new = rb_intern("new");
    i_try_convert = rb_intern("try_convert");
    i_freeze = rb_intern("freeze");
    i_uminus = rb_intern("-@");
}

/*
 * Local variables:
 * mode: c
 * c-file-style: ruby
 * indent-tabs-mode: nil
 * End:
 */
