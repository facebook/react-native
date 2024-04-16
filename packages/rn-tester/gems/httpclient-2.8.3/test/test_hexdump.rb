# -*- encoding: utf-8 -*-
require File.expand_path('helper', File.dirname(__FILE__))
require 'hexdump'


class TestHexDump < Test::Unit::TestCase
  def test_encode
    str = "\032l\277\370\2429\216\236\351[{\{\262\350\274\376"
    str.force_encoding('BINARY') if str.respond_to?(:force_encoding)
    assert_equal(["00000000  1a6cbff8 a2398e9e e95b7b7b b2e8bcfe   .l...9...[{{...."], HexDump.encode(str))
  end
end if defined?(RUBY_ENGINE) && RUBY_ENGINE != "rbx" && RUBY_VERSION >= "1.9.0"
# Rubinius 1.8 mode does not support Regexp.quote(raw, 'n')  I don't want put
# a pressure on supporting it because 1.9 mode works fine.
