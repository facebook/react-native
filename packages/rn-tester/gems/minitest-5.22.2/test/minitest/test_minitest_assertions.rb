# encoding: UTF-8

require "minitest/autorun"

if defined? Encoding then
  e = Encoding.default_external
  if e != Encoding::UTF_8 then
    warn ""
    warn ""
    warn "NOTE: External encoding #{e} is not UTF-8. Tests WILL fail."
    warn "      Run tests with `RUBYOPT=-Eutf-8 rake` to avoid errors."
    warn ""
    warn ""
  end
end

SomeError = Class.new Exception

unless defined? MyModule then
  module MyModule; end
  class AnError < StandardError; include MyModule; end
end

class TestMinitestAssertions < Minitest::Test
  # do not call parallelize_me! - teardown accesses @tc._assertions
  # which is not threadsafe. Nearly every method in here is an
  # assertion test so it isn't worth splitting it out further.

  RUBY18 = !defined? Encoding

  # not included in JRuby
  RE_LEVELS = /\(\d+ levels\) /

  class DummyTest
    include Minitest::Assertions
    # include Minitest::Reportable # TODO: why do I really need this?

    attr_accessor :assertions, :failure

    def initialize
      self.assertions = 0
      self.failure = nil
    end
  end

  def setup
    super

    Minitest::Test.reset

    @tc = DummyTest.new
    @zomg = "zomg ponies!" # TODO: const
    @assertion_count = 1
  end

  def teardown
    assert_equal(@assertion_count, @tc.assertions,
                 "expected #{@assertion_count} assertions to be fired during the test, not #{@tc.assertions}")
  end

  def assert_deprecated name
    dep = /DEPRECATED: #{name}. From #{__FILE__}:\d+(?::.*)?/
    dep = "" if $-w.nil?

    assert_output nil, dep do
      yield
    end
  end

  def assert_triggered expected, klass = Minitest::Assertion
    e = assert_raises klass do
      yield
    end

    msg = e.message.sub(/(---Backtrace---).*/m, '\1')
    msg.gsub!(/\(oid=[-0-9]+\)/, "(oid=N)")
    msg.gsub!(/(\d\.\d{6})\d+/, '\1xxx') # normalize: ruby version, impl, platform

    assert_msg = Regexp === expected ? :assert_match : :assert_equal
    self.send assert_msg, expected, msg
  end

  def assert_unexpected expected
    expected = Regexp.new expected if String === expected

    assert_triggered expected, Minitest::UnexpectedError do
      yield
    end
  end

  def clean s
    s.gsub(/^ {6,10}/, "")
  end

  def non_verbose
    orig_verbose = $VERBOSE
    $VERBOSE = false

    yield
  ensure
    $VERBOSE = orig_verbose
  end

  def test_assert
    @assertion_count = 2

    @tc.assert_equal true, @tc.assert(true), "returns true on success"
  end

  def test_assert__triggered
    assert_triggered "Expected false to be truthy." do
      @tc.assert false
    end
  end

  def test_assert__triggered_message
    assert_triggered @zomg do
      @tc.assert false, @zomg
    end
  end

  def test_assert__triggered_lambda
    assert_triggered "whoops" do
      @tc.assert false, lambda { "whoops" }
    end
  end

  def test_assert_empty
    @assertion_count = 2

    @tc.assert_empty []
  end

  def test_assert_empty_triggered
    @assertion_count = 2

    assert_triggered "Expected [1] to be empty." do
      @tc.assert_empty [1]
    end
  end

  def test_assert_equal
    @tc.assert_equal 1, 1
  end

  def test_assert_equal_different_collection_array_hex_invisible
    object1 = Object.new
    object2 = Object.new
    msg = "No visible difference in the Array#inspect output.
           You should look at the implementation of #== on Array or its members.
           [#<Object:0xXXXXXX>]".gsub(/^ +/, "")
    assert_triggered msg do
      @tc.assert_equal [object1], [object2]
    end
  end

  def test_assert_equal_different_collection_hash_hex_invisible
    h1, h2 = {}, {}
    h1[1] = Object.new
    h2[1] = Object.new
    msg = "No visible difference in the Hash#inspect output.
           You should look at the implementation of #== on Hash or its members.
           {1=>#<Object:0xXXXXXX>}".gsub(/^ +/, "")

    assert_triggered msg do
      @tc.assert_equal h1, h2
    end
  end

  def test_assert_equal_different_diff_deactivated
    without_diff do
      assert_triggered util_msg("haha" * 10, "blah" * 10) do
        o1 = "haha" * 10
        o2 = "blah" * 10

        @tc.assert_equal o1, o2
      end
    end
  end

  def test_assert_equal_different_message
    assert_triggered "whoops.\nExpected: 1\n  Actual: 2" do
      @tc.assert_equal 1, 2, message { "whoops" }
    end
  end

  def test_assert_equal_different_lambda
    assert_triggered "whoops.\nExpected: 1\n  Actual: 2" do
      @tc.assert_equal 1, 2, lambda { "whoops" }
    end
  end

  def test_assert_equal_different_hex
    c = Class.new do
      def initialize s; @name = s; end
    end

    o1 = c.new "a"
    o2 = c.new "b"
    msg = clean <<-EOS
          --- expected
          +++ actual
          @@ -1 +1 @@
          -#<#<Class:0xXXXXXX>:0xXXXXXX @name=\"a\">
          +#<#<Class:0xXXXXXX>:0xXXXXXX @name=\"b\">
          EOS

    assert_triggered msg do
      @tc.assert_equal o1, o2
    end
  end

  def test_assert_equal_different_hex_invisible
    o1 = Object.new
    o2 = Object.new

    msg = "No visible difference in the Object#inspect output.
           You should look at the implementation of #== on Object or its members.
           #<Object:0xXXXXXX>".gsub(/^ +/, "")

    assert_triggered msg do
      @tc.assert_equal o1, o2
    end
  end

  def test_assert_equal_different_long
    msg = "--- expected
           +++ actual
           @@ -1 +1 @@
           -\"hahahahahahahahahahahahahahahahahahahaha\"
           +\"blahblahblahblahblahblahblahblahblahblah\"
           ".gsub(/^ +/, "")

    assert_triggered msg do
      o1 = "haha" * 10
      o2 = "blah" * 10

      @tc.assert_equal o1, o2
    end
  end

  def test_assert_equal_different_long_invisible
    msg = "No visible difference in the String#inspect output.
           You should look at the implementation of #== on String or its members.
           \"blahblahblahblahblahblahblahblahblahblah\"".gsub(/^ +/, "")

    assert_triggered msg do
      o1 = "blah" * 10
      o2 = "blah" * 10
      def o1.== _
        false
      end
      @tc.assert_equal o1, o2
    end
  end

  def test_assert_equal_different_long_msg
    msg = "message.
           --- expected
           +++ actual
           @@ -1 +1 @@
           -\"hahahahahahahahahahahahahahahahahahahaha\"
           +\"blahblahblahblahblahblahblahblahblahblah\"
           ".gsub(/^ +/, "")

    assert_triggered msg do
      o1 = "haha" * 10
      o2 = "blah" * 10
      @tc.assert_equal o1, o2, "message"
    end
  end

  def test_assert_equal_different_short
    assert_triggered util_msg(1, 2) do
      @tc.assert_equal 1, 2
    end
  end

  def test_assert_equal_different_short_msg
    assert_triggered util_msg(1, 2, "message") do
      @tc.assert_equal 1, 2, "message"
    end
  end

  def test_assert_equal_different_short_multiline
    msg = "--- expected\n+++ actual\n@@ -1,2 +1,2 @@\n \"a\n-b\"\n+c\"\n"
    assert_triggered msg do
      @tc.assert_equal "a\nb", "a\nc"
    end
  end

  def test_assert_equal_does_not_allow_lhs_nil
    if Minitest::VERSION =~ /^6/ then
      warn "Time to strip the MT5 test"

      @assertion_count += 1
      assert_triggered(/Use assert_nil if expecting nil/) do
        @tc.assert_equal nil, nil
      end
    else
      err_re = /Use assert_nil if expecting nil from .*test_minitest_\w+.rb/
      err_re = "" if $-w.nil?

      assert_output "", err_re do
        @tc.assert_equal nil, nil
      end
    end
  end

  def test_assert_equal_does_not_allow_lhs_nil_triggered
    assert_triggered "Expected: nil\n  Actual: false" do
      @tc.assert_equal nil, false
    end
  end

  def test_assert_equal_string_bug791
    exp = <<-'EOF'.gsub(/^ {10}/, "") # note single quotes
          --- expected
          +++ actual
          @@ -1,2 +1 @@
          -"\\n
          -"
          +"\\\"
        EOF

    exp = "Expected: \"\\\\n\"\n  Actual: \"\\\\\""
    assert_triggered exp do
      @tc.assert_equal "\\n", "\\"
    end
  end

  def test_assert_equal_string_both_escaped_unescaped_newlines
    msg = <<-EOM.gsub(/^ {10}/, "")
          --- expected
          +++ actual
          @@ -1,2 +1 @@
          -\"A\\n
          -B\"
          +\"A\\n\\\\nB\"
          EOM

    assert_triggered msg do
      exp = "A\\nB"
      act = "A\n\\nB"

      @tc.assert_equal exp, act
    end
  end

  def test_assert_equal_string_encodings
    msg = <<-EOM.gsub(/^ {10}/, "")
          --- expected
          +++ actual
          @@ -1,3 +1,3 @@
          -# encoding: UTF-8
          -#    valid: false
          +# encoding: #{Encoding::BINARY.name}
          +#    valid: true
           "bad-utf8-\\xF1.txt"
          EOM

    assert_triggered msg do
      x = "bad-utf8-\xF1.txt"
      y = x.dup.force_encoding "binary" # TODO: switch to .b when 1.9 dropped
      @tc.assert_equal x, y
    end
  end unless RUBY18

  def test_assert_equal_string_encodings_both_different
    msg = <<-EOM.gsub(/^ {10}/, "")
          --- expected
          +++ actual
          @@ -1,3 +1,3 @@
          -# encoding: US-ASCII
          -#    valid: false
          +# encoding: #{Encoding::BINARY.name}
          +#    valid: true
           "bad-utf8-\\xF1.txt"
          EOM

    assert_triggered msg do
      x = "bad-utf8-\xF1.txt".force_encoding "ASCII"
      y = x.dup.force_encoding "binary" # TODO: switch to .b when 1.9 dropped
      @tc.assert_equal x, y
    end
  end unless RUBY18

  def test_assert_equal_unescape_newlines
    msg = <<-'EOM'.gsub(/^ {10}/, "") # NOTE single quotes on heredoc
          --- expected
          +++ actual
          @@ -1,2 +1,2 @@
          -"hello
          +"hello\n
           world"
          EOM

    assert_triggered msg do
      exp = "hello\nworld"
      act = 'hello\nworld'      # notice single quotes

      @tc.assert_equal exp, act
    end
  end

  def test_assert_in_delta
    @tc.assert_in_delta 0.0, 1.0 / 1000, 0.1
  end

  def test_assert_in_delta_triggered
    x = "1.0e-06"
    assert_triggered "Expected |0.0 - 0.001| (0.001) to be <= #{x}." do
      @tc.assert_in_delta 0.0, 1.0 / 1000, 0.000001
    end
  end

  def test_assert_in_epsilon
    @assertion_count = 10

    @tc.assert_in_epsilon 10_000, 9991
    @tc.assert_in_epsilon 9991, 10_000
    @tc.assert_in_epsilon 1.0, 1.001
    @tc.assert_in_epsilon 1.001, 1.0

    @tc.assert_in_epsilon 10_000, 9999.1, 0.0001
    @tc.assert_in_epsilon 9999.1, 10_000, 0.0001
    @tc.assert_in_epsilon 1.0, 1.0001, 0.0001
    @tc.assert_in_epsilon 1.0001, 1.0, 0.0001

    @tc.assert_in_epsilon(-1, -1)
    @tc.assert_in_epsilon(-10_000, -9991)
  end

  def test_assert_in_epsilon_triggered
    assert_triggered "Expected |10000 - 9990| (10) to be <= 9.99." do
      @tc.assert_in_epsilon 10_000, 9990
    end
  end

  def test_assert_in_epsilon_triggered_negative_case
    x = (RUBY18 and not maglev?) ? "0.1" : "0.100000xxx"
    y = "0.1"
    assert_triggered "Expected |-1.1 - -1| (#{x}) to be <= #{y}." do
      @tc.assert_in_epsilon(-1.1, -1, 0.1)
    end
  end

  def test_assert_includes
    @assertion_count = 2

    @tc.assert_includes [true], true
  end

  def test_assert_includes_triggered
    @assertion_count = 3

    e = @tc.assert_raises Minitest::Assertion do
      @tc.assert_includes [true], false
    end

    expected = "Expected [true] to include false."
    assert_equal expected, e.message
  end

  def test_assert_instance_of
    @tc.assert_instance_of String, "blah"
  end

  def test_assert_instance_of_triggered
    assert_triggered 'Expected "blah" to be an instance of Array, not String.' do
      @tc.assert_instance_of Array, "blah"
    end
  end

  def test_assert_kind_of
    @tc.assert_kind_of String, "blah"
  end

  def test_assert_kind_of_triggered
    assert_triggered 'Expected "blah" to be a kind of Array, not String.' do
      @tc.assert_kind_of Array, "blah"
    end
  end

  def test_assert_match
    @assertion_count = 2
    m = @tc.assert_match(/\w+/, "blah blah blah")

    assert_kind_of MatchData, m
    assert_equal "blah", m[0]
  end

  def test_assert_match_matchee_to_str
    @assertion_count = 2

    obj = Object.new
    def obj.to_str; "blah" end

    @tc.assert_match "blah", obj
  end

  def test_assert_match_matcher_object
    @assertion_count = 2

    pattern = Object.new
    def pattern.=~ _; true end

    @tc.assert_match pattern, 5
  end

  def test_assert_match_object_triggered
    @assertion_count = 2

    pattern = Object.new
    def pattern.=~ _; false end
    def pattern.inspect; "[Object]" end

    assert_triggered "Expected [Object] to match 5." do
      @tc.assert_match pattern, 5
    end
  end

  def test_assert_match_triggered
    @assertion_count = 2
    assert_triggered 'Expected /\d+/ to match "blah blah blah".' do
      @tc.assert_match(/\d+/, "blah blah blah")
    end
  end

  def test_assert_nil
    @tc.assert_nil nil
  end

  def test_assert_nil_triggered
    assert_triggered "Expected 42 to be nil." do
      @tc.assert_nil 42
    end
  end

  def test_assert_operator
    @tc.assert_operator 2, :>, 1
  end

  def test_assert_operator_bad_object
    bad = Object.new
    def bad.== _; true end

    @tc.assert_operator bad, :equal?, bad
  end

  def test_assert_operator_triggered
    assert_triggered "Expected 2 to be < 1." do
      @tc.assert_operator 2, :<, 1
    end
  end

  def test_assert_output_both
    @assertion_count = 2

    @tc.assert_output "yay", "blah" do
      print "yay"
      $stderr.print "blah"
    end
  end

  def test_assert_output_both_regexps
    @assertion_count = 4

    @tc.assert_output(/y.y/, /bl.h/) do
      print "yay"
      $stderr.print "blah"
    end
  end

  def test_assert_output_err
    @tc.assert_output nil, "blah" do
      $stderr.print "blah"
    end
  end

  def test_assert_output_neither
    @assertion_count = 0

    @tc.assert_output do
      # do nothing
    end
  end

  def test_assert_output_out
    @tc.assert_output "blah" do
      print "blah"
    end
  end

  def test_assert_output_triggered_both
    assert_triggered util_msg("blah", "blah blah", "In stderr") do
      @tc.assert_output "yay", "blah" do
        print "boo"
        $stderr.print "blah blah"
      end
    end
  end

  def test_assert_output_triggered_err
    assert_triggered util_msg("blah", "blah blah", "In stderr") do
      @tc.assert_output nil, "blah" do
        $stderr.print "blah blah"
      end
    end
  end

  def test_assert_output_triggered_out
    assert_triggered util_msg("blah", "blah blah", "In stdout") do
      @tc.assert_output "blah" do
        print "blah blah"
      end
    end
  end

  def test_assert_output_no_block
    assert_triggered "assert_output requires a block to capture output." do
      @tc.assert_output "blah"
    end
  end

  def test_assert_output_nested_assert_uncaught
    @assertion_count = 1

    assert_triggered "Epic Fail!" do
      @tc.assert_output "blah\n" do
        puts "blah"
        @tc.flunk
      end
    end
  end

  def test_assert_output_nested_raise
    @assertion_count = 2

    @tc.assert_output "blah\n" do
      @tc.assert_raises RuntimeError do
        puts "blah"
        raise "boom!"
      end
    end
  end

  def test_assert_output_nested_raise_bad
    @assertion_count = 0

    assert_unexpected "boom!" do
      @tc.assert_raises do            # 2) bypassed via UnexpectedError
        @tc.assert_output "blah\n" do # 1) captures and raises UnexpectedError
          puts "not_blah"
          raise "boom!"
        end
      end
    end
  end

  def test_assert_output_nested_raise_mismatch
    # this test is redundant, but illustrative
    @assertion_count = 0

    assert_unexpected "boom!" do
      @tc.assert_raises RuntimeError do # 2) bypassed via UnexpectedError
        @tc.assert_output "blah\n" do   # 1) captures and raises UnexpectedError
          puts "not_blah"
          raise ArgumentError, "boom!"
        end
      end
    end
  end

  def test_assert_output_nested_throw_caught
    @assertion_count = 2

    @tc.assert_output "blah\n" do
      @tc.assert_throws :boom! do
        puts "blah"
        throw :boom!
      end
    end
  end

  def test_assert_output_nested_throw_caught_bad
    @assertion_count = 1            # want 0; can't prevent throw from escaping :(

    @tc.assert_throws :boom! do     # 2) captured via catch
      @tc.assert_output "blah\n" do # 1) bypassed via throw
        puts "not_blah"
        throw :boom!
      end
    end
  end

  def test_assert_output_nested_throw_mismatch
    @assertion_count = 0

    assert_unexpected "uncaught throw :boom!" do
      @tc.assert_throws :not_boom! do # 2) captured via assert_throws+rescue
        @tc.assert_output "blah\n" do # 1) bypassed via throw
          puts "not_blah"
          throw :boom!
        end
      end
    end
  end

  def test_assert_output_uncaught_raise
    @assertion_count = 0

    assert_unexpected "RuntimeError: boom!" do
      @tc.assert_output "blah\n" do
        puts "not_blah"
        raise "boom!"
      end
    end
  end

  def test_assert_output_uncaught_throw
    @assertion_count = 0

    assert_unexpected "uncaught throw :boom!" do
      @tc.assert_output "blah\n" do
        puts "not_blah"
        throw :boom!
      end
    end
  end
  def test_assert_predicate
    @tc.assert_predicate "", :empty?
  end

  def test_assert_predicate_triggered
    assert_triggered 'Expected "blah" to be empty?.' do
      @tc.assert_predicate "blah", :empty?
    end
  end

  def test_assert_raises
    @tc.assert_raises RuntimeError do
      raise "blah"
    end
  end

  def test_assert_raises_default
    @tc.assert_raises do
      raise StandardError, "blah"
    end
  end

  def test_assert_raises_default_triggered
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises do
        raise SomeError, "blah"
      end
    end

    expected = clean <<-EOM.chomp
      [StandardError] exception expected, not
      Class: <SomeError>
      Message: <\"blah\">
      ---Backtrace---
      FILE:LINE:in \`block in test_assert_raises_default_triggered\'
      ---------------
    EOM

    actual = e.message.gsub(/^.+:\d+/, "FILE:LINE")
    actual.gsub!(RE_LEVELS, "") unless jruby?

    assert_equal expected, actual
  end

  def test_assert_raises_exit
    @tc.assert_raises SystemExit do
      exit 1
    end
  end

  def test_assert_raises_module
    @tc.assert_raises MyModule do
      raise AnError
    end
  end

  def test_assert_raises_signals
    @tc.assert_raises SignalException do
      raise SignalException, :INT
    end
  end

  def test_assert_raises_throw_nested_bad
    @assertion_count = 0

    assert_unexpected "RuntimeError: boom!" do
      @tc.assert_raises do
        @tc.assert_throws :blah do
          raise "boom!"
          throw :not_blah
        end
      end
    end
  end

  ##
  # *sigh* This is quite an odd scenario, but it is from real (albeit
  # ugly) test code in ruby-core:

  # https://svn.ruby-lang.org/cgi-bin/viewvc.cgi?view=rev&revision=29259

  def test_assert_raises_skip
    @assertion_count = 0

    assert_triggered "skipped", Minitest::Skip do
      @tc.assert_raises ArgumentError do
        begin
          raise "blah"
        rescue
          skip "skipped"
        end
      end
    end
  end

  def test_assert_raises_subclass
    @tc.assert_raises StandardError do
      raise AnError
    end
  end

  def test_assert_raises_subclass_triggered
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises SomeError do
        raise AnError, "some message"
      end
    end

    expected = clean <<-EOM
      [SomeError] exception expected, not
      Class: <AnError>
      Message: <\"some message\">
      ---Backtrace---
      FILE:LINE:in \`block in test_assert_raises_subclass_triggered\'
      ---------------
    EOM

    actual = e.message.gsub(/^.+:\d+/, "FILE:LINE")
    actual.gsub!(RE_LEVELS, "") unless jruby?

    assert_equal expected.chomp, actual
  end

  def test_assert_raises_triggered_different
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises RuntimeError do
        raise SyntaxError, "icky"
      end
    end

    expected = clean <<-EOM.chomp
      [RuntimeError] exception expected, not
      Class: <SyntaxError>
      Message: <\"icky\">
      ---Backtrace---
      FILE:LINE:in \`block in test_assert_raises_triggered_different\'
      ---------------
    EOM

    actual = e.message.gsub(/^.+:\d+/, "FILE:LINE")
    actual.gsub!(RE_LEVELS, "") unless jruby?

    assert_equal expected, actual
  end

  def test_assert_raises_triggered_different_msg
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises RuntimeError, "XXX" do
        raise SyntaxError, "icky"
      end
    end

    expected = clean <<-EOM
      XXX.
      [RuntimeError] exception expected, not
      Class: <SyntaxError>
      Message: <\"icky\">
      ---Backtrace---
      FILE:LINE:in \`block in test_assert_raises_triggered_different_msg\'
      ---------------
    EOM

    actual = e.message.gsub(/^.+:\d+/, "FILE:LINE")
    actual.gsub!(RE_LEVELS, "") unless jruby?

    assert_equal expected.chomp, actual
  end

  def test_assert_raises_triggered_none
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises Minitest::Assertion do
        # do nothing
      end
    end

    expected = "Minitest::Assertion expected but nothing was raised."

    assert_equal expected, e.message
  end

  def test_assert_raises_triggered_none_msg
    e = assert_raises Minitest::Assertion do
      @tc.assert_raises Minitest::Assertion, "XXX" do
        # do nothing
      end
    end

    expected = "XXX.\nMinitest::Assertion expected but nothing was raised."

    assert_equal expected, e.message
  end

  def test_assert_raises_without_block
    assert_triggered "assert_raises requires a block to capture errors." do
      @tc.assert_raises StandardError
    end
  end

  def test_assert_respond_to
    @tc.assert_respond_to "blah", :empty?
  end

  def test_assert_respond_to_triggered
    assert_triggered 'Expected "blah" (String) to respond to #rawr!.' do
      @tc.assert_respond_to "blah", :rawr!
    end
  end

  def test_assert_respond_to__include_all
    @tc.assert_respond_to @tc, :exit, include_all: true
  end

  def test_assert_respond_to__include_all_triggered
    assert_triggered(/Expected .+::DummyTest. to respond to #exit\?/) do
      @tc.assert_respond_to @tc, :exit?, include_all: true
    end
  end

  def test_assert_same
    @assertion_count = 3

    o = "blah"
    @tc.assert_same 1, 1
    @tc.assert_same :blah, :blah
    @tc.assert_same o, o
  end

  def test_assert_same_triggered
    @assertion_count = 2

    assert_triggered "Expected 2 (oid=N) to be the same as 1 (oid=N)." do
      @tc.assert_same 1, 2
    end

    s1 = "blah"
    s2 = "blah"

    assert_triggered 'Expected "blah" (oid=N) to be the same as "blah" (oid=N).' do
      @tc.assert_same s1, s2
    end
  end

  def test_assert_send
    assert_deprecated :assert_send do
      @tc.assert_send [1, :<, 2]
    end
  end

  def test_assert_send_bad
    assert_deprecated :assert_send do
      assert_triggered "Expected 1.>(*[2]) to return true." do
        @tc.assert_send [1, :>, 2]
      end
    end
  end

  def test_assert_silent
    @assertion_count = 2

    @tc.assert_silent do
      # do nothing
    end
  end

  def test_assert_silent_triggered_err
    assert_triggered util_msg("", "blah blah", "In stderr") do
      @tc.assert_silent do
        $stderr.print "blah blah"
      end
    end
  end

  def test_assert_silent_triggered_out
    @assertion_count = 2

    assert_triggered util_msg("", "blah blah", "In stdout") do
      @tc.assert_silent do
        print "blah blah"
      end
    end
  end

  def test_assert_throws
    v = @tc.assert_throws :blah do
      throw :blah
    end

    assert_nil v
  end

  def test_assert_throws_value
    v = @tc.assert_throws :blah do
      throw :blah, 42
    end

    assert_equal 42, v
  end

  def test_assert_throws_argument_exception
    @assertion_count = 0

    assert_unexpected "ArgumentError" do
      @tc.assert_throws :blah do
        raise ArgumentError
      end
    end
  end

  def test_assert_throws_different
    assert_triggered "Expected :blah to have been thrown, not :not_blah." do
      @tc.assert_throws :blah do
        throw :not_blah
      end
    end
  end

  def test_assert_throws_name_error
    @assertion_count = 0

    assert_unexpected "NameError" do
      @tc.assert_throws :blah do
        raise NameError
      end
    end
  end

  def test_assert_throws_unthrown
    assert_triggered "Expected :blah to have been thrown." do
      @tc.assert_throws :blah do
        # do nothing
      end
    end
  end

  def test_assert_path_exists
    @tc.assert_path_exists __FILE__
  end

  def test_assert_path_exists_triggered
    assert_triggered "Expected path 'blah' to exist." do
      @tc.assert_path_exists "blah"
    end
  end

  def test_assert_pattern
    if RUBY_VERSION > "3" then
      @tc.assert_pattern do
        exp = if RUBY_VERSION.start_with? "3.0"
                "(eval):1: warning: One-line pattern matching is experimental, and the behavior may change in future versions of Ruby!\n"
              else
                ""
              end
        assert_output nil, exp do
          eval "[1,2,3] => [Integer, Integer, Integer]" # eval to escape parser for ruby<3
        end
      end
    else
      @assertion_count = 0

      assert_raises NotImplementedError do
        @tc.assert_pattern do
          # do nothing
        end
      end
    end
  end

  def test_assert_pattern_traps_nomatchingpatternerror
    skip unless RUBY_VERSION > "3"
    exp = if RUBY_VERSION.start_with? "3.0" then
            "[1, 2, 3]" # terrible error message!
          else
            /length mismatch/
          end

    assert_triggered exp do
      @tc.assert_pattern do
        capture_io do # 3.0 is noisy
          eval "[1,2,3] => [Integer, Integer]" # eval to escape parser for ruby<3
        end
      end
    end
  end

  def test_assert_pattern_raises_other_exceptions
    skip unless RUBY_VERSION >= "3.0"

    @assertion_count = 0

    assert_raises RuntimeError do
      @tc.assert_pattern do
        raise "boom"
      end
    end
  end

  def test_assert_pattern_with_no_block
    skip unless RUBY_VERSION >= "3.0"

    assert_triggered "assert_pattern requires a block to capture errors." do
      @tc.assert_pattern
    end
  end

  def test_capture_io
    @assertion_count = 0

    non_verbose do
      out, err = capture_io do
        puts "hi"
        $stderr.puts "bye!"
      end

      assert_equal "hi\n", out
      assert_equal "bye!\n", err
    end
  end

  def test_capture_subprocess_io
    @assertion_count = 0

    non_verbose do
      out, err = capture_subprocess_io do
        system("echo hi")
        system("echo bye! 1>&2")
      end

      assert_equal "hi\n", out
      assert_equal "bye!", err.strip
    end
  end

  def test_class_asserts_match_refutes
    @assertion_count = 0

    methods = Minitest::Assertions.public_instance_methods.map(&:to_s)

    # These don't have corresponding refutes _on purpose_. They're
    # useless and will never be added, so don't bother.
    ignores = %w[assert_output assert_raises assert_send
                 assert_silent assert_throws assert_mock]

    ignores += %w[assert_allocations] # for minitest-gcstats

    asserts = methods.grep(/^assert/).sort - ignores
    refutes = methods.grep(/^refute/).sort - ignores

    assert_empty refutes.map { |n| n.sub(/^refute/, "assert") } - asserts
    assert_empty asserts.map { |n| n.sub(/^assert/, "refute") } - refutes
  end

  def test_delta_consistency
    @assertion_count = 2

    @tc.assert_in_delta 0, 1, 1

    assert_triggered "Expected |0 - 1| (1) to not be <= 1." do
      @tc.refute_in_delta 0, 1, 1
    end
  end

  def test_epsilon_consistency
    @assertion_count = 2

    @tc.assert_in_epsilon 1.0, 1.001

    msg = "Expected |1.0 - 1.001| (0.000999xxx) to not be <= 0.001."
    assert_triggered msg do
      @tc.refute_in_epsilon 1.0, 1.001
    end
  end

  def assert_fail_after t
    @tc.fail_after t.year, t.month, t.day, "remove the deprecations"
  end

  def test_fail_after
    d0 = Time.now
    d1 = d0 + 86_400 # I am an idiot

    assert_silent do
      assert_fail_after d1
    end

    assert_triggered "remove the deprecations" do
      assert_fail_after d0
    end
  end

  def test_flunk
    assert_triggered "Epic Fail!" do
      @tc.flunk
    end
  end

  def test_flunk_message
    assert_triggered @zomg do
      @tc.flunk @zomg
    end
  end

  def test_pass
    @tc.pass
  end

  def test_refute
    @assertion_count = 2

    @tc.assert_equal true, @tc.refute(false), "returns true on success"
  end

  def test_refute_empty
    @assertion_count = 2

    @tc.refute_empty [1]
  end

  def test_refute_empty_triggered
    @assertion_count = 2

    assert_triggered "Expected [] to not be empty." do
      @tc.refute_empty []
    end
  end

  def test_refute_equal
    @tc.refute_equal "blah", "yay"
  end

  def test_refute_equal_triggered
    assert_triggered 'Expected "blah" to not be equal to "blah".' do
      @tc.refute_equal "blah", "blah"
    end
  end

  def test_refute_in_delta
    @tc.refute_in_delta 0.0, 1.0 / 1000, 0.000001
  end

  def test_refute_in_delta_triggered
    x = "0.1"
    assert_triggered "Expected |0.0 - 0.001| (0.001) to not be <= #{x}." do
      @tc.refute_in_delta 0.0, 1.0 / 1000, 0.1
    end
  end

  def test_refute_in_epsilon
    @tc.refute_in_epsilon 10_000, 9990-1
  end

  def test_refute_in_epsilon_triggered
    assert_triggered "Expected |10000 - 9990| (10) to not be <= 10.0." do
      @tc.refute_in_epsilon 10_000, 9990
      flunk
    end
  end

  def test_refute_includes
    @assertion_count = 2

    @tc.refute_includes [true], false
  end

  def test_refute_includes_triggered
    @assertion_count = 3

    e = @tc.assert_raises Minitest::Assertion do
      @tc.refute_includes [true], true
    end

    expected = "Expected [true] to not include true."
    assert_equal expected, e.message
  end

  def test_refute_instance_of
    @tc.refute_instance_of Array, "blah"
  end

  def test_refute_instance_of_triggered
    assert_triggered 'Expected "blah" to not be an instance of String.' do
      @tc.refute_instance_of String, "blah"
    end
  end

  def test_refute_kind_of
    @tc.refute_kind_of Array, "blah"
  end

  def test_refute_kind_of_triggered
    assert_triggered 'Expected "blah" to not be a kind of String.' do
      @tc.refute_kind_of String, "blah"
    end
  end

  def test_refute_match
    @assertion_count = 2
    @tc.refute_match(/\d+/, "blah blah blah")
  end

  def test_refute_match_matcher_object
    @assertion_count = 2
    pattern = Object.new
    def pattern.=~ _; false end
    @tc.refute_match pattern, 5
  end

  def test_refute_match_object_triggered
    @assertion_count = 2

    pattern = Object.new
    def pattern.=~ _; true end
    def pattern.inspect; "[Object]" end

    assert_triggered "Expected [Object] to not match 5." do
      @tc.refute_match pattern, 5
    end
  end

  def test_refute_match_triggered
    @assertion_count = 2
    assert_triggered 'Expected /\w+/ to not match "blah blah blah".' do
      @tc.refute_match(/\w+/, "blah blah blah")
    end
  end

  def test_refute_nil
    @tc.refute_nil 42
  end

  def test_refute_nil_triggered
    assert_triggered "Expected nil to not be nil." do
      @tc.refute_nil nil
    end
  end

  def test_refute_operator
    @tc.refute_operator 2, :<, 1
  end

  def test_refute_operator_bad_object
    bad = Object.new
    def bad.== _; true end

    @tc.refute_operator true, :equal?, bad
  end

  def test_refute_operator_triggered
    assert_triggered "Expected 2 to not be > 1." do
      @tc.refute_operator 2, :>, 1
    end
  end

  def test_refute_pattern
    if RUBY_VERSION >= "3.0"
      @tc.refute_pattern do
        capture_io do # 3.0 is noisy
          eval "[1,2,3] => [Integer, Integer, String]"
        end
      end
    else
      @assertion_count = 0

      assert_raises NotImplementedError do
        @tc.refute_pattern do
          eval "[1,2,3] => [Integer, Integer, String]"
        end
      end
    end
  end

  def test_refute_pattern_expects_nomatchingpatternerror
    skip unless RUBY_VERSION > "3"

    assert_triggered(/NoMatchingPatternError expected, but nothing was raised./) do
      @tc.refute_pattern do
        capture_io do # 3.0 is noisy
          eval "[1,2,3] => [Integer, Integer, Integer]"
        end
      end
    end
  end

  def test_refute_pattern_raises_other_exceptions
    skip unless RUBY_VERSION >= "3.0"

    @assertion_count = 0

    assert_raises RuntimeError do
      @tc.refute_pattern do
        raise "boom"
      end
    end
  end

  def test_refute_pattern_with_no_block
    skip unless RUBY_VERSION >= "3.0"

    assert_triggered "refute_pattern requires a block to capture errors." do
      @tc.refute_pattern
    end
  end

  def test_refute_predicate
    @tc.refute_predicate "42", :empty?
  end

  def test_refute_predicate_triggered
    assert_triggered 'Expected "" to not be empty?.' do
      @tc.refute_predicate "", :empty?
    end
  end

  def test_refute_respond_to
    @tc.refute_respond_to "blah", :rawr!
  end

  def test_refute_respond_to_triggered
    assert_triggered 'Expected "blah" to not respond to empty?.' do
      @tc.refute_respond_to "blah", :empty?
    end
  end

  def test_refute_respond_to__include_all
    @tc.refute_respond_to "blah", :missing, include_all: true
  end

  def test_refute_respond_to__include_all_triggered
    assert_triggered(/Expected .*DummyTest.* to not respond to exit./) do
      @tc.refute_respond_to @tc, :exit, include_all: true
    end
  end

  def test_refute_same
    @tc.refute_same 1, 2
  end

  def test_refute_same_triggered
    assert_triggered "Expected 1 (oid=N) to not be the same as 1 (oid=N)." do
      @tc.refute_same 1, 1
    end
  end

  def test_refute_path_exists
    @tc.refute_path_exists "blah"
  end

  def test_refute_path_exists_triggered
    assert_triggered "Expected path '#{__FILE__}' to not exist." do
      @tc.refute_path_exists __FILE__
    end
  end

  def test_skip
    @assertion_count = 0

    assert_triggered "haha!", Minitest::Skip do
      @tc.skip "haha!"
    end
  end

  def assert_skip_until t, msg
    @tc.skip_until t.year, t.month, t.day, msg
  end

  def test_skip_until
    @assertion_count = 0

    d0 = Time.now
    d1 = d0 + 86_400 # I am an idiot

    assert_output "", /Stale skip_until \"not yet\" at .*?:\d+$/ do
      assert_skip_until d0, "not yet"
    end

    assert_triggered "not ready yet", Minitest::Skip do
      assert_skip_until d1, "not ready yet"
    end
  end

  def util_msg exp, act, msg = nil
    s = "Expected: #{exp.inspect}\n  Actual: #{act.inspect}"
    s = "#{msg}.\n#{s}" if msg
    s
  end

  def without_diff
    old_diff = Minitest::Assertions.diff
    Minitest::Assertions.diff = nil

    yield
  ensure
    Minitest::Assertions.diff = old_diff
  end
end

class TestMinitestAssertionHelpers < Minitest::Test
  def assert_mu_pp exp, input, raw = false
    act = mu_pp input

    if String === input && !raw then
      assert_equal "\"#{exp}\"", act
    else
      assert_equal exp, act
    end
  end

  def assert_mu_pp_for_diff exp, input, raw = false
    act = mu_pp_for_diff input

    if String === input && !raw then
      assert_equal "\"#{exp}\"", act
    else
      assert_equal exp, act
    end
  end

  def test_diff_equal
    msg = "No visible difference in the String#inspect output.
           You should look at the implementation of #== on String or its members.
           \"blahblahblahblahblahblahblahblahblahblah\"".gsub(/^ +/, "")

    o1 = "blah" * 10
    o2 = "blah" * 10
    def o1.== _
      false
    end

    assert_equal msg, diff(o1, o2)
  end

  def test_diff_str_mixed
    msg = <<-'EOM'.gsub(/^ {10}/, "") # NOTE single quotes on heredoc
          --- expected
          +++ actual
          @@ -1 +1 @@
          -"A\\n\nB"
          +"A\n\\nB"
          EOM

    exp = "A\\n\nB"
    act = "A\n\\nB"

    assert_equal msg, diff(exp, act)
  end

  def test_diff_str_multiline
    msg = <<-'EOM'.gsub(/^ {10}/, "") # NOTE single quotes on heredoc
          --- expected
          +++ actual
          @@ -1,2 +1,2 @@
           "A
          -B"
          +C"
          EOM

    exp = "A\nB"
    act = "A\nC"

    assert_equal msg, diff(exp, act)
  end

  def test_diff_str_simple
    msg = <<-'EOM'.gsub(/^ {10}/, "").chomp # NOTE single quotes on heredoc
          Expected: "A"
            Actual: "B"
          EOM

    exp = "A"
    act = "B"

    assert_equal msg, diff(exp, act)
  end

  def test_message
    assert_equal "blah2.",         message          { "blah2" }.call
    assert_equal "blah2.",         message("")      { "blah2" }.call
    assert_equal "blah1.\nblah2.", message(:blah1)  { "blah2" }.call
    assert_equal "blah1.\nblah2.", message("blah1") { "blah2" }.call

    message = proc { "blah1" }
    assert_equal "blah1.\nblah2.", message(message) { "blah2" }.call

    message = message { "blah1" }
    assert_equal "blah1.\nblah2.", message(message) { "blah2" }.call
  end

  def test_message_deferred
    var = nil

    msg = message { var = "blah" }

    assert_nil var

    msg.call

    assert_equal "blah", var
  end

  def test_mu_pp
    assert_mu_pp 42.inspect,            42
    assert_mu_pp %w[a b c].inspect,     %w[a b c]
    assert_mu_pp "A B",     "A B"
    assert_mu_pp "A\\nB",   "A\nB"
    assert_mu_pp "A\\\\nB", 'A\nB' # notice single quotes
  end

  def test_mu_pp_for_diff
    assert_mu_pp_for_diff "#<Object:0xXXXXXX>", Object.new
    assert_mu_pp_for_diff "A B",                "A B"
    assert_mu_pp_for_diff [1, 2, 3].inspect,    [1, 2, 3]
    assert_mu_pp_for_diff "A\nB",               "A\nB"
  end

  def test_mu_pp_for_diff_str_bad_encoding
    str = "\666".force_encoding Encoding::UTF_8
    exp = "# encoding: UTF-8\n#    valid: false\n\"\\xB6\""

    assert_mu_pp_for_diff exp, str, :raw
  end

  def test_mu_pp_for_diff_str_bad_encoding_both
    str = "\666A\\n\nB".force_encoding Encoding::UTF_8
    exp = "# encoding: UTF-8\n#    valid: false\n\"\\xB6A\\\\n\\nB\""

    assert_mu_pp_for_diff exp, str, :raw
  end

  def test_mu_pp_for_diff_str_encoding
    str = "A\nB".b
    exp = "# encoding: #{Encoding::BINARY.name}\n#    valid: true\n\"A\nB\""

    assert_mu_pp_for_diff exp, str, :raw
  end

  def test_mu_pp_for_diff_str_encoding_both
    str = "A\\n\nB".b
    exp = "# encoding: #{Encoding::BINARY.name}\n#    valid: true\n\"A\\\\n\\nB\""

    assert_mu_pp_for_diff exp, str, :raw
  end

  def test_mu_pp_for_diff_str_nerd
    assert_mu_pp_for_diff "A\\nB\\\\nC", "A\nB\\nC"
    assert_mu_pp_for_diff "\\nB\\\\nC",  "\nB\\nC"
    assert_mu_pp_for_diff "\\nB\\\\n",   "\nB\\n"
    assert_mu_pp_for_diff "\\n\\\\n",    "\n\\n"
    assert_mu_pp_for_diff "\\\\n\\n",    "\\n\n"
    assert_mu_pp_for_diff "\\\\nB\\n",   "\\nB\n"
    assert_mu_pp_for_diff "\\\\nB\\nC",  "\\nB\nC"
    assert_mu_pp_for_diff "A\\\\n\\nB",  "A\\n\nB"
    assert_mu_pp_for_diff "A\\n\\\\nB",  "A\n\\nB"
    assert_mu_pp_for_diff "\\\\n\\n",    "\\n\n"
    assert_mu_pp_for_diff "\\n\\\\n",    "\n\\n"
  end

  def test_mu_pp_for_diff_str_normal
    assert_mu_pp_for_diff "",        ""
    assert_mu_pp_for_diff "A\\n\n",  "A\\n"
    assert_mu_pp_for_diff "A\\n\nB", "A\\nB"
    assert_mu_pp_for_diff "A\n",     "A\n"
    assert_mu_pp_for_diff "A\nB",    "A\nB"
    assert_mu_pp_for_diff "\\n\n",   "\\n"
    assert_mu_pp_for_diff "\n",      "\n"
    assert_mu_pp_for_diff "\\n\nA",  "\\nA"
    assert_mu_pp_for_diff "\nA",     "\nA"
  end

  def test_mu_pp_str_bad_encoding
    str = "\666".force_encoding Encoding::UTF_8
    exp = "# encoding: UTF-8\n#    valid: false\n\"\\xB6\""

    assert_mu_pp exp, str, :raw
  end

  def test_mu_pp_str_encoding
    str = "A\nB".b
    exp = "# encoding: #{Encoding::BINARY.name}\n#    valid: true\n\"A\\nB\""

    assert_mu_pp exp, str, :raw
  end

  def test_mu_pp_str_immutable
    printer = Class.new { extend Minitest::Assertions }
    str = "test".freeze
    assert_equal '"test"', printer.mu_pp(str)
  end
end
