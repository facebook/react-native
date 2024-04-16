# frozen_string_literal: true

require "active_support/concern"
require "active_support/descendants_tracker"
require "active_support/core_ext/array/extract_options"
require "active_support/core_ext/class/attribute"
require "active_support/core_ext/string/filters"
require "active_support/core_ext/object/blank"
require "thread"

module ActiveSupport
  # Callbacks are code hooks that are run at key points in an object's life cycle.
  # The typical use case is to have a base class define a set of callbacks
  # relevant to the other functionality it supplies, so that subclasses can
  # install callbacks that enhance or modify the base functionality without
  # needing to override or redefine methods of the base class.
  #
  # Mixing in this module allows you to define the events in the object's
  # life cycle that will support callbacks (via ClassMethods#define_callbacks),
  # set the instance methods, procs, or callback objects to be called (via
  # ClassMethods#set_callback), and run the installed callbacks at the
  # appropriate times (via +run_callbacks+).
  #
  # By default callbacks are halted by throwing +:abort+.
  # See ClassMethods#define_callbacks for details.
  #
  # Three kinds of callbacks are supported: before callbacks, run before a
  # certain event; after callbacks, run after the event; and around callbacks,
  # blocks that surround the event, triggering it when they yield. Callback code
  # can be contained in instance methods, procs or lambdas, or callback objects
  # that respond to certain predetermined methods. See ClassMethods#set_callback
  # for details.
  #
  #   class Record
  #     include ActiveSupport::Callbacks
  #     define_callbacks :save
  #
  #     def save
  #       run_callbacks :save do
  #         puts "- save"
  #       end
  #     end
  #   end
  #
  #   class PersonRecord < Record
  #     set_callback :save, :before, :saving_message
  #     def saving_message
  #       puts "saving..."
  #     end
  #
  #     set_callback :save, :after do |object|
  #       puts "saved"
  #     end
  #   end
  #
  #   person = PersonRecord.new
  #   person.save
  #
  # Output:
  #   saving...
  #   - save
  #   saved
  module Callbacks
    extend Concern

    included do
      extend ActiveSupport::DescendantsTracker
      class_attribute :__callbacks, instance_writer: false, default: {}
    end

    CALLBACK_FILTER_TYPES = [:before, :after, :around]

    # Runs the callbacks for the given event.
    #
    # Calls the before and around callbacks in the order they were set, yields
    # the block (if given one), and then runs the after callbacks in reverse
    # order.
    #
    # If the callback chain was halted, returns +false+. Otherwise returns the
    # result of the block, +nil+ if no callbacks have been set, or +true+
    # if callbacks have been set but no block is given.
    #
    #   run_callbacks :save do
    #     save
    #   end
    #
    #--
    #
    # As this method is used in many places, and often wraps large portions of
    # user code, it has an additional design goal of minimizing its impact on
    # the visible call stack. An exception from inside a :before or :after
    # callback can be as noisy as it likes -- but when control has passed
    # smoothly through and into the supplied block, we want as little evidence
    # as possible that we were here.
    def run_callbacks(kind)
      callbacks = __callbacks[kind.to_sym]

      if callbacks.empty?
        yield if block_given?
      else
        env = Filters::Environment.new(self, false, nil)
        next_sequence = callbacks.compile

        # Common case: no 'around' callbacks defined
        if next_sequence.final?
          next_sequence.invoke_before(env)
          env.value = !env.halted && (!block_given? || yield)
          next_sequence.invoke_after(env)
          env.value
        else
          invoke_sequence = Proc.new do
            skipped = nil

            while true
              current = next_sequence
              current.invoke_before(env)
              if current.final?
                env.value = !env.halted && (!block_given? || yield)
              elsif current.skip?(env)
                (skipped ||= []) << current
                next_sequence = next_sequence.nested
                next
              else
                next_sequence = next_sequence.nested
                begin
                  target, block, method, *arguments = current.expand_call_template(env, invoke_sequence)
                  target.send(method, *arguments, &block)
                ensure
                  next_sequence = current
                end
              end
              current.invoke_after(env)
              skipped.pop.invoke_after(env) while skipped&.first
              break env.value
            end
          end

          invoke_sequence.call
        end
      end
    end

    private
      # A hook invoked every time a before callback is halted.
      # This can be overridden in ActiveSupport::Callbacks implementors in order
      # to provide better debugging/logging.
      def halted_callback_hook(filter, name)
      end

      module Conditionals # :nodoc:
        class Value
          def initialize(&block)
            @block = block
          end
          def call(target, value); @block.call(value); end
        end
      end

      module Filters
        Environment = Struct.new(:target, :halted, :value)

        class Before
          def self.build(callback_sequence, user_callback, user_conditions, chain_config, filter, name)
            halted_lambda = chain_config[:terminator]

            if user_conditions.any?
              halting_and_conditional(callback_sequence, user_callback, user_conditions, halted_lambda, filter, name)
            else
              halting(callback_sequence, user_callback, halted_lambda, filter, name)
            end
          end

          def self.halting_and_conditional(callback_sequence, user_callback, user_conditions, halted_lambda, filter, name)
            callback_sequence.before do |env|
              target = env.target
              value  = env.value
              halted = env.halted

              if !halted && user_conditions.all? { |c| c.call(target, value) }
                result_lambda = -> { user_callback.call target, value }
                env.halted = halted_lambda.call(target, result_lambda)
                if env.halted
                  target.send :halted_callback_hook, filter, name
                end
              end

              env
            end
          end
          private_class_method :halting_and_conditional

          def self.halting(callback_sequence, user_callback, halted_lambda, filter, name)
            callback_sequence.before do |env|
              target = env.target
              value  = env.value
              halted = env.halted

              unless halted
                result_lambda = -> { user_callback.call target, value }
                env.halted = halted_lambda.call(target, result_lambda)
                if env.halted
                  target.send :halted_callback_hook, filter, name
                end
              end

              env
            end
          end
          private_class_method :halting
        end

        class After
          def self.build(callback_sequence, user_callback, user_conditions, chain_config)
            if chain_config[:skip_after_callbacks_if_terminated]
              if user_conditions.any?
                halting_and_conditional(callback_sequence, user_callback, user_conditions)
              else
                halting(callback_sequence, user_callback)
              end
            else
              if user_conditions.any?
                conditional callback_sequence, user_callback, user_conditions
              else
                simple callback_sequence, user_callback
              end
            end
          end

          def self.halting_and_conditional(callback_sequence, user_callback, user_conditions)
            callback_sequence.after do |env|
              target = env.target
              value  = env.value
              halted = env.halted

              if !halted && user_conditions.all? { |c| c.call(target, value) }
                user_callback.call target, value
              end

              env
            end
          end
          private_class_method :halting_and_conditional

          def self.halting(callback_sequence, user_callback)
            callback_sequence.after do |env|
              unless env.halted
                user_callback.call env.target, env.value
              end

              env
            end
          end
          private_class_method :halting

          def self.conditional(callback_sequence, user_callback, user_conditions)
            callback_sequence.after do |env|
              target = env.target
              value  = env.value

              if user_conditions.all? { |c| c.call(target, value) }
                user_callback.call target, value
              end

              env
            end
          end
          private_class_method :conditional

          def self.simple(callback_sequence, user_callback)
            callback_sequence.after do |env|
              user_callback.call env.target, env.value

              env
            end
          end
          private_class_method :simple
        end
      end

      class Callback # :nodoc:#
        def self.build(chain, filter, kind, options)
          if filter.is_a?(String)
            raise ArgumentError, <<-MSG.squish
              Passing string to define a callback is not supported. See the `.set_callback`
              documentation to see supported values.
            MSG
          end

          new chain.name, filter, kind, options, chain.config
        end

        attr_accessor :kind, :name
        attr_reader :chain_config, :filter

        def initialize(name, filter, kind, options, chain_config)
          @chain_config = chain_config
          @name    = name
          @kind    = kind
          @filter  = filter
          @if      = check_conditionals(options[:if])
          @unless  = check_conditionals(options[:unless])
        end

        def merge_conditional_options(chain, if_option:, unless_option:)
          options = {
            if: @if.dup,
            unless: @unless.dup
          }

          options[:if].concat     Array(unless_option)
          options[:unless].concat Array(if_option)

          self.class.build chain, @filter, @kind, options
        end

        def matches?(_kind, _filter)
          @kind == _kind && filter == _filter
        end

        def duplicates?(other)
          case @filter
          when Symbol
            matches?(other.kind, other.filter)
          else
            false
          end
        end

        # Wraps code with filter
        def apply(callback_sequence)
          user_conditions = conditions_lambdas
          user_callback = CallTemplate.build(@filter, self)

          case kind
          when :before
            Filters::Before.build(callback_sequence, user_callback.make_lambda, user_conditions, chain_config, @filter, name)
          when :after
            Filters::After.build(callback_sequence, user_callback.make_lambda, user_conditions, chain_config)
          when :around
            callback_sequence.around(user_callback, user_conditions)
          end
        end

        def current_scopes
          Array(chain_config[:scope]).map { |s| public_send(s) }
        end

        private
          EMPTY_ARRAY = [].freeze
          private_constant :EMPTY_ARRAY

          def check_conditionals(conditionals)
            return EMPTY_ARRAY if conditionals.blank?

            conditionals = Array(conditionals)
            if conditionals.any?(String)
              raise ArgumentError, <<-MSG.squish
                Passing string to be evaluated in :if and :unless conditional
                options is not supported. Pass a symbol for an instance method,
                or a lambda, proc or block, instead.
              MSG
            end

            conditionals.freeze
          end

          def conditions_lambdas
            @if.map { |c| CallTemplate.build(c, self).make_lambda } +
              @unless.map { |c| CallTemplate.build(c, self).inverted_lambda }
          end
      end

      # A future invocation of user-supplied code (either as a callback,
      # or a condition filter).
      module CallTemplate # :nodoc:
        class MethodCall
          def initialize(method)
            @method_name = method
          end

          # Return the parts needed to make this call, with the given
          # input values.
          #
          # Returns an array of the form:
          #
          #   [target, block, method, *arguments]
          #
          # This array can be used as such:
          #
          #   target.send(method, *arguments, &block)
          #
          # The actual invocation is left up to the caller to minimize
          # call stack pollution.
          def expand(target, value, block)
            [target, block, @method_name]
          end

          def make_lambda
            lambda do |target, value, &block|
              target.send(@method_name, &block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              !target.send(@method_name, &block)
            end
          end
        end

        class ObjectCall
          def initialize(target, method)
            @override_target = target
            @method_name = method
          end

          def expand(target, value, block)
            [@override_target || target, block, @method_name, target]
          end

          def make_lambda
            lambda do |target, value, &block|
              (@override_target || target).send(@method_name, target, &block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              !(@override_target || target).send(@method_name, target, &block)
            end
          end
        end

        class InstanceExec0
          def initialize(block)
            @override_block = block
          end

          def expand(target, value, block)
            [target, @override_block, :instance_exec]
          end

          def make_lambda
            lambda do |target, value, &block|
              target.instance_exec(&@override_block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              !target.instance_exec(&@override_block)
            end
          end
        end

        class InstanceExec1
          def initialize(block)
            @override_block = block
          end

          def expand(target, value, block)
            [target, @override_block, :instance_exec, target]
          end

          def make_lambda
            lambda do |target, value, &block|
              target.instance_exec(target, &@override_block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              !target.instance_exec(target, &@override_block)
            end
          end
        end

        class InstanceExec2
          def initialize(block)
            @override_block = block
          end

          def expand(target, value, block)
            raise ArgumentError unless block
            [target, @override_block || block, :instance_exec, target, block]
          end

          def make_lambda
            lambda do |target, value, &block|
              raise ArgumentError unless block
              target.instance_exec(target, block, &@override_block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              raise ArgumentError unless block
              !target.instance_exec(target, block, &@override_block)
            end
          end
        end

        class ProcCall
          def initialize(target)
            @override_target = target
          end

          def expand(target, value, block)
            [@override_target || target, block, :call, target, value]
          end

          def make_lambda
            lambda do |target, value, &block|
              (@override_target || target).call(target, value, &block)
            end
          end

          def inverted_lambda
            lambda do |target, value, &block|
              !(@override_target || target).call(target, value, &block)
            end
          end
        end

        # Filters support:
        #
        #   Symbols:: A method to call.
        #   Procs::   A proc to call with the object.
        #   Objects:: An object with a <tt>before_foo</tt> method on it to call.
        #
        # All of these objects are converted into a CallTemplate and handled
        # the same after this point.
        def self.build(filter, callback)
          case filter
          when Symbol
            MethodCall.new(filter)
          when Conditionals::Value
            ProcCall.new(filter)
          when ::Proc
            if filter.arity > 1
              InstanceExec2.new(filter)
            elsif filter.arity > 0
              InstanceExec1.new(filter)
            else
              InstanceExec0.new(filter)
            end
          else
            ObjectCall.new(filter, callback.current_scopes.join("_").to_sym)
          end
        end
      end

      # Execute before and after filters in a sequence instead of
      # chaining them with nested lambda calls, see:
      # https://github.com/rails/rails/issues/18011
      class CallbackSequence # :nodoc:
        def initialize(nested = nil, call_template = nil, user_conditions = nil)
          @nested = nested
          @call_template = call_template
          @user_conditions = user_conditions

          @before = []
          @after = []
        end

        def before(&before)
          @before.unshift(before)
          self
        end

        def after(&after)
          @after.push(after)
          self
        end

        def around(call_template, user_conditions)
          CallbackSequence.new(self, call_template, user_conditions)
        end

        def skip?(arg)
          arg.halted || !@user_conditions.all? { |c| c.call(arg.target, arg.value) }
        end

        attr_reader :nested

        def final?
          !@call_template
        end

        def expand_call_template(arg, block)
          @call_template.expand(arg.target, arg.value, block)
        end

        def invoke_before(arg)
          @before.each { |b| b.call(arg) }
        end

        def invoke_after(arg)
          @after.each { |a| a.call(arg) }
        end
      end

      class CallbackChain # :nodoc:
        include Enumerable

        attr_reader :name, :config

        def initialize(name, config)
          @name = name
          @config = {
            scope: [:kind],
            terminator: default_terminator
          }.merge!(config)
          @chain = []
          @callbacks = nil
          @mutex = Mutex.new
        end

        def each(&block); @chain.each(&block); end
        def index(o);     @chain.index(o); end
        def empty?;       @chain.empty?; end

        def insert(index, o)
          @callbacks = nil
          @chain.insert(index, o)
        end

        def delete(o)
          @callbacks = nil
          @chain.delete(o)
        end

        def clear
          @callbacks = nil
          @chain.clear
          self
        end

        def initialize_copy(other)
          @callbacks = nil
          @chain     = other.chain.dup
          @mutex     = Mutex.new
        end

        def compile
          @callbacks || @mutex.synchronize do
            final_sequence = CallbackSequence.new
            @callbacks ||= @chain.reverse.inject(final_sequence) do |callback_sequence, callback|
              callback.apply callback_sequence
            end
          end
        end

        def append(*callbacks)
          callbacks.each { |c| append_one(c) }
        end

        def prepend(*callbacks)
          callbacks.each { |c| prepend_one(c) }
        end

        protected
          attr_reader :chain

        private
          def append_one(callback)
            @callbacks = nil
            remove_duplicates(callback)
            @chain.push(callback)
          end

          def prepend_one(callback)
            @callbacks = nil
            remove_duplicates(callback)
            @chain.unshift(callback)
          end

          def remove_duplicates(callback)
            @callbacks = nil
            @chain.delete_if { |c| callback.duplicates?(c) }
          end

          def default_terminator
            Proc.new do |target, result_lambda|
              terminate = true
              catch(:abort) do
                result_lambda.call
                terminate = false
              end
              terminate
            end
          end
      end

      module ClassMethods
        def normalize_callback_params(filters, block) # :nodoc:
          type = CALLBACK_FILTER_TYPES.include?(filters.first) ? filters.shift : :before
          options = filters.extract_options!
          filters.unshift(block) if block
          [type, filters, options.dup]
        end

        # This is used internally to append, prepend and skip callbacks to the
        # CallbackChain.
        def __update_callbacks(name) # :nodoc:
          ([self] + self.descendants).reverse_each do |target|
            chain = target.get_callbacks name
            yield target, chain.dup
          end
        end

        # Install a callback for the given event.
        #
        #   set_callback :save, :before, :before_method
        #   set_callback :save, :after,  :after_method, if: :condition
        #   set_callback :save, :around, ->(r, block) { stuff; result = block.call; stuff }
        #
        # The second argument indicates whether the callback is to be run +:before+,
        # +:after+, or +:around+ the event. If omitted, +:before+ is assumed. This
        # means the first example above can also be written as:
        #
        #   set_callback :save, :before_method
        #
        # The callback can be specified as a symbol naming an instance method; as a
        # proc, lambda, or block; or as an object that responds to a certain method
        # determined by the <tt>:scope</tt> argument to +define_callbacks+.
        #
        # If a proc, lambda, or block is given, its body is evaluated in the context
        # of the current object. It can also optionally accept the current object as
        # an argument.
        #
        # Before and around callbacks are called in the order that they are set;
        # after callbacks are called in the reverse order.
        #
        # Around callbacks can access the return value from the event, if it
        # wasn't halted, from the +yield+ call.
        #
        # ===== Options
        #
        # * <tt>:if</tt> - A symbol or an array of symbols, each naming an instance
        #   method or a proc; the callback will be called only when they all return
        #   a true value.
        #
        #   If a proc is given, its body is evaluated in the context of the
        #   current object. It can also optionally accept the current object as
        #   an argument.
        # * <tt>:unless</tt> - A symbol or an array of symbols, each naming an
        #   instance method or a proc; the callback will be called only when they
        #   all return a false value.
        #
        #   If a proc is given, its body is evaluated in the context of the
        #   current object. It can also optionally accept the current object as
        #   an argument.
        # * <tt>:prepend</tt> - If +true+, the callback will be prepended to the
        #   existing chain rather than appended.
        def set_callback(name, *filter_list, &block)
          type, filters, options = normalize_callback_params(filter_list, block)

          self_chain = get_callbacks name
          mapped = filters.map do |filter|
            Callback.build(self_chain, filter, type, options)
          end

          __update_callbacks(name) do |target, chain|
            options[:prepend] ? chain.prepend(*mapped) : chain.append(*mapped)
            target.set_callbacks name, chain
          end
        end

        # Skip a previously set callback. Like +set_callback+, <tt>:if</tt> or
        # <tt>:unless</tt> options may be passed in order to control when the
        # callback is skipped.
        #
        #   class Writer < PersonRecord
        #     attr_accessor :age
        #     skip_callback :save, :before, :saving_message, if: -> { age > 18 }
        #   end
        #
        # When if option returns true, callback is skipped.
        #
        #   writer = Writer.new
        #   writer.age = 20
        #   writer.save
        #
        # Output:
        #   - save
        #   saved
        #
        # When if option returns false, callback is NOT skipped.
        #
        #   young_writer = Writer.new
        #   young_writer.age = 17
        #   young_writer.save
        #
        # Output:
        #   saving...
        #   - save
        #   saved
        #
        # An <tt>ArgumentError</tt> will be raised if the callback has not
        # already been set (unless the <tt>:raise</tt> option is set to <tt>false</tt>).
        def skip_callback(name, *filter_list, &block)
          type, filters, options = normalize_callback_params(filter_list, block)

          options[:raise] = true unless options.key?(:raise)

          __update_callbacks(name) do |target, chain|
            filters.each do |filter|
              callback = chain.find { |c| c.matches?(type, filter) }

              if !callback && options[:raise]
                raise ArgumentError, "#{type.to_s.capitalize} #{name} callback #{filter.inspect} has not been defined"
              end

              if callback && (options.key?(:if) || options.key?(:unless))
                new_callback = callback.merge_conditional_options(chain, if_option: options[:if], unless_option: options[:unless])
                chain.insert(chain.index(callback), new_callback)
              end

              chain.delete(callback)
            end
            target.set_callbacks name, chain
          end
        end

        # Remove all set callbacks for the given event.
        def reset_callbacks(name)
          callbacks = get_callbacks name

          self.descendants.each do |target|
            chain = target.get_callbacks(name).dup
            callbacks.each { |c| chain.delete(c) }
            target.set_callbacks name, chain
          end

          set_callbacks(name, callbacks.dup.clear)
        end

        # Define sets of events in the object life cycle that support callbacks.
        #
        #   define_callbacks :validate
        #   define_callbacks :initialize, :save, :destroy
        #
        # ===== Options
        #
        # * <tt>:terminator</tt> - Determines when a before filter will halt the
        #   callback chain, preventing following before and around callbacks from
        #   being called and the event from being triggered.
        #   This should be a lambda to be executed.
        #   The current object and the result lambda of the callback will be provided
        #   to the terminator lambda.
        #
        #     define_callbacks :validate, terminator: ->(target, result_lambda) { result_lambda.call == false }
        #
        #   In this example, if any before validate callbacks returns +false+,
        #   any successive before and around callback is not executed.
        #
        #   The default terminator halts the chain when a callback throws +:abort+.
        #
        # * <tt>:skip_after_callbacks_if_terminated</tt> - Determines if after
        #   callbacks should be terminated by the <tt>:terminator</tt> option. By
        #   default after callbacks are executed no matter if callback chain was
        #   terminated or not. This option has no effect if <tt>:terminator</tt>
        #   option is set to +nil+.
        #
        # * <tt>:scope</tt> - Indicates which methods should be executed when an
        #   object is used as a callback.
        #
        #     class Audit
        #       def before(caller)
        #         puts 'Audit: before is called'
        #       end
        #
        #       def before_save(caller)
        #         puts 'Audit: before_save is called'
        #       end
        #     end
        #
        #     class Account
        #       include ActiveSupport::Callbacks
        #
        #       define_callbacks :save
        #       set_callback :save, :before, Audit.new
        #
        #       def save
        #         run_callbacks :save do
        #           puts 'save in main'
        #         end
        #       end
        #     end
        #
        #   In the above case whenever you save an account the method
        #   <tt>Audit#before</tt> will be called. On the other hand
        #
        #     define_callbacks :save, scope: [:kind, :name]
        #
        #   would trigger <tt>Audit#before_save</tt> instead. That's constructed
        #   by calling <tt>#{kind}_#{name}</tt> on the given instance. In this
        #   case "kind" is "before" and "name" is "save". In this context +:kind+
        #   and +:name+ have special meanings: +:kind+ refers to the kind of
        #   callback (before/after/around) and +:name+ refers to the method on
        #   which callbacks are being defined.
        #
        #   A declaration like
        #
        #     define_callbacks :save, scope: [:name]
        #
        #   would call <tt>Audit#save</tt>.
        #
        # ===== Notes
        #
        # +names+ passed to +define_callbacks+ must not end with
        # <tt>!</tt>, <tt>?</tt> or <tt>=</tt>.
        #
        # Calling +define_callbacks+ multiple times with the same +names+ will
        # overwrite previous callbacks registered with +set_callback+.
        def define_callbacks(*names)
          options = names.extract_options!

          names.each do |name|
            name = name.to_sym

            ([self] + self.descendants).each do |target|
              target.set_callbacks name, CallbackChain.new(name, options)
            end

            module_eval <<-RUBY, __FILE__, __LINE__ + 1
              def _run_#{name}_callbacks(&block)
                run_callbacks #{name.inspect}, &block
              end

              def self._#{name}_callbacks
                get_callbacks(#{name.inspect})
              end

              def self._#{name}_callbacks=(value)
                set_callbacks(#{name.inspect}, value)
              end

              def _#{name}_callbacks
                __callbacks[#{name.inspect}]
              end
            RUBY
          end
        end

        protected
          def get_callbacks(name) # :nodoc:
            __callbacks[name.to_sym]
          end

          def set_callbacks(name, callbacks) # :nodoc:
            unless singleton_class.method_defined?(:__callbacks, false)
              self.__callbacks = __callbacks.dup
            end
            self.__callbacks[name.to_sym] = callbacks
            self.__callbacks
          end
      end
  end
end
