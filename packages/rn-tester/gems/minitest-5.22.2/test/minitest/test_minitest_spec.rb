# encoding: utf-8
require "minitest/metametameta"
require "stringio"

class MiniSpecA < Minitest::Spec; end
class MiniSpecB < Minitest::Test; extend Minitest::Spec::DSL; end
class MiniSpecC < MiniSpecB; end
class NamedExampleA < MiniSpecA; end
class NamedExampleB < MiniSpecB; end
class NamedExampleC < MiniSpecC; end
class ExampleA; end
class ExampleB < ExampleA; end

describe Minitest::Spec do
  # helps to deal with 2.4 deprecation of Fixnum for Integer
  Int = 1.class

  # do not parallelize this suite... it just can"t handle it.

  def assert_triggered expected = "blah", klass = Minitest::Assertion
    @assertion_count += 1

    e = assert_raises(klass) do
      yield
    end

    msg = e.message.sub(/(---Backtrace---).*/m, '\1')
    msg.gsub!(/\(oid=[-0-9]+\)/, "(oid=N)")
    msg.gsub!(/(\d\.\d{6})\d+/, '\1xxx') # normalize: ruby version, impl, platform
    msg.gsub!(/:0x[Xa-fA-F0-9]{4,}[ @].+?>/, ":0xXXXXXX@PATH>")

    if expected
      @assertion_count += 1
      case expected
      when String then
        assert_equal expected, msg
      when Regexp then
        @assertion_count += 1
        assert_match expected, msg
      else
        flunk "Unknown: #{expected.inspect}"
      end
    end
  end

  def assert_success spec
    assert_equal true, spec
  end

  before do
    @assertion_count = 4
  end

  after do
    _(self.assertions).must_equal @assertion_count if passed? and not skipped?
  end

  it "needs to be able to catch a Minitest::Assertion exception" do
    @assertion_count = 1

    assert_triggered "Expected 1 to not be equal to 1." do
      _(1).wont_equal 1
    end
  end

  it "needs to check for file existence" do
    @assertion_count = 3

    assert_success _(__FILE__).path_must_exist

    assert_triggered "Expected path 'blah' to exist." do
      _("blah").path_must_exist
    end
  end

  it "needs to check for file non-existence" do
    @assertion_count = 3

    assert_success _("blah").path_wont_exist

    assert_triggered "Expected path '#{__FILE__}' to not exist." do
      _(__FILE__).path_wont_exist
    end
  end

  it "needs to be sensible about must_include order" do
    @assertion_count += 3 # must_include is 2 assertions

    assert_success _([1, 2, 3]).must_include(2)

    assert_triggered "Expected [1, 2, 3] to include 5." do
      _([1, 2, 3]).must_include 5
    end

    assert_triggered "msg.\nExpected [1, 2, 3] to include 5." do
      _([1, 2, 3]).must_include 5, "msg"
    end
  end

  it "needs to be sensible about wont_include order" do
    @assertion_count += 3 # wont_include is 2 assertions

    assert_success _([1, 2, 3]).wont_include(5)

    assert_triggered "Expected [1, 2, 3] to not include 2." do
      _([1, 2, 3]).wont_include 2
    end

    assert_triggered "msg.\nExpected [1, 2, 3] to not include 2." do
      _([1, 2, 3]).wont_include 2, "msg"
    end
  end

  it "needs to catch an expected exception" do
    @assertion_count = 2

    expect { raise "blah" }.must_raise RuntimeError
    expect { raise Minitest::Assertion }.must_raise Minitest::Assertion
  end

  it "needs to catch an unexpected exception" do
    @assertion_count -= 2 # no positive

    msg = <<-EOM.gsub(/^ {6}/, "").chomp
      [RuntimeError] exception expected, not
      Class: <StandardError>
      Message: <"woot">
      ---Backtrace---
    EOM

    assert_triggered msg do
      expect { raise StandardError, "woot" }.must_raise RuntimeError
    end

    assert_triggered "msg.\n#{msg}" do
      expect { raise StandardError, "woot" }.must_raise RuntimeError, "msg"
    end
  end

  def good_pattern
    capture_io do # 3.0 is noisy
      eval "[1,2,3] => [Integer, Integer, Integer]" # eval to escape parser for ruby<3
    end
  end

  def bad_pattern
    capture_io do # 3.0 is noisy
      eval "[1,2,3] => [Integer, Integer]" # eval to escape parser for ruby<3
    end
  end

  it "needs to pattern match" do
    @assertion_count = 1

    if RUBY_VERSION > "3" then
      expect { good_pattern }.must_pattern_match
    else
      assert_raises NotImplementedError do
        expect {}.must_pattern_match
      end
    end
  end

  it "needs to error on bad pattern match" do
    skip unless RUBY_VERSION > "3"

    @assertion_count = 1

    exp = if RUBY_VERSION.start_with? "3.0"
            "[1, 2, 3]" # terrible error message!
          else
            /length mismatch/
          end

    assert_triggered exp do
      expect { bad_pattern }.must_pattern_match
    end
  end

  it "needs to ensure silence" do
    @assertion_count -= 1 # no msg
    @assertion_count += 2 # assert_output is 2 assertions

    assert_success expect {}.must_be_silent

    assert_triggered "In stdout.\nExpected: \"\"\n  Actual: \"xxx\"" do
      expect { print "xxx" }.must_be_silent
    end
  end

  it "needs to have all methods named well" do
    skip "N/A" if ENV["MT_NO_EXPECTATIONS"]

    @assertion_count = 2

    methods = Minitest::Expectations.public_instance_methods.grep(/must|wont/)
    methods.map!(&:to_s) if Symbol === methods.first

    musts, wonts = methods.sort.partition { |m| m =~ /must/ }

    expected_musts = %w[must_be
                        must_be_close_to
                        must_be_empty
                        must_be_instance_of
                        must_be_kind_of
                        must_be_nil
                        must_be_same_as
                        must_be_silent
                        must_be_within_delta
                        must_be_within_epsilon
                        must_equal
                        must_include
                        must_match
                        must_output
                        must_pattern_match
                        must_raise
                        must_respond_to
                        must_throw
                        path_must_exist]

    bad = %w[not raise throw send output be_silent]

    expected_wonts = expected_musts.map { |m| m.sub(/must/, "wont") }.sort
    expected_wonts.reject! { |m| m =~ /wont_#{Regexp.union(*bad)}/ }

    _(musts).must_equal expected_musts
    _(wonts).must_equal expected_wonts
  end

  it "needs to raise if an expected exception is not raised" do
    @assertion_count -= 2 # no positive test

    assert_triggered "RuntimeError expected but nothing was raised." do
      expect { 42 }.must_raise RuntimeError
    end

    assert_triggered "msg.\nRuntimeError expected but nothing was raised." do
      expect { 42 }.must_raise RuntimeError, "msg"
    end
  end

  it "needs to verify binary messages" do
    assert_success _(42).wont_be(:<, 24)

    assert_triggered "Expected 24 to not be < 42." do
      _(24).wont_be :<, 42
    end

    assert_triggered "msg.\nExpected 24 to not be < 42." do
      _(24).wont_be :<, 42, "msg"
    end
  end

  it "needs to verify emptyness" do
    @assertion_count += 3 # empty is 2 assertions

    assert_success _([]).must_be_empty

    assert_triggered "Expected [42] to be empty." do
      _([42]).must_be_empty
    end

    assert_triggered "msg.\nExpected [42] to be empty." do
      _([42]).must_be_empty "msg"
    end
  end

  it "needs to verify equality" do
    @assertion_count += 1

    assert_success _(6 * 7).must_equal(42)

    assert_triggered "Expected: 42\n  Actual: 54" do
      _(6 * 9).must_equal 42
    end

    assert_triggered "msg.\nExpected: 42\n  Actual: 54" do
      _(6 * 9).must_equal 42, "msg"
    end

    assert_triggered(/^-42\n\+#<Proc:0xXXXXXX[ @]PATH>\n/) do
      _(proc { 42 }).must_equal 42 # proc isn't called, so expectation fails
    end
  end

  it "needs to warn on equality with nil" do
    @assertion_count += 1 # extra test

    out, err = capture_io do
      assert_success _(nil).must_equal(nil)
    end

    exp = "DEPRECATED: Use assert_nil if expecting nil from #{__FILE__}:#{__LINE__-3}. " \
      "This will fail in Minitest 6.\n"
    exp = "" if $-w.nil?

    assert_empty out
    assert_equal exp, err
  end

  it "needs to verify floats outside a delta" do
    @assertion_count += 1 # extra test

    assert_success _(24).wont_be_close_to(42)

    assert_triggered "Expected |42 - 42.0| (0.0) to not be <= 0.001." do
      _(6 * 7.0).wont_be_close_to 42
    end

    x = "1.0e-05"
    assert_triggered "Expected |42 - 42.0| (0.0) to not be <= #{x}." do
      _(6 * 7.0).wont_be_close_to 42, 0.00001
    end

    assert_triggered "msg.\nExpected |42 - 42.0| (0.0) to not be <= #{x}." do
      _(6 * 7.0).wont_be_close_to 42, 0.00001, "msg"
    end
  end

  it "needs to verify floats outside an epsilon" do
    @assertion_count += 1 # extra test

    assert_success _(24).wont_be_within_epsilon(42)

    x = "0.042"
    assert_triggered "Expected |42 - 42.0| (0.0) to not be <= #{x}." do
      _(6 * 7.0).wont_be_within_epsilon 42
    end

    x = "0.00042"
    assert_triggered "Expected |42 - 42.0| (0.0) to not be <= #{x}." do
      _(6 * 7.0).wont_be_within_epsilon 42, 0.00001
    end

    assert_triggered "msg.\nExpected |42 - 42.0| (0.0) to not be <= #{x}." do
      _(6 * 7.0).wont_be_within_epsilon 42, 0.00001, "msg"
    end
  end

  it "needs to verify floats within a delta" do
    @assertion_count += 1 # extra test

    assert_success _(6.0 * 7).must_be_close_to(42.0)

    assert_triggered "Expected |0.0 - 0.01| (0.01) to be <= 0.001." do
      _(1.0 / 100).must_be_close_to 0.0
    end

    x = "1.0e-06"
    assert_triggered "Expected |0.0 - 0.001| (0.001) to be <= #{x}." do
      _(1.0 / 1000).must_be_close_to 0.0, 0.000001
    end

    assert_triggered "msg.\nExpected |0.0 - 0.001| (0.001) to be <= #{x}." do
      _(1.0 / 1000).must_be_close_to 0.0, 0.000001, "msg"
    end
  end

  it "needs to verify floats within an epsilon" do
    @assertion_count += 1 # extra test

    assert_success _(6.0 * 7).must_be_within_epsilon(42.0)

    assert_triggered "Expected |0.0 - 0.01| (0.01) to be <= 0.0." do
      _(1.0 / 100).must_be_within_epsilon 0.0
    end

    assert_triggered "Expected |0.0 - 0.001| (0.001) to be <= 0.0." do
      _(1.0 / 1000).must_be_within_epsilon 0.0, 0.000001
    end

    assert_triggered "msg.\nExpected |0.0 - 0.001| (0.001) to be <= 0.0." do
      _(1.0 / 1000).must_be_within_epsilon 0.0, 0.000001, "msg"
    end
  end

  it "needs to verify identity" do
    assert_success _(1).must_be_same_as(1)

    assert_triggered "Expected 1 (oid=N) to be the same as 2 (oid=N)." do
      _(1).must_be_same_as 2
    end

    assert_triggered "msg.\nExpected 1 (oid=N) to be the same as 2 (oid=N)." do
      _(1).must_be_same_as 2, "msg"
    end
  end

  it "needs to verify inequality" do
    @assertion_count += 2
    assert_success _(42).wont_equal(6 * 9)
    assert_success _(proc {}).wont_equal(42)

    assert_triggered "Expected 1 to not be equal to 1." do
      _(1).wont_equal 1
    end

    assert_triggered "msg.\nExpected 1 to not be equal to 1." do
      _(1).wont_equal 1, "msg"
    end
  end

  it "needs to verify instances of a class" do
    assert_success _(42).wont_be_instance_of(String)

    assert_triggered "Expected 42 to not be a kind of #{Int.name}." do
      _(42).wont_be_kind_of Int
    end

    assert_triggered "msg.\nExpected 42 to not be an instance of #{Int.name}." do
      _(42).wont_be_instance_of Int, "msg"
    end
  end

  it "needs to verify kinds of a class" do
    @assertion_count += 2

    assert_success _(42).wont_be_kind_of(String)
    assert_success _(proc {}).wont_be_kind_of(String)

    assert_triggered "Expected 42 to not be a kind of #{Int.name}." do
      _(42).wont_be_kind_of Int
    end

    assert_triggered "msg.\nExpected 42 to not be a kind of #{Int.name}." do
      _(42).wont_be_kind_of Int, "msg"
    end
  end

  it "needs to verify kinds of objects" do
    @assertion_count += 3 # extra test

    assert_success _(6 * 7).must_be_kind_of(Int)
    assert_success _(6 * 7).must_be_kind_of(Numeric)

    assert_triggered "Expected 42 to be a kind of String, not #{Int.name}." do
      _(6 * 7).must_be_kind_of String
    end

    assert_triggered "msg.\nExpected 42 to be a kind of String, not #{Int.name}." do
      _(6 * 7).must_be_kind_of String, "msg"
    end

    exp = "Expected #<Proc:0xXXXXXX@PATH> to be a kind of String, not Proc."
    assert_triggered exp do
      _(proc {}).must_be_kind_of String
    end
  end

  it "needs to verify mismatch" do
    @assertion_count += 3 # match is 2

    assert_success _("blah").wont_match(/\d+/)

    assert_triggered "Expected /\\w+/ to not match \"blah\"." do
      _("blah").wont_match(/\w+/)
    end

    assert_triggered "msg.\nExpected /\\w+/ to not match \"blah\"." do
      _("blah").wont_match(/\w+/, "msg")
    end
  end

  it "needs to verify nil" do
    assert_success _(nil).must_be_nil

    assert_triggered "Expected 42 to be nil." do
      _(42).must_be_nil
    end

    assert_triggered "msg.\nExpected 42 to be nil." do
      _(42).must_be_nil "msg"
    end
  end

  it "needs to verify non-emptyness" do
    @assertion_count += 3 # empty is 2 assertions

    assert_success _(["some item"]).wont_be_empty

    assert_triggered "Expected [] to not be empty." do
      _([]).wont_be_empty
    end

    assert_triggered "msg.\nExpected [] to not be empty." do
      _([]).wont_be_empty "msg"
    end
  end

  it "needs to verify non-identity" do
    assert_success _(1).wont_be_same_as(2)

    assert_triggered "Expected 1 (oid=N) to not be the same as 1 (oid=N)." do
      _(1).wont_be_same_as 1
    end

    assert_triggered "msg.\nExpected 1 (oid=N) to not be the same as 1 (oid=N)." do
      _(1).wont_be_same_as 1, "msg"
    end
  end

  it "needs to verify non-nil" do
    assert_success _(42).wont_be_nil

    assert_triggered "Expected nil to not be nil." do
      _(nil).wont_be_nil
    end

    assert_triggered "msg.\nExpected nil to not be nil." do
      _(nil).wont_be_nil "msg"
    end
  end

  it "needs to verify objects not responding to a message" do
    assert_success _("").wont_respond_to(:woot!)

    assert_triggered "Expected \"\" to not respond to to_s." do
      _("").wont_respond_to :to_s
    end

    assert_triggered "msg.\nExpected \"\" to not respond to to_s." do
      _("").wont_respond_to :to_s, "msg"
    end
  end

  it "needs to verify output in stderr" do
    @assertion_count -= 1 # no msg

    assert_success expect { $stderr.print "blah" }.must_output(nil, "blah")

    assert_triggered "In stderr.\nExpected: \"blah\"\n  Actual: \"xxx\"" do
      expect { $stderr.print "xxx" }.must_output(nil, "blah")
    end
  end

  it "needs to verify output in stdout" do
    @assertion_count -= 1 # no msg

    assert_success expect { print "blah" }.must_output("blah")

    assert_triggered "In stdout.\nExpected: \"blah\"\n  Actual: \"xxx\"" do
      expect { print "xxx" }.must_output("blah")
    end
  end

  it "needs to verify regexp matches" do
    @assertion_count += 3 # must_match is 2 assertions

    assert_kind_of MatchData, _("blah").must_match(/\w+/)

    assert_triggered "Expected /\\d+/ to match \"blah\"." do
      _("blah").must_match(/\d+/)
    end

    assert_triggered "msg.\nExpected /\\d+/ to match \"blah\"." do
      _("blah").must_match(/\d+/, "msg")
    end
  end

  describe "expect" do
    before do
      @assertion_count -= 3
    end

    it "can use expect" do
      _(1 + 1).must_equal 2
    end

    it "can use expect with a lambda" do
      _ { raise "blah" }.must_raise RuntimeError
    end

    it "can use expect in a thread" do
      Thread.new { _(1 + 1).must_equal 2 }.join
    end

    it "can NOT use must_equal in a thread. It must use expect in a thread" do
      skip "N/A" if ENV["MT_NO_EXPECTATIONS"]
      assert_raises RuntimeError do
        capture_io do
          Thread.new { (1 + 1).must_equal 2 }.join
        end
      end
    end

    it "fails gracefully when expectation used outside of `it`" do
      skip "N/A" if ENV["MT_NO_EXPECTATIONS"]

      @assertion_count += 1

      e = assert_raises RuntimeError do
        capture_io do
          Thread.new { # forces ctx to be nil
            describe("woot") do
              (1 + 1).must_equal 2
            end
          }.join
        end
      end

      assert_equal "Calling #must_equal outside of test.", e.message
    end

    it "deprecates expectation used without _" do
      skip "N/A" if ENV["MT_NO_EXPECTATIONS"]

      @assertion_count += 3

      exp = /DEPRECATED: global use of must_equal from/

      assert_output "", exp do
        (1 + 1).must_equal 2
      end
    end

    # https://github.com/seattlerb/minitest/issues/837
    # https://github.com/rails/rails/pull/39304
    it "deprecates expectation used without _ with empty backtrace_filter" do
      skip "N/A" if ENV["MT_NO_EXPECTATIONS"]

      @assertion_count += 3

      exp = /DEPRECATED: global use of must_equal from/

      with_empty_backtrace_filter do
        assert_output "", exp do
          (1 + 1).must_equal 2
        end
      end
    end
  end

  it "needs to verify throw" do
    @assertion_count += 4 # 2 extra tests

    assert_nil expect { throw :blah }.must_throw(:blah)
    assert_equal 42, expect { throw :blah, 42 }.must_throw(:blah)

    assert_triggered "Expected :blah to have been thrown." do
      expect {}.must_throw :blah
    end

    assert_triggered "Expected :blah to have been thrown, not :xxx." do
      expect { throw :xxx }.must_throw :blah
    end

    assert_triggered "msg.\nExpected :blah to have been thrown." do
      expect {}.must_throw :blah, "msg"
    end

    assert_triggered "msg.\nExpected :blah to have been thrown, not :xxx." do
      expect { throw :xxx }.must_throw :blah, "msg"
    end
  end

  it "needs to verify types of objects" do
    assert_success _(6 * 7).must_be_instance_of(Int)

    exp = "Expected 42 to be an instance of String, not #{Int.name}."

    assert_triggered exp do
      _(6 * 7).must_be_instance_of String
    end

    assert_triggered "msg.\n#{exp}" do
      _(6 * 7).must_be_instance_of String, "msg"
    end
  end

  it "needs to verify using any (negative) predicate" do
    @assertion_count -= 1 # doesn"t take a message

    assert_success _("blah").wont_be(:empty?)

    assert_triggered "Expected \"\" to not be empty?." do
      _("").wont_be :empty?
    end
  end

  it "needs to verify using any binary operator" do
    @assertion_count -= 1 # no msg

    assert_success _(41).must_be(:<, 42)

    assert_triggered "Expected 42 to be < 41." do
      _(42).must_be(:<, 41)
    end
  end

  it "needs to verify using any predicate" do
    @assertion_count -= 1 # no msg

    assert_success _("").must_be(:empty?)

    assert_triggered "Expected \"blah\" to be empty?." do
      _("blah").must_be :empty?
    end
  end

  it "needs to verify using respond_to" do
    assert_success _(42).must_respond_to(:+)

    assert_triggered "Expected 42 (#{Int.name}) to respond to #clear." do
      _(42).must_respond_to :clear
    end

    assert_triggered "msg.\nExpected 42 (#{Int.name}) to respond to #clear." do
      _(42).must_respond_to :clear, "msg"
    end
  end
end

describe Minitest::Spec, :let do
  i_suck_and_my_tests_are_order_dependent!

  def _count
    $let_count ||= 0
  end

  let :count do
    $let_count += 1
    $let_count
  end

  it "is evaluated once per example" do
    _(_count).must_equal 0

    _(count).must_equal 1
    _(count).must_equal 1

    _(_count).must_equal 1
  end

  it "is REALLY evaluated once per example" do
    _(_count).must_equal 1

    _(count).must_equal 2
    _(count).must_equal 2

    _(_count).must_equal 2
  end

  it 'raises an error if the name begins with "test"' do
    expect { self.class.let(:test_value) { true } }.must_raise ArgumentError
  end

  it "raises an error if the name shadows a normal instance method" do
    expect { self.class.let(:message) { true } }.must_raise ArgumentError
  end

  it "doesn't raise an error if it is just another let" do
    v = proc do
      describe :outer do
        let(:bar)
        describe :inner do
          let(:bar)
        end
      end
      :good
    end.call
    _(v).must_equal :good
  end

  it "procs come after dont_flip" do
    p = proc {}
    assert_respond_to p, :call
    _(p).must_respond_to :call
  end
end

describe Minitest::Spec, :subject do
  attr_reader :subject_evaluation_count

  subject do
    @subject_evaluation_count ||= 0
    @subject_evaluation_count  += 1
    @subject_evaluation_count
  end

  it "is evaluated once per example" do
    _(subject).must_equal 1
    _(subject).must_equal 1
    _(subject_evaluation_count).must_equal 1
  end
end

class TestMetaStatic < Minitest::Test
  def assert_method_count expected, klass
    assert_equal expected, klass.public_instance_methods.grep(/^test_/).count
  end

  def test_children
    Minitest::Spec.children.clear # prevents parallel run

    y = z = nil
    x = describe "top-level thingy" do
      y = describe "first thingy" do end

      it "top-level-it" do end

      z = describe "second thingy" do end
    end

    assert_equal [x], Minitest::Spec.children
    assert_equal [y, z], x.children
    assert_equal [], y.children
    assert_equal [], z.children
  end

  def test_it_wont_remove_existing_child_test_methods
    Minitest::Spec.children.clear # prevents parallel run

    inner = nil
    outer = describe "outer" do
      inner = describe "inner" do
        it do
          assert true
        end
      end
      it do
        assert true
      end
    end

    assert_method_count 1, outer
    assert_method_count 1, inner
  end

  def test_it_wont_add_test_methods_to_children
    Minitest::Spec.children.clear # prevents parallel run

    inner = nil
    outer = describe "outer" do
      inner = describe "inner" do end
      it do
        assert true
      end
    end

    assert_method_count 1, outer
    assert_method_count 0, inner
  end
end

class TestMeta < MetaMetaMetaTestCase
  # do not call parallelize_me! here because specs use register_spec_type globally

  def assert_defined_methods expected, klass
    assert_equal expected, klass.instance_methods(false).sort.map(&:to_s)
  end

  def util_structure
    y = z = nil
    before_list = []
    after_list  = []
    x = describe "top-level thingy" do
      before { before_list << 1 }
      after  { after_list  << 1 }

      it "top-level-it" do end

      y = describe "inner thingy" do
        before { before_list << 2 }
        after  { after_list  << 2 }
        it "inner-it" do end

        z = describe "very inner thingy" do
          before { before_list << 3 }
          after  { after_list  << 3 }
          it "inner-it" do end

          it      { } # ignore me
          specify { } # anonymous it
        end
      end
    end

    return x, y, z, before_list, after_list
  end

  def test_register_spec_type
    original_types = Minitest::Spec::TYPES.dup

    assert_includes Minitest::Spec::TYPES, [//, Minitest::Spec]

    Minitest::Spec.register_spec_type(/woot/, TestMeta)

    p = lambda do |_| true end
    Minitest::Spec.register_spec_type TestMeta, &p

    keys = Minitest::Spec::TYPES.map(&:first)

    assert_includes keys, /woot/
    assert_includes keys, p
  ensure
    Minitest::Spec::TYPES.replace original_types
  end

  def test_spec_type
    original_types = Minitest::Spec::TYPES.dup

    Minitest::Spec.register_spec_type(/A$/, MiniSpecA)
    Minitest::Spec.register_spec_type MiniSpecB do |desc|
      desc.superclass == ExampleA
    end
    Minitest::Spec.register_spec_type MiniSpecC do |_desc, *addl|
      addl.include? :woot
    end

    assert_equal MiniSpecA, Minitest::Spec.spec_type(ExampleA)
    assert_equal MiniSpecB, Minitest::Spec.spec_type(ExampleB)
    assert_equal MiniSpecC, Minitest::Spec.spec_type(ExampleB, :woot)
  ensure
    Minitest::Spec::TYPES.replace original_types
  end

  def test_bug_dsl_expectations
    spec_class = Class.new MiniSpecB do
      it "should work" do
        _(0).must_equal 0
      end
    end

    test_name = spec_class.instance_methods.sort.grep(/test_/).first

    spec = spec_class.new test_name

    result = spec.run

    assert spec.passed?
    assert result.passed?
    assert_equal 1, result.assertions
  end

  def test_name
    spec_a = describe ExampleA do; end
    spec_b = describe ExampleB, :random_method do; end
    spec_c = describe ExampleB, :random_method, :addl_context do; end

    assert_equal "ExampleA", spec_a.name
    assert_equal "ExampleB::random_method", spec_b.name
    assert_equal "ExampleB::random_method::addl_context", spec_c.name
  end

  def test_name2
    assert_equal "NamedExampleA", NamedExampleA.name
    assert_equal "NamedExampleB", NamedExampleB.name
    assert_equal "NamedExampleC", NamedExampleC.name

    spec_a = describe ExampleA do; end
    spec_b = describe ExampleB, :random_method do; end

    assert_equal "ExampleA", spec_a.name
    assert_equal "ExampleB::random_method", spec_b.name
  end

  def test_structure
    x, y, z, * = util_structure

    assert_equal "top-level thingy",                                  x.to_s
    assert_equal "top-level thingy::inner thingy",                    y.to_s
    assert_equal "top-level thingy::inner thingy::very inner thingy", z.to_s

    assert_equal "top-level thingy",  x.desc
    assert_equal "inner thingy",      y.desc
    assert_equal "very inner thingy", z.desc

    top_methods = %w[setup teardown test_0001_top-level-it]
    inner_methods1 = %w[setup teardown test_0001_inner-it]
    inner_methods2 = inner_methods1 +
      %w[test_0002_anonymous test_0003_anonymous]

    assert_defined_methods top_methods, x
    assert_defined_methods inner_methods1, y
    assert_defined_methods inner_methods2, z
  end

  def test_structure_postfix_it
    z = nil
    y = describe "outer" do
      # NOT here, below the inner-describe!
      # it "inner-it" do end

      z = describe "inner" do
        it "inner-it" do end
      end

      # defined AFTER inner describe means we'll try to wipe out the inner-it
      it "inner-it" do end
    end

    assert_defined_methods %w[test_0001_inner-it], y
    assert_defined_methods %w[test_0001_inner-it], z
  end

  def test_setup_teardown_behavior
    _, _, z, before_list, after_list = util_structure

    @tu = z

    run_tu_with_fresh_reporter

    size = z.runnable_methods.size
    assert_equal [1, 2, 3] * size, before_list
    assert_equal [3, 2, 1] * size, after_list
  end

  def test_describe_first_structure
    x1 = x2 = y = z = nil
    x = describe "top-level thingy" do
      y = describe "first thingy" do end

      x1 = it "top level it" do end
      x2 = it "не латинские &いった α, β, γ, δ, ε hello!!! world" do end

      z = describe "second thingy" do end
    end

    test_methods = ["test_0001_top level it",
                    "test_0002_не латинские &いった α, β, γ, δ, ε hello!!! world",
                   ].sort

    assert_equal test_methods, [x1, x2]
    assert_defined_methods test_methods, x
    assert_defined_methods [], y
    assert_defined_methods [], z
  end

  def test_structure_subclasses
    z = nil
    x = Class.new Minitest::Spec do
      def xyz; end
    end
    y = Class.new x do
      z = describe("inner") { }
    end

    assert_respond_to x.new(nil), "xyz"
    assert_respond_to y.new(nil), "xyz"
    assert_respond_to z.new(nil), "xyz"
  end
end

class TestSpecInTestCase < MetaMetaMetaTestCase
  def setup
    super

    Thread.current[:current_spec] = self
    @tc = self
    @assertion_count = 2
  end

  def assert_triggered expected, klass = Minitest::Assertion
    @assertion_count += 1

    e = assert_raises klass do
      yield
    end

    msg = e.message.sub(/(---Backtrace---).*/m, "\1")
    msg.gsub!(/\(oid=[-0-9]+\)/, "(oid=N)")

    assert_equal expected, msg
  end

  def teardown
    msg = "expected #{@assertion_count} assertions, not #{@tc.assertions}"
    assert_equal @assertion_count, @tc.assertions, msg
  end

  def test_expectation
    @tc.assert_equal true, _(1).must_equal(1)
  end

  def test_expectation_triggered
    assert_triggered "Expected: 2\n  Actual: 1" do
      _(1).must_equal 2
    end
  end

  include Minitest::Spec::DSL::InstanceMethods

  def test_expectation_with_a_message
    assert_triggered "woot.\nExpected: 2\n  Actual: 1" do
      _(1).must_equal 2, "woot"
    end
  end
end

class ValueMonadTest < Minitest::Test
  attr_accessor :struct

  def setup
    @struct = { :_ => "a", :value => "b", :expect => "c" }
    def @struct.method_missing k # think openstruct
      self[k]
    end
  end

  def test_value_monad_method
    assert_equal "a", struct._
  end

  def test_value_monad_value_alias
    assert_equal "b", struct.value
  end

  def test_value_monad_expect_alias
    assert_equal "c", struct.expect
  end
end

describe Minitest::Spec, :infect_an_assertion do
  class << self
    attr_accessor :infect_mock
  end

  def assert_infects exp, act, msg = nil, foo: nil, bar: nil
    self.class.infect_mock.assert_infects exp, act, msg, foo: foo, bar: bar
  end

  infect_an_assertion :assert_infects, :must_infect
  infect_an_assertion :assert_infects, :must_infect_without_flipping, :dont_flip

  it "infects assertions with kwargs" do
    mock = Minitest::Mock.new
    mock.expect :assert_infects, true, [:exp, :act, nil], foo: :foo, bar: :bar

    self.class.infect_mock = mock

    _(:act).must_infect :exp, foo: :foo, bar: :bar

    assert_mock mock
  end

  it "infects assertions with kwargs (dont_flip)" do
    mock = Minitest::Mock.new
    mock.expect :assert_infects, true, [:act, :exp, nil], foo: :foo, bar: :bar

    self.class.infect_mock = mock

    _(:act).must_infect_without_flipping :exp, foo: :foo, bar: :bar

    assert_mock mock
  end
end
