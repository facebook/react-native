# frozen_string_literal: false
require 'mkmf'

have_func("rb_enc_raise", "ruby.h")
have_func("rb_enc_interned_str", "ruby.h")

# checking if String#-@ (str_uminus) dedupes... '
begin
  a = -(%w(t e s t).join)
  b = -(%w(t e s t).join)
  if a.equal?(b)
    $CFLAGS << ' -DSTR_UMINUS_DEDUPE=1 '
  else
    $CFLAGS << ' -DSTR_UMINUS_DEDUPE=0 '
  end
rescue NoMethodError
  $CFLAGS << ' -DSTR_UMINUS_DEDUPE=0 '
end

# checking if String#-@ (str_uminus) directly interns frozen strings... '
begin
  s = rand.to_s.freeze
  if (-s).equal?(s) && (-s.dup).equal?(s)
    $CFLAGS << ' -DSTR_UMINUS_DEDUPE_FROZEN=1 '
  else
    $CFLAGS << ' -DSTR_UMINUS_DEDUPE_FROZEN=0 '
  end
rescue NoMethodError
  $CFLAGS << ' -DSTR_UMINUS_DEDUPE_FROZEN=0 '
end

create_makefile 'json/ext/parser'
