require "minitest/autorun"

def with_kwargs_env
  ENV["MT_KWARGS_HAC\K"] = "1"

  yield
ensure
  ENV.delete "MT_KWARGS_HAC\K"
end

class TestMinitestMock < Minitest::Test
  def setup
    @mock = Minitest::Mock.new.expect(:foo, nil)
    @mock.expect(:meaning_of_life, 42)
  end

  def test_create_stub_method
    assert_nil @mock.foo
  end

  def test_allow_return_value_specification
    assert_equal 42, @mock.meaning_of_life
  end

  def test_blow_up_if_not_called
    @mock.foo

    util_verify_bad "expected meaning_of_life() => 42"
  end

  def test_not_blow_up_if_everything_called
    @mock.foo
    @mock.meaning_of_life

    assert_mock @mock
  end

  def test_allow_expectations_to_be_added_after_creation
    @mock.expect(:bar, true)
    assert @mock.bar
  end

  def test_not_verify_if_new_expected_method_is_not_called
    @mock.foo
    @mock.meaning_of_life
    @mock.expect(:bar, true)

    util_verify_bad "expected bar() => true"
  end

  def test_blow_up_on_wrong_number_of_arguments
    @mock.foo
    @mock.meaning_of_life
    @mock.expect(:sum, 3, [1, 2])

    e = assert_raises ArgumentError do
      @mock.sum
    end

    assert_equal "mocked method :sum expects 2 arguments, got []", e.message
  end

  def test_return_mock_does_not_raise
    retval = Minitest::Mock.new
    mock = Minitest::Mock.new
    mock.expect(:foo, retval)
    mock.foo

    assert_mock mock
  end

  def test_mock_args_does_not_raise
    arg = Minitest::Mock.new
    mock = Minitest::Mock.new
    mock.expect(:foo, nil, [arg])
    mock.foo(arg)

    assert_mock mock
  end

  def test_set_expectation_on_special_methods
    mock = Minitest::Mock.new

    mock.expect :object_id, "received object_id"
    assert_equal "received object_id", mock.object_id

    mock.expect :respond_to_missing?, "received respond_to_missing?"
    assert_equal "received respond_to_missing?", mock.respond_to_missing?

    mock.expect :===, "received ==="
    assert_equal "received ===", mock.===

    mock.expect :inspect, "received inspect"
    assert_equal "received inspect", mock.inspect

    mock.expect :to_s, "received to_s"
    assert_equal "received to_s", mock.to_s

    mock.expect :public_send, "received public_send"
    assert_equal "received public_send", mock.public_send

    mock.expect :send, "received send"
    assert_equal "received send", mock.send

    assert_mock mock
  end

  def test_expectations_can_be_satisfied_via_send
    @mock.send :foo
    @mock.send :meaning_of_life

    assert_mock @mock
  end

  def test_expectations_can_be_satisfied_via_public_send
    skip "Doesn't run on 1.8" if RUBY_VERSION < "1.9"

    @mock.public_send :foo
    @mock.public_send :meaning_of_life

    assert_mock @mock
  end

  def test_blow_up_on_wrong_arguments
    @mock.foo
    @mock.meaning_of_life
    @mock.expect(:sum, 3, [1, 2])

    e = assert_raises MockExpectationError do
      @mock.sum(2, 4)
    end

    exp = "mocked method :sum called with unexpected arguments [2, 4]"
    assert_equal exp, e.message
  end

  def test_expect_with_non_array_args
    e = assert_raises ArgumentError do
      @mock.expect :blah, 3, false
    end

    assert_match "args must be an array", e.message
  end

  def test_respond_appropriately
    assert @mock.respond_to?(:foo)
    assert @mock.respond_to?(:foo, true)
    assert @mock.respond_to?("foo")
    assert !@mock.respond_to?(:bar)
  end

  def test_no_method_error_on_unexpected_methods
    e = assert_raises NoMethodError do
      @mock.bar
    end

    expected = "unmocked method :bar, expected one of [:foo, :meaning_of_life]"

    assert_match expected, e.message
  end

  def test_assign_per_mock_return_values
    a = Minitest::Mock.new
    b = Minitest::Mock.new

    a.expect(:foo, :a)
    b.expect(:foo, :b)

    assert_equal :a, a.foo
    assert_equal :b, b.foo
  end

  def test_do_not_create_stub_method_on_new_mocks
    a = Minitest::Mock.new
    a.expect(:foo, :a)

    assert !Minitest::Mock.new.respond_to?(:foo)
  end

  def test_mock_is_a_blank_slate
    @mock.expect :kind_of?, true, [String]
    @mock.expect :==, true, [1]

    assert @mock.kind_of?(String), "didn't mock :kind_of\?"
    assert @mock == 1, "didn't mock :=="
  end

  def test_verify_allows_called_args_to_be_loosely_specified
    mock = Minitest::Mock.new
    mock.expect :loose_expectation, true, [Integer]
    mock.loose_expectation 1

    assert_mock mock
  end

  def test_verify_raises_with_strict_args
    mock = Minitest::Mock.new
    mock.expect :strict_expectation, true, [2]

    e = assert_raises MockExpectationError do
      mock.strict_expectation 1
    end

    exp = "mocked method :strict_expectation called with unexpected arguments [1]"
    assert_equal exp, e.message
  end

  def test_method_missing_empty
    mock = Minitest::Mock.new

    mock.expect :a, nil

    mock.a

    e = assert_raises MockExpectationError do
      mock.a
    end

    assert_equal "No more expects available for :a: [] {}", e.message
  end

  def test_same_method_expects_are_verified_when_all_called
    mock = Minitest::Mock.new
    mock.expect :foo, nil, [:bar]
    mock.expect :foo, nil, [:baz]

    mock.foo :bar
    mock.foo :baz

    assert_mock mock
  end

  def test_same_method_expects_blow_up_when_not_all_called
    mock = Minitest::Mock.new
    mock.expect :foo, nil, [:bar]
    mock.expect :foo, nil, [:baz]

    mock.foo :bar

    e = assert_raises(MockExpectationError) { mock.verify }

    exp = "expected foo(:baz) => nil, got [foo(:bar) => nil]"

    assert_equal exp, e.message
  end

  def test_same_method_expects_with_same_args_blow_up_when_not_all_called
    mock = Minitest::Mock.new
    mock.expect :foo, nil, [:bar]
    mock.expect :foo, nil, [:bar]

    mock.foo :bar

    e = assert_raises(MockExpectationError) { mock.verify }

    exp = "expected foo(:bar) => nil, got [foo(:bar) => nil]"

    assert_equal exp, e.message
  end

  def test_delegator_calls_are_propagated
    delegator = Object.new
    mock = Minitest::Mock.new delegator

    refute delegator.nil?
    refute mock.nil?
    assert_mock mock
  end

  def test_handles_kwargs_in_error_message
    mock = Minitest::Mock.new

    mock.expect :foo, nil, [], kw: true
    mock.expect :foo, nil, [], kw: false

    mock.foo kw: true

    e = assert_raises(MockExpectationError) { mock.verify }

    exp = "expected foo(:kw=>false) => nil, got [foo(:kw=>true) => nil]"

    assert_equal exp, e.message
  end

  def test_verify_passes_when_mock_block_returns_true
    mock = Minitest::Mock.new
    mock.expect :foo, nil do
      true
    end

    mock.foo

    assert_mock mock
  end

  def test_mock_block_is_passed_function_params
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil do |a1, a2, a3|
      a1 == arg1 && a2 == arg2 && a3 == arg3
    end

    assert_silent do
      if RUBY_VERSION > "3" then
        mock.foo arg1, arg2, arg3
      else
        mock.foo arg1, arg2, **arg3 # oddity just for ruby 2.7
      end
    end

    assert_mock mock
  end

  def test_mock_block_is_passed_keyword_args__block
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil do |k1:, k2:, k3:|
      k1 == arg1 && k2 == arg2 && k3 == arg3
    end

    mock.foo(k1: arg1, k2: arg2, k3: arg3)

    assert_mock mock
  end

  def test_mock_block_is_passed_keyword_args__block_bad_missing
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil do |k1:, k2:, k3:|
      k1 == arg1 && k2 == arg2 && k3 == arg3
    end

    e = assert_raises ArgumentError do
      mock.foo(k1: arg1, k2: arg2)
    end

    # basically testing ruby ... need ? for ruby < 2.7 :(
    assert_match(/missing keyword: :?k3/, e.message)
  end

  def test_mock_block_is_passed_keyword_args__block_bad_extra
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil do |k1:, k2:|
      k1 == arg1 && k2 == arg2 && k3 == arg3
    end

    e = assert_raises ArgumentError do
      mock.foo(k1: arg1, k2: arg2, k3: arg3)
    end

    # basically testing ruby ... need ? for ruby < 2.7 :(
    assert_match(/unknown keyword: :?k3/, e.message)
  end

  def test_mock_block_is_passed_keyword_args__block_bad_value
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil do |k1:, k2:, k3:|
      k1 == arg1 && k2 == arg2 && k3 == arg3
    end

    e = assert_raises MockExpectationError do
      mock.foo(k1: arg1, k2: arg2, k3: :BAD!)
    end

    exp = "mocked method :foo failed block w/ [] {:k1=>:bar, :k2=>[1, 2, 3], :k3=>:BAD!}"
    assert_equal exp, e.message
  end

  def test_mock_block_is_passed_keyword_args__args
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, k1: arg1, k2: arg2, k3: arg3

    mock.foo(k1: arg1, k2: arg2, k3: arg3)

    assert_mock mock
  end

  def test_mock_allow_all_kwargs__old_style_env
    with_kwargs_env do
      mock = Minitest::Mock.new
      mock.expect :foo, true, [Hash]
      assert_equal true, mock.foo(bar: 42)
    end
  end

  def test_mock_allow_all_kwargs__old_style_env__rewrite
    with_kwargs_env do
      mock = Minitest::Mock.new
      mock.expect :foo, true, [], bar: Integer
      assert_equal true, mock.foo(bar: 42)
    end
  end

  def test_mock_block_is_passed_keyword_args__args__old_style_bad
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, [{k1: arg1, k2: arg2, k3: arg3}]

    e = assert_raises ArgumentError do
      mock.foo(k1: arg1, k2: arg2, k3: arg3)
    end

    assert_equal "mocked method :foo expects 1 arguments, got []", e.message
  end

  def test_mock_block_is_passed_keyword_args__args__old_style_env
    with_kwargs_env do
      arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
      mock = Minitest::Mock.new
      mock.expect :foo, nil, [{k1: arg1, k2: arg2, k3: arg3}]

      mock.foo(k1: arg1, k2: arg2, k3: arg3)

      assert_mock mock
    end
  end

  def test_mock_block_is_passed_keyword_args__args__old_style_both
    with_kwargs_env do
      arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
      mock = Minitest::Mock.new

      assert_output nil, /Using MT_KWARGS_HAC. yet passing kwargs/ do
        mock.expect :foo, nil, [{}], k1: arg1, k2: arg2, k3: arg3
      end

      mock.foo({}, k1: arg1, k2: arg2, k3: arg3)

      assert_mock mock
    end
  end

  def test_mock_block_is_passed_keyword_args__args_bad_missing
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, k1: arg1, k2: arg2, k3: arg3

    e = assert_raises ArgumentError do
      mock.foo(k1: arg1, k2: arg2)
    end

    assert_equal "mocked method :foo expects 3 keyword arguments, got %p" % {k1: arg1, k2: arg2}, e.message
  end

  def test_mock_block_is_passed_keyword_args__args_bad_extra
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, k1: arg1, k2: arg2

    e = assert_raises ArgumentError do
      mock.foo(k1: arg1, k2: arg2, k3: arg3)
    end

    assert_equal "mocked method :foo expects 2 keyword arguments, got %p" % {k1: arg1, k2: arg2, k3: arg3}, e.message
  end

  def test_mock_block_is_passed_keyword_args__args_bad_key
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, k1: arg1, k2: arg2, k3: arg3

    e = assert_raises MockExpectationError do
      mock.foo(k1: arg1, k2: arg2, BAD: arg3)
    end

    assert_includes e.message, "unexpected keywords [:k1, :k2, :k3]"
    assert_includes e.message, "vs [:k1, :k2, :BAD]"
  end

  def test_mock_block_is_passed_keyword_args__args_bad_val
    arg1, arg2, arg3 = :bar, [1, 2, 3], { :a => "a" }
    mock = Minitest::Mock.new
    mock.expect :foo, nil, k1: arg1, k2: arg2, k3: arg3

    e = assert_raises MockExpectationError do
      mock.foo(k1: arg1, k2: :BAD!, k3: arg3)
    end

    assert_match(/unexpected keyword arguments.* vs .*:k2=>:BAD!/, e.message)
  end

  def test_mock_block_is_passed_function_block
    mock = Minitest::Mock.new
    block = proc { "bar" }
    mock.expect :foo, nil do |arg, &blk|
      arg == "foo" &&
      blk == block
    end
    mock.foo "foo", &block
    assert_mock mock
  end

  def test_mock_forward_keyword_arguments
    mock = Minitest::Mock.new
    mock.expect(:foo, nil) { |bar:| bar == 'bar' }
    mock.foo(bar: 'bar')
    assert_mock mock
  end

  def test_verify_fails_when_mock_block_returns_false
    mock = Minitest::Mock.new
    mock.expect :foo, nil do
      false
    end

    e = assert_raises(MockExpectationError) { mock.foo }
    exp = "mocked method :foo failed block w/ [] {}"

    assert_equal exp, e.message
  end

  def test_mock_block_raises_if_args_passed
    mock = Minitest::Mock.new

    e = assert_raises(ArgumentError) do
      mock.expect :foo, nil, [:a, :b, :c] do
        true
      end
    end

    exp = "args ignored when block given"

    assert_match exp, e.message
  end

  def test_mock_block_raises_if_kwargs_passed
    mock = Minitest::Mock.new

    e = assert_raises(ArgumentError) do
      mock.expect :foo, nil, kwargs:1 do
        true
      end
    end

    exp = "kwargs ignored when block given"

    assert_match exp, e.message
  end

  def test_mock_returns_retval_when_called_with_block
    mock = Minitest::Mock.new
    mock.expect(:foo, 32) do
      true
    end

    rs = mock.foo

    assert_equal rs, 32
  end

  def util_verify_bad exp
    e = assert_raises MockExpectationError do
      @mock.verify
    end

    assert_equal exp, e.message
  end

  def test_mock_called_via_send
    mock = Minitest::Mock.new
    mock.expect(:foo, true)

    mock.send :foo
    assert_mock mock
  end

  def test_mock_called_via___send__
    mock = Minitest::Mock.new
    mock.expect(:foo, true)

    mock.__send__ :foo
    assert_mock mock
  end

  def test_mock_called_via_send_with_args
    mock = Minitest::Mock.new
    mock.expect(:foo, true, [1, 2, 3])

    mock.send(:foo, 1, 2, 3)
    assert_mock mock
  end

end

require "minitest/metametameta"

class TestMinitestStub < Minitest::Test
  # Do not parallelize since we're calling stub on class methods

  def setup
    super
    Minitest::Test.reset

    @tc = Minitest::Test.new "fake tc"
    @assertion_count = 1
  end

  def teardown
    super
    assert_equal @assertion_count, @tc.assertions if self.passed?
  end

  class Time
    def self.now
      24
    end
  end

  def assert_stub val_or_callable
    @assertion_count += 1

    t = Time.now.to_i

    Time.stub :now, val_or_callable do
      @tc.assert_equal 42, Time.now
    end

    @tc.assert_operator Time.now.to_i, :>=, t
  end

  def test_stub_private_module_method
    @assertion_count += 1

    t0 = Time.now

    self.stub :sleep, nil do
      @tc.assert_nil sleep(10)
    end

    @tc.assert_operator Time.now - t0, :<=, 1
  end

  def test_stub_private_module_method_indirect
    @assertion_count += 1

    fail_clapper = Class.new do
      def fail_clap
        raise
        :clap
      end
    end.new

    fail_clapper.stub :raise, nil do |safe_clapper|
      @tc.assert_equal :clap, safe_clapper.fail_clap # either form works
      @tc.assert_equal :clap, fail_clapper.fail_clap # yay closures
    end
  end

  def test_stub_public_module_method
    Math.stub :log10, :stubbed do
      @tc.assert_equal :stubbed, Math.log10(1000)
    end
  end

  def test_stub_value
    assert_stub 42
  end

  def test_stub_block
    assert_stub lambda { 42 }
  end

  def test_stub_block_args
    @assertion_count += 1

    t = Time.now.to_i

    Time.stub :now,  lambda { |n| n * 2 } do
      @tc.assert_equal 42, Time.now(21)
    end

    @tc.assert_operator Time.now.to_i, :>=, t
  end

  def test_stub_callable
    obj = Object.new

    def obj.call
      42
    end

    assert_stub obj
  end

  def test_stub_yield_self
    obj = "foo"

    val = obj.stub :to_s, "bar" do |s|
      s.to_s
    end

    @tc.assert_equal "bar", val
  end

  def test_dynamic_method
    @assertion_count = 2

    dynamic = Class.new do
      def self.respond_to? meth
        meth == :found
      end

      def self.method_missing meth, *args, &block
        if meth == :found
          false
        else
          super
        end
      end
    end

    val = dynamic.stub(:found, true) do |s|
      s.found
    end

    @tc.assert_equal true, val
    @tc.assert_equal false, dynamic.found
  end

  def test_stub_NameError
    e = @tc.assert_raises NameError do
      Time.stub :nope_nope_nope, 42 do
        # do nothing
      end
    end

    exp = jruby? ? /Undefined method nope_nope_nope for '#{self.class}::Time'/ :
      /undefined method `nope_nope_nope' for( class)? `#{self.class}::Time'/
    assert_match exp, e.message
  end

  def test_mock_with_yield
    mock = Minitest::Mock.new
    mock.expect(:write, true) do
      true
    end
    rs = nil

    File.stub :open, true, mock do
      File.open "foo.txt", "r" do |f|
        rs = f.write
      end
    end
    @tc.assert_equal true, rs
  end

  def test_mock_with_yield_kwargs
    mock = Minitest::Mock.new
    rs = nil

    File.stub :open, true, mock, kw:42 do
      File.open "foo.txt", "r" do |f, kw:|
        rs = kw
      end
    end

    @tc.assert_equal 42, rs
  end

  alias test_stub_value__old test_stub_value # TODO: remove/rename

  ## Permutation Sets:

  # [:value, :lambda]
  # [:*,     :block,     :block_call]
  # [:**,    :block_args]
  #
  # Where:
  #
  # :value      = a normal value
  # :lambda     = callable or lambda
  # :*          = no block
  # :block      = normal block
  # :block_call = :lambda invokes the block (N/A for :value)
  # :**         = no args
  # :args       = args passed to stub

  ## Permutations

  # [:call,   :*,          :**]   =>5 callable+block FIX: CALL BOTH (bug)
  # [:call,   :*,          :**]   =>6 callable

  # [:lambda, :*,          :**]   =>  lambda result

  # [:lambda, :*,          :args] =>  lambda result NO ARGS

  # [:lambda, :block,      :**]   =>5 lambda result FIX: CALL BOTH (bug)
  # [:lambda, :block,      :**]   =>6 lambda result

  # [:lambda, :block,      :args] =>5 lambda result FIX: CALL BOTH (bug)
  # [:lambda, :block,      :args] =>6 lambda result
  # [:lambda, :block,      :args] =>7 raise ArgumentError

  # [:lambda, :block_call, :**]   =>5 lambda FIX: BUG!-not passed block to lambda
  # [:lambda, :block_call, :**]   =>6 lambda+block result

  # [:lambda, :block_call, :args] =>5 lambda FIX: BUG!-not passed block to lambda
  # [:lambda, :block_call, :args] =>6 lambda+block result

  # [:value,  :*,          :**]   =>  value

  # [:value,  :*,          :args] =>  value, ignore args

  # [:value,  :block,      :**]   =>5 value, call block
  # [:value,  :block,      :**]   =>6 value

  # [:value,  :block,      :args] =>5 value, call block w/ args
  # [:value,  :block,      :args] =>6 value, call block w/ args, deprecated
  # [:value,  :block,      :args] =>7 raise ArgumentError

  # [:value,  :block_call, :**]   =>  N/A

  # [:value,  :block_call, :args] =>  N/A

  class Bar
    def call
      puts "hi"
    end
  end

  class Foo
    def self.blocking
      yield
    end
  end

  class Thingy
    def self.identity arg
      arg
    end
  end

  class Keywords
    def self.args req, kw1:, kw2:24
      [req, kw1, kw2]
    end
  end

  def test_stub_callable_keyword_args
    Keywords.stub :args, ->(*args, **kws) { [args, kws] } do
      @tc.assert_equal [["woot"], { kw1: 42 }], Keywords.args("woot", kw1: 42)
    end
  end

  def test_stub__hash_as_last_real_arg
    with_kwargs_env do
      token = Object.new
      def token.create_with_retry u, p; raise "shouldn't see this"; end

      controller = Object.new
      controller.define_singleton_method :create do |u, p|
        token.create_with_retry u, p
      end

      params = Object.new
      def params.to_hash; raise "nah"; end

      token.stub(:create_with_retry, ->(u, p) { 42 }) do
        act = controller.create :u, params
        @tc.assert_equal 42, act
      end
    end
  end

  def test_stub_callable_block_5 # from tenderlove
    @assertion_count += 1
    Foo.stub5 :blocking, Bar.new do
      @tc.assert_output "hi\n", "" do
        Foo.blocking do
          @tc.flunk "shouldn't ever hit this"
        end
      end
    end
  end

  def test_stub_callable_block_6 # from tenderlove
    skip_stub6

    @assertion_count += 1
    Foo.stub6 :blocking, Bar.new do
      @tc.assert_output "hi\n", "" do
        Foo.blocking do
          @tc.flunk "shouldn't ever hit this"
        end
      end
    end
  end

  def test_stub_lambda
    Thread.stub :new, lambda { 21+21 } do
      @tc.assert_equal 42, Thread.new
    end
  end

  def test_stub_lambda_args
    Thread.stub :new, lambda { 21+21 }, :wtf do
      @tc.assert_equal 42, Thread.new
    end
  end

  def test_stub_lambda_block_5
    Thread.stub5 :new, lambda { 21+21 } do
      result = Thread.new do
        @tc.flunk "shouldn't ever hit this"
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_lambda_block_6
    skip_stub6

    Thread.stub6 :new, lambda { 21+21 } do
      result = Thread.new do
        @tc.flunk "shouldn't ever hit this"
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_lambda_block_args_5
    @assertion_count += 1
    Thingy.stub5 :identity, lambda { |y| @tc.assert_equal :nope, y; 21+21 }, :WTF? do
      result = Thingy.identity :nope do |x|
        @tc.flunk "shouldn't reach this"
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_lambda_block_args_6
    skip_stub6

    @assertion_count += 1
    Thingy.stub6 :identity, lambda { |y| @tc.assert_equal :nope, y; 21+21 }, :WTF? do
      result = Thingy.identity :nope do |x|
        @tc.flunk "shouldn't reach this"
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_lambda_block_args_6_2
    skip_stub6

    @tc.assert_raises ArgumentError do
      Thingy.stub6_2 :identity, lambda { |y| :__not_run__ }, :WTF? do
        # doesn't matter
      end
    end
  end

  def test_stub_lambda_block_call_5
    @assertion_count += 1
    rs = nil
    io = StringIO.new "", "w"
    File.stub5 :open, lambda { |p, m, &blk| blk and blk.call io } do
      File.open "foo.txt", "r" do |f|
        rs = f && f.write("woot")
      end
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_lambda_block_call_6
    skip_stub6

    @assertion_count += 1
    rs = nil
    io = StringIO.new "", "w"
    File.stub6 :open, lambda { |p, m, &blk| blk.call io } do
      File.open "foo.txt", "r" do |f|
        rs = f.write("woot")
      end
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_lambda_block_call_args_5
    @assertion_count += 1
    rs = nil
    io = StringIO.new "", "w"
    File.stub5(:open, lambda { |p, m, &blk| blk and blk.call io }, :WTF?) do
      File.open "foo.txt", "r" do |f|
        rs = f.write("woot")
      end
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_lambda_block_call_args_6
    skip_stub6

    @assertion_count += 1
    rs = nil
    io = StringIO.new "", "w"
    File.stub6(:open, lambda { |p, m, &blk| blk.call io }, :WTF?) do
      File.open "foo.txt", "r" do |f|
        rs = f.write("woot")
      end
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_lambda_block_call_args_6_2
    skip_stub6

    @assertion_count += 2
    rs = nil
    io = StringIO.new "", "w"
    @tc.assert_raises ArgumentError do
      File.stub6_2(:open, lambda { |p, m, &blk| blk.call io }, :WTF?) do
        File.open "foo.txt", "r" do |f|
          rs = f.write("woot")
        end
      end
    end
    @tc.assert_nil rs
    @tc.assert_equal "", io.string
  end

  def test_stub_value
    Thread.stub :new, 42 do
      result = Thread.new
      @tc.assert_equal 42, result
    end
  end

  def test_stub_value_args
    Thread.stub :new, 42, :WTF? do
      result = Thread.new
      @tc.assert_equal 42, result
    end
  end

  def test_stub_value_block_5
    @assertion_count += 1
    Thread.stub5 :new, 42 do
      result = Thread.new do
        @tc.assert true
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_value_block_6
    skip_stub6

    Thread.stub6 :new, 42 do
      result = Thread.new do
        @tc.flunk "shouldn't hit this"
      end
      @tc.assert_equal 42, result
    end
  end

  def test_stub_value_block_args_5
    @assertion_count += 2
    rs = nil
    io = StringIO.new "", "w"
    File.stub5 :open, :value, io do
      result = File.open "foo.txt", "r" do |f|
        rs = f.write("woot")
      end
      @tc.assert_equal :value, result
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_value_block_args_5__break_if_not_passed
    e = @tc.assert_raises NoMethodError do
      File.stub5 :open, :return_value do # intentionally bad setup w/ no args
        File.open "foo.txt", "r" do |f|
          f.write "woot"
        end
      end
    end
    exp = /undefined method `write' for nil/
    assert_match exp, e.message
  end

  def test_stub_value_block_args_6
    skip_stub6

    @assertion_count += 2
    rs = nil
    io = StringIO.new "", "w"
    assert_deprecated do
      File.stub6 :open, :value, io do
        result = File.open "foo.txt", "r" do |f|
          rs = f.write("woot")
        end
        @tc.assert_equal :value, result
      end
    end
    @tc.assert_equal 4, rs
    @tc.assert_equal "woot", io.string
  end

  def test_stub_value_block_args_6_2
    skip_stub6

    @assertion_count += 2
    rs = nil
    io = StringIO.new "", "w"
    @tc.assert_raises ArgumentError do
      File.stub6_2 :open, :value, io do
        result = File.open "foo.txt", "r" do |f|
          @tc.flunk "shouldn't hit this"
        end
        @tc.assert_equal :value, result
      end
    end
    @tc.assert_nil rs
    @tc.assert_equal "", io.string
  end

  def assert_deprecated re = /deprecated/
    assert_output "", re do
      yield
    end
  end

  def skip_stub6
    skip "not yet" unless STUB6
  end
end

STUB6 = ENV["STUB6"]

if STUB6 then
  require "minitest/mock6" if STUB6
else
  class Object
    alias stub5 stub
    alias stub6 stub
  end
end
