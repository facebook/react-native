=begin
  poparser.rb - Generate a .mo

  Copyright (C) 2003-2009 Masao Mutoh <mutoh at highway.ne.jp>

  You may redistribute it and/or modify it under the same
  license terms as Ruby.
=end

#MODIFIED
# removed include GetText etc
# added stub translation method _(x)
require 'racc/parser'

module GetText

  class PoParser < Racc::Parser

    def _(x)
      x
    end

module_eval <<'..end src/poparser.ry modeval..id7a99570e05', 'src/poparser.ry', 108
  def unescape(orig)
    ret = orig.gsub(/\\n/, "\n")
    ret.gsub!(/\\t/, "\t")
    ret.gsub!(/\\r/, "\r")
    ret.gsub!(/\\"/, "\"")
    ret
  end

  def parse(str, data, ignore_fuzzy = true)
    @comments = []
    @data = data
    @fuzzy = false
    @msgctxt = ""
    $ignore_fuzzy = ignore_fuzzy

    str.strip!
    @q = []
    until str.empty? do
      case str
      when /\A\s+/
	str = $'
      when /\Amsgctxt/
	@q.push [:MSGCTXT, $&]
	str = $'
      when /\Amsgid_plural/
	@q.push [:MSGID_PLURAL, $&]
	str = $'
      when /\Amsgid/
	@q.push [:MSGID, $&]
	str = $'
      when /\Amsgstr/
	@q.push [:MSGSTR, $&]
	str = $'
      when /\A\[(\d+)\]/
	@q.push [:PLURAL_NUM, $1]
	str = $'
      when /\A\#~(.*)/
	$stderr.print _("Warning: obsolete msgid exists.\n")
	$stderr.print "         #{$&}\n"
	@q.push [:COMMENT, $&]
	str = $'
      when /\A\#(.*)/
	@q.push [:COMMENT, $&]
	str = $'
      when /\A\"(.*)\"/
	@q.push [:STRING, $1]
	str = $'
      else
	#c = str[0,1]
	#@q.push [:STRING, c]
	str = str[1..-1]
      end
    end
    @q.push [false, '$end']
    if $DEBUG
      @q.each do |a,b|
      puts "[#{a}, #{b}]"
      end
    end
    @yydebug = true if $DEBUG
    do_parse

    if @comments.size > 0
      @data.set_comment(:last, @comments.join("\n"))
    end
    @data
  end

  def next_token
    @q.shift
  end

  def on_message(msgid, msgstr)
    if msgstr.size > 0
      @data[msgid] = msgstr
      @data.set_comment(msgid, @comments.join("\n"))
    end
    @comments.clear
    @msgctxt = ""
  end

  def on_comment(comment)
    @fuzzy = true if (/fuzzy/ =~ comment)
    @comments << comment
  end


..end src/poparser.ry modeval..id7a99570e05

##### racc 1.4.5 generates ###

racc_reduce_table = [
 0, 0, :racc_error,
 0, 10, :_reduce_none,
 2, 10, :_reduce_none,
 2, 10, :_reduce_none,
 2, 10, :_reduce_none,
 2, 12, :_reduce_5,
 1, 13, :_reduce_none,
 1, 13, :_reduce_none,
 4, 15, :_reduce_8,
 5, 16, :_reduce_9,
 2, 17, :_reduce_10,
 1, 17, :_reduce_none,
 3, 18, :_reduce_12,
 1, 11, :_reduce_13,
 2, 14, :_reduce_14,
 1, 14, :_reduce_15 ]

racc_reduce_n = 16

racc_shift_n = 26

racc_action_table = [
     3,    13,     5,     7,     9,    15,    16,    17,    20,    17,
    13,    17,    13,    13,    11,    17,    23,    20,    13,    17 ]

racc_action_check = [
     1,    16,     1,     1,     1,    12,    12,    12,    18,    18,
     7,    14,    15,     9,     3,    19,    20,    21,    23,    25 ]

racc_action_pointer = [
   nil,     0,   nil,    14,   nil,   nil,   nil,     3,   nil,     6,
   nil,   nil,     0,   nil,     4,     5,    -6,   nil,     2,     8,
     8,    11,   nil,    11,   nil,    12 ]

racc_action_default = [
    -1,   -16,    -2,   -16,    -3,   -13,    -4,   -16,    -6,   -16,
    -7,    26,   -16,   -15,    -5,   -16,   -16,   -14,   -16,    -8,
   -16,    -9,   -11,   -16,   -10,   -12 ]

racc_goto_table = [
    12,    22,    14,     4,    24,     6,     2,     8,    18,    19,
    10,    21,     1,   nil,   nil,   nil,    25 ]

racc_goto_check = [
     5,     9,     5,     3,     9,     4,     2,     6,     5,     5,
     7,     8,     1,   nil,   nil,   nil,     5 ]

racc_goto_pointer = [
   nil,    12,     5,     2,     4,    -7,     6,     9,    -7,   -17 ]

racc_goto_default = [
   nil,   nil,   nil,   nil,   nil,   nil,   nil,   nil,   nil,   nil ]

racc_token_table = {
 false => 0,
 Object.new => 1,
 :COMMENT => 2,
 :MSGID => 3,
 :MSGCTXT => 4,
 :MSGID_PLURAL => 5,
 :MSGSTR => 6,
 :STRING => 7,
 :PLURAL_NUM => 8 }

racc_use_result_var = true

racc_nt_base = 9

Racc_arg = [
 racc_action_table,
 racc_action_check,
 racc_action_default,
 racc_action_pointer,
 racc_goto_table,
 racc_goto_check,
 racc_goto_default,
 racc_goto_pointer,
 racc_nt_base,
 racc_reduce_table,
 racc_token_table,
 racc_shift_n,
 racc_reduce_n,
 racc_use_result_var ]

Racc_token_to_s_table = [
'$end',
'error',
'COMMENT',
'MSGID',
'MSGCTXT',
'MSGID_PLURAL',
'MSGSTR',
'STRING',
'PLURAL_NUM',
'$start',
'msgfmt',
'comment',
'msgctxt',
'message',
'string_list',
'single_message',
'plural_message',
'msgstr_plural',
'msgstr_plural_line']

Racc_debug_parser = true

##### racc system variables end #####

 # reduce 0 omitted

 # reduce 1 omitted

 # reduce 2 omitted

 # reduce 3 omitted

 # reduce 4 omitted

module_eval <<'.,.,', 'src/poparser.ry', 25
  def _reduce_5( val, _values, result )
    @msgctxt = unescape(val[1]) + "\004"
   result
  end
.,.,

 # reduce 6 omitted

 # reduce 7 omitted

module_eval <<'.,.,', 'src/poparser.ry', 48
  def _reduce_8( val, _values, result )
    if @fuzzy and $ignore_fuzzy
      if val[1] != ""
        $stderr.print _("Warning: fuzzy message was ignored.\n")
        $stderr.print "         msgid '#{val[1]}'\n"
      else
        on_message('', unescape(val[3]))
      end
      @fuzzy = false
    else
      on_message(@msgctxt + unescape(val[1]), unescape(val[3]))
    end
    result = ""
   result
  end
.,.,

module_eval <<'.,.,', 'src/poparser.ry', 65
  def _reduce_9( val, _values, result )
    if @fuzzy and $ignore_fuzzy
      if val[1] != ""
        $stderr.print _("Warning: fuzzy message was ignored.\n")
        $stderr.print "msgid = '#{val[1]}\n"
      else
        on_message('', unescape(val[3]))
      end
      @fuzzy = false
    else
      on_message(@msgctxt + unescape(val[1]) + "\000" + unescape(val[3]), unescape(val[4]))
    end
    result = ""
   result
  end
.,.,

module_eval <<'.,.,', 'src/poparser.ry', 76
  def _reduce_10( val, _values, result )
    if val[0].size > 0
      result = val[0] + "\000" + val[1]
    else
      result = ""
    end
   result
  end
.,.,

 # reduce 11 omitted

module_eval <<'.,.,', 'src/poparser.ry', 84
  def _reduce_12( val, _values, result )
    result = val[2]
   result
  end
.,.,

module_eval <<'.,.,', 'src/poparser.ry', 91
  def _reduce_13( val, _values, result )
    on_comment(val[0])
   result
  end
.,.,

module_eval <<'.,.,', 'src/poparser.ry', 99
  def _reduce_14( val, _values, result )
    result = val.delete_if{|item| item == ""}.join
   result
  end
.,.,

module_eval <<'.,.,', 'src/poparser.ry', 103
  def _reduce_15( val, _values, result )
    result = val[0]
   result
  end
.,.,

 def _reduce_none( val, _values, result )
  result
 end

  end   # class PoParser

end   # module GetText
