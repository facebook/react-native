class MockExpectationError < StandardError; end # :nodoc:

module Minitest # :nodoc:

  ##
  # A simple and clean mock object framework.
  #
  # All mock objects are an instance of Mock

  class Mock
    alias :__respond_to? :respond_to?

    overridden_methods = %i[
      ===
      class
      inspect
      instance_eval
      instance_variables
      object_id
      public_send
      respond_to_missing?
      send
      to_s
    ]

    overridden_methods << :singleton_method_added if defined?(::DEBUGGER__)

    instance_methods.each do |m|
      undef_method m unless overridden_methods.include?(m) || m =~ /^__/
    end

    overridden_methods.map(&:to_sym).each do |method_id|
      define_method method_id do |*args, **kwargs, &b|
        if @expected_calls.key? method_id then
          if kwargs.empty? then # FIX: drop this after 2.7 dead
            method_missing(method_id, *args, &b)
          else
            method_missing(method_id, *args, **kwargs, &b)
          end
        else
          if kwargs.empty? then # FIX: drop this after 2.7 dead
            super(*args, &b)
          else
            super(*args, **kwargs, &b)
          end
        end
      end
    end

    def initialize delegator = nil # :nodoc:
      @delegator = delegator
      @expected_calls = Hash.new { |calls, name| calls[name] = [] }
      @actual_calls   = Hash.new { |calls, name| calls[name] = [] }
    end

    @@KW_WARNED = false # :nodoc:

    ##
    # Expect that method +name+ is called, optionally with +args+ (and
    # +kwargs+ or a +blk+), and returns +retval+.
    #
    #   @mock.expect(:meaning_of_life, 42)
    #   @mock.meaning_of_life # => 42
    #
    #   @mock.expect(:do_something_with, true, [some_obj, true])
    #   @mock.do_something_with(some_obj, true) # => true
    #
    #   @mock.expect(:do_something_else, true) do |a1, a2|
    #     a1 == "buggs" && a2 == :bunny
    #   end
    #
    # +args+ is compared to the expected args using case equality (ie, the
    # '===' operator), allowing for less specific expectations.
    #
    #   @mock.expect(:uses_any_string, true, [String])
    #   @mock.uses_any_string("foo") # => true
    #   @mock.verify  # => true
    #
    #   @mock.expect(:uses_one_string, true, ["foo"])
    #   @mock.uses_one_string("bar") # => raises MockExpectationError
    #
    # If a method will be called multiple times, specify a new expect for each one.
    # They will be used in the order you define them.
    #
    #   @mock.expect(:ordinal_increment, 'first')
    #   @mock.expect(:ordinal_increment, 'second')
    #
    #   @mock.ordinal_increment # => 'first'
    #   @mock.ordinal_increment # => 'second'
    #   @mock.ordinal_increment # => raises MockExpectationError "No more expects available for :ordinal_increment"
    #

    def expect name, retval, args = [], **kwargs, &blk
      name = name.to_sym

      if block_given?
        raise ArgumentError, "args ignored when block given" unless args.empty?
        raise ArgumentError, "kwargs ignored when block given" unless kwargs.empty?
        @expected_calls[name] << { :retval => retval, :block => blk }
      else
        raise ArgumentError, "args must be an array" unless Array === args

        if ENV["MT_KWARGS_HAC\K"] && (Hash === args.last ||
                                      Hash ==  args.last) then
          if kwargs.empty? then
            kwargs = args.pop
          else
            unless @@KW_WARNED then
              from = caller.first
              warn "Using MT_KWARGS_HAC\K yet passing kwargs. From #{from}"
              @@KW_WARNED = true
            end
          end
        end

        @expected_calls[name] <<
          { :retval => retval, :args => args, :kwargs => kwargs }
      end
      self
    end

    def __call name, data # :nodoc:
      case data
      when Hash then
        args   = data[:args].inspect[1..-2]
        kwargs = data[:kwargs]
        if kwargs && !kwargs.empty? then
          args << ", " unless args.empty?
          args << kwargs.inspect[1..-2]
        end
        "#{name}(#{args}) => #{data[:retval].inspect}"
      else
        data.map { |d| __call name, d }.join ", "
      end
    end

    ##
    # Verify that all methods were called as expected. Raises
    # +MockExpectationError+ if the mock object was not called as
    # expected.

    def verify
      @expected_calls.each do |name, expected|
        actual = @actual_calls.fetch(name, nil)
        raise MockExpectationError, "expected #{__call name, expected[0]}" unless actual
        raise MockExpectationError, "expected #{__call name, expected[actual.size]}, got [#{__call name, actual}]" if
          actual.size < expected.size
      end
      true
    end

    def method_missing sym, *args, **kwargs, &block # :nodoc:
      unless @expected_calls.key?(sym) then
        if @delegator && @delegator.respond_to?(sym)
          if kwargs.empty? then # FIX: drop this after 2.7 dead
            return @delegator.public_send(sym, *args, &block)
          else
            return @delegator.public_send(sym, *args, **kwargs, &block)
          end
        else
          raise NoMethodError, "unmocked method %p, expected one of %p" %
            [sym, @expected_calls.keys.sort_by(&:to_s)]
        end
      end

      index = @actual_calls[sym].length
      expected_call = @expected_calls[sym][index]

      unless expected_call then
        raise MockExpectationError, "No more expects available for %p: %p %p" %
          [sym, args, kwargs]
      end

      expected_args, expected_kwargs, retval, val_block =
        expected_call.values_at(:args, :kwargs, :retval, :block)

      expected_kwargs = kwargs.map { |ak, av| [ak, Object] }.to_h if
        Hash == expected_kwargs

      if val_block then
        # keep "verify" happy
        @actual_calls[sym] << expected_call

        raise MockExpectationError, "mocked method %p failed block w/ %p %p" %
          [sym, args, kwargs] unless val_block.call(*args, **kwargs, &block)

        return retval
      end

      if expected_args.size != args.size then
        raise ArgumentError, "mocked method %p expects %d arguments, got %p" %
          [sym, expected_args.size, args]
      end

      if expected_kwargs.size != kwargs.size then
        raise ArgumentError, "mocked method %p expects %d keyword arguments, got %p" %
          [sym, expected_kwargs.size, kwargs]
      end

      zipped_args = expected_args.zip(args)
      fully_matched = zipped_args.all? { |mod, a|
        mod === a or mod == a
      }

      unless fully_matched then
        fmt = "mocked method %p called with unexpected arguments %p"
        raise MockExpectationError, fmt % [sym, args]
      end

      unless expected_kwargs.keys.sort == kwargs.keys.sort then
        fmt = "mocked method %p called with unexpected keywords %p vs %p"
        raise MockExpectationError, fmt % [sym, expected_kwargs.keys, kwargs.keys]
      end

      zipped_kwargs = expected_kwargs.map { |ek, ev|
        av = kwargs[ek]
        [ek, [ev, av]]
      }.to_h

      fully_matched = zipped_kwargs.all? { |ek, (ev, av)|
        ev === av or ev == av
      }

      unless fully_matched then
        fmt = "mocked method %p called with unexpected keyword arguments %p vs %p"
        raise MockExpectationError, fmt % [sym, expected_kwargs, kwargs]
      end

      @actual_calls[sym] << {
        :retval => retval,
        :args => zipped_args.map { |e, a| e === a ? e : a },
        :kwargs => zipped_kwargs.map { |k, (e, a)| [k, e === a ? e : a] }.to_h,
      }

      retval
    end

    def respond_to? sym, include_private = false # :nodoc:
      return true if @expected_calls.key? sym.to_sym
      return true if @delegator && @delegator.respond_to?(sym, include_private)
      __respond_to?(sym, include_private)
    end
  end
end

module Minitest::Assertions
  ##
  # Assert that the mock verifies correctly.

  def assert_mock mock
    assert mock.verify
  end
end

##
# Object extensions for Minitest::Mock.

class Object

  ##
  # Add a temporary stubbed method replacing +name+ for the duration
  # of the +block+. If +val_or_callable+ responds to #call, then it
  # returns the result of calling it, otherwise returns the value
  # as-is. If stubbed method yields a block, +block_args+ will be
  # passed along. Cleans up the stub at the end of the +block+. The
  # method +name+ must exist before stubbing.
  #
  #     def test_stale_eh
  #       obj_under_test = Something.new
  #       refute obj_under_test.stale?
  #
  #       Time.stub :now, Time.at(0) do
  #         assert obj_under_test.stale?
  #       end
  #     end
  #--
  # NOTE: keyword args in callables are NOT checked for correctness
  # against the existing method. Too many edge cases to be worth it.

  def stub name, val_or_callable, *block_args, **block_kwargs, &block
    new_name = "__minitest_stub__#{name}"

    metaclass = class << self; self; end

    if respond_to? name and not methods.map(&:to_s).include? name.to_s then
      metaclass.send :define_method, name do |*args, **kwargs|
        super(*args, **kwargs)
      end
    end

    metaclass.send :alias_method, new_name, name

    if ENV["MT_KWARGS_HAC\K"] then
      metaclass.send :define_method, name do |*args, &blk|
        if val_or_callable.respond_to? :call then
          val_or_callable.call(*args, &blk)
        else
          blk.call(*block_args, **block_kwargs) if blk
          val_or_callable
        end
      end
    else
      metaclass.send :define_method, name do |*args, **kwargs, &blk|
        if val_or_callable.respond_to? :call then
          if kwargs.empty? then # FIX: drop this after 2.7 dead
            val_or_callable.call(*args, &blk)
          else
            val_or_callable.call(*args, **kwargs, &blk)
          end
        else
          if blk then
            if block_kwargs.empty? then # FIX: drop this after 2.7 dead
              blk.call(*block_args)
            else
              blk.call(*block_args, **block_kwargs)
            end
          end
          val_or_callable
        end
      end
    end

    block[self]
  ensure
    metaclass.send :undef_method, name
    metaclass.send :alias_method, name, new_name
    metaclass.send :undef_method, new_name
  end
end
