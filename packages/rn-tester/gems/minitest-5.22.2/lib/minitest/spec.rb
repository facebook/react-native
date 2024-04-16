require "minitest/test"

class Module # :nodoc:
  def infect_an_assertion meth, new_name, dont_flip = false # :nodoc:
    block = dont_flip == :block
    dont_flip = false if block
    target_obj = block ? '_{obj.method}' : '_(obj)'

    # https://eregon.me/blog/2021/02/13/correct-delegation-in-ruby-2-27-3.html
    # Drop this when we can drop ruby 2.6 (aka after rails 6.1 EOL, ~2024-06)
    kw_extra = "ruby2_keywords %p" % [new_name] if respond_to?(:ruby2_keywords, true)

    # warn "%-22p -> %p %p" % [meth, new_name, dont_flip]
    self.class_eval <<-EOM, __FILE__, __LINE__ + 1
      def #{new_name} *args
        where = Minitest.filter_backtrace(caller).first
        where = where.split(/:in /, 2).first # clean up noise
        Kernel.warn "DEPRECATED: global use of #{new_name} from #\{where}. Use #{target_obj}.#{new_name} instead. This will fail in Minitest 6."
        Minitest::Expectation.new(self, Minitest::Spec.current).#{new_name}(*args)
      end
      #{kw_extra}
    EOM

    Minitest::Expectation.class_eval <<-EOM, __FILE__, __LINE__ + 1
      def #{new_name} *args
        raise "Calling ##{new_name} outside of test." unless ctx
        case
        when #{!!dont_flip} then
          ctx.#{meth}(target, *args)
        when #{block} && Proc === target then
          ctx.#{meth}(*args, &target)
        else
          ctx.#{meth}(args.first, target, *args[1..-1])
        end
      end
      #{kw_extra}
    EOM
  end
end

Minitest::Expectation = Struct.new :target, :ctx # :nodoc:

##
# Kernel extensions for minitest

module Kernel
  ##
  # Describe a series of expectations for a given target +desc+.
  #
  # Defines a test class subclassing from either Minitest::Spec or
  # from the surrounding describe's class. The surrounding class may
  # subclass Minitest::Spec manually in order to easily share code:
  #
  #     class MySpec < Minitest::Spec
  #       # ... shared code ...
  #     end
  #
  #     class TestStuff < MySpec
  #       it "does stuff" do
  #         # shared code available here
  #       end
  #       describe "inner stuff" do
  #         it "still does stuff" do
  #           # ...and here
  #         end
  #       end
  #     end
  #
  # For more information on getting started with writing specs, see:
  #
  # http://www.rubyinside.com/a-minitestspec-tutorial-elegant-spec-style-testing-that-comes-with-ruby-5354.html
  #
  # For some suggestions on how to improve your specs, try:
  #
  # https://betterspecs.org
  #
  # but do note that several items there are debatable or specific to
  # rspec.
  #
  # For more information about expectations, see Minitest::Expectations.

  def describe desc, *additional_desc, &block # :doc:
    stack = Minitest::Spec.describe_stack
    name  = [stack.last, desc, *additional_desc].compact.join("::")
    sclas = stack.last || if Class === self && kind_of?(Minitest::Spec::DSL) then
                            self
                          else
                            Minitest::Spec.spec_type desc, *additional_desc
                          end

    cls = sclas.create name, desc

    stack.push cls
    cls.class_eval(&block)
    stack.pop
    cls
  end
  private :describe
end

##
# Minitest::Spec -- The faster, better, less-magical spec framework!
#
# For a list of expectations, see Minitest::Expectations.

class Minitest::Spec < Minitest::Test

  def self.current # :nodoc:
    Thread.current[:current_spec]
  end

  def initialize name # :nodoc:
    super
    Thread.current[:current_spec] = self
  end

  ##
  # Oh look! A Minitest::Spec::DSL module! Eat your heart out DHH.

  module DSL
    ##
    # Contains pairs of matchers and Spec classes to be used to
    # calculate the superclass of a top-level describe. This allows for
    # automatically customizable spec types.
    #
    # See: register_spec_type and spec_type

    TYPES = [[//, Minitest::Spec]]

    ##
    # Register a new type of spec that matches the spec's description.
    # This method can take either a Regexp and a spec class or a spec
    # class and a block that takes the description and returns true if
    # it matches.
    #
    # Eg:
    #
    #     register_spec_type(/Controller$/, Minitest::Spec::Rails)
    #
    # or:
    #
    #     register_spec_type(Minitest::Spec::RailsModel) do |desc|
    #       desc.superclass == ActiveRecord::Base
    #     end

    def register_spec_type *args, &block
      if block then
        matcher, klass = block, args.first
      else
        matcher, klass = *args
      end
      TYPES.unshift [matcher, klass]
    end

    ##
    # Figure out the spec class to use based on a spec's description. Eg:
    #
    #     spec_type("BlahController") # => Minitest::Spec::Rails

    def spec_type desc, *additional
      TYPES.find { |matcher, _klass|
        if matcher.respond_to? :call then
          matcher.call desc, *additional
        else
          matcher === desc.to_s
        end
      }.last
    end

    def describe_stack # :nodoc:
      Thread.current[:describe_stack] ||= []
    end

    def children # :nodoc:
      @children ||= []
    end

    def nuke_test_methods! # :nodoc:
      self.public_instance_methods.grep(/^test_/).each do |name|
        self.send :undef_method, name
      end
    end

    ##
    # Define a 'before' action. Inherits the way normal methods should.
    #
    # NOTE: +type+ is ignored and is only there to make porting easier.
    #
    # Equivalent to Minitest::Test#setup.

    def before _type = nil, &block
      define_method :setup do
        super()
        self.instance_eval(&block)
      end
    end

    ##
    # Define an 'after' action. Inherits the way normal methods should.
    #
    # NOTE: +type+ is ignored and is only there to make porting easier.
    #
    # Equivalent to Minitest::Test#teardown.

    def after _type = nil, &block
      define_method :teardown do
        self.instance_eval(&block)
        super()
      end
    end

    ##
    # Define an expectation with name +desc+. Name gets morphed to a
    # proper test method name. For some freakish reason, people who
    # write specs don't like class inheritance, so this goes way out of
    # its way to make sure that expectations aren't inherited.
    #
    # This is also aliased to #specify and doesn't require a +desc+ arg.
    #
    # Hint: If you _do_ want inheritance, use minitest/test. You can mix
    # and match between assertions and expectations as much as you want.

    def it desc = "anonymous", &block
      block ||= proc { skip "(no tests defined)" }

      @specs ||= 0
      @specs += 1

      name = "test_%04d_%s" % [ @specs, desc ]

      undef_klasses = self.children.reject { |c| c.public_method_defined? name }

      define_method name, &block

      undef_klasses.each do |undef_klass|
        undef_klass.send :undef_method, name
      end

      name
    end

    ##
    # Essentially, define an accessor for +name+ with +block+.
    #
    # Why use let instead of def? I honestly don't know.

    def let name, &block
      name = name.to_s
      pre, post = "let '#{name}' cannot ", ". Please use another name."
      methods = Minitest::Spec.instance_methods.map(&:to_s) - %w[subject]
      raise ArgumentError, "#{pre}begin with 'test'#{post}" if
        name =~ /\Atest/
      raise ArgumentError, "#{pre}override a method in Minitest::Spec#{post}" if
        methods.include? name

      define_method name do
        @_memoized ||= {}
        @_memoized.fetch(name) { |k| @_memoized[k] = instance_eval(&block) }
      end
    end

    ##
    # Another lazy man's accessor generator. Made even more lazy by
    # setting the name for you to +subject+.

    def subject &block
      let :subject, &block
    end

    def create name, desc # :nodoc:
      cls = Class.new(self) do
        @name = name
        @desc = desc

        nuke_test_methods!
      end

      children << cls

      cls
    end

    def name # :nodoc:
      defined?(@name) ? @name : super
    end

    def to_s # :nodoc:
      name # Can't alias due to 1.8.7, not sure why
    end

    attr_reader :desc # :nodoc:
    alias :specify :it

    ##
    # Rdoc... why are you so dumb?

    module InstanceMethods
      ##
      # Takes a value or a block and returns a value monad that has
      # all of Expectations methods available to it.
      #
      #   _(1 + 1).must_equal 2
      #
      # And for blocks:
      #
      #   _ { 1 + "1" }.must_raise TypeError
      #
      # This method of expectation-based testing is preferable to
      # straight-expectation methods (on Object) because it stores its
      # test context, bypassing our hacky use of thread-local variables.
      #
      # NOTE: At some point, the methods on Object will be deprecated
      # and then removed.
      #
      # It is also aliased to #value and #expect for your aesthetic
      # pleasure:
      #
      #         _(1 + 1).must_equal 2
      #     value(1 + 1).must_equal 2
      #    expect(1 + 1).must_equal 2

      def _ value = nil, &block
        Minitest::Expectation.new block || value, self
      end

      alias value _
      alias expect _

      def before_setup # :nodoc:
        super
        Thread.current[:current_spec] = self
      end
    end

    def self.extended obj # :nodoc:
      obj.send :include, InstanceMethods
    end
  end

  extend DSL

  TYPES = DSL::TYPES # :nodoc:
end

require "minitest/expectations"

class Object # :nodoc:
  include Minitest::Expectations unless ENV["MT_NO_EXPECTATIONS"]
end
