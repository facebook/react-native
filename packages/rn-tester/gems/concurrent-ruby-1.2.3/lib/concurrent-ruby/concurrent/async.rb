require 'concurrent/configuration'
require 'concurrent/ivar'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # A mixin module that provides simple asynchronous behavior to a class,
  # turning it into a simple actor. Loosely based on Erlang's
  # [gen_server](http://www.erlang.org/doc/man/gen_server.html), but without
  # supervision or linking.
  #
  # A more feature-rich {Concurrent::Actor} is also available when the
  # capabilities of `Async` are too limited.
  #
  # ```cucumber
  # Feature:
  #   As a stateful, plain old Ruby class
  #   I want safe, asynchronous behavior
  #   So my long-running methods don't block the main thread
  # ```
  #
  # The `Async` module is a way to mix simple yet powerful asynchronous
  # capabilities into any plain old Ruby object or class, turning each object
  # into a simple Actor. Method calls are processed on a background thread. The
  # caller is free to perform other actions while processing occurs in the
  # background.
  #
  # Method calls to the asynchronous object are made via two proxy methods:
  # `async` (alias `cast`) and `await` (alias `call`). These proxy methods post
  # the method call to the object's background thread and return a "future"
  # which will eventually contain the result of the method call.
  #
  # This behavior is loosely patterned after Erlang's `gen_server` behavior.
  # When an Erlang module implements the `gen_server` behavior it becomes
  # inherently asynchronous. The `start` or `start_link` function spawns a
  # process (similar to a thread but much more lightweight and efficient) and
  # returns the ID of the process. Using the process ID, other processes can
  # send messages to the `gen_server` via the `cast` and `call` methods. Unlike
  # Erlang's `gen_server`, however, `Async` classes do not support linking or
  # supervision trees.
  #
  # ## Basic Usage
  #
  # When this module is mixed into a class, objects of the class become inherently
  # asynchronous. Each object gets its own background thread on which to post
  # asynchronous method calls. Asynchronous method calls are executed in the
  # background one at a time in the order they are received.
  #
  # To create an asynchronous class, simply mix in the `Concurrent::Async` module:
  #
  # ```
  # class Hello
  #   include Concurrent::Async
  #
  #   def hello(name)
  #     "Hello, #{name}!"
  #   end
  # end
  # ```
  #
  # Mixing this module into a class provides each object two proxy methods:
  # `async` and `await`. These methods are thread safe with respect to the
  # enclosing object. The former proxy allows methods to be called
  # asynchronously by posting to the object's internal thread. The latter proxy
  # allows a method to be called synchronously but does so safely with respect
  # to any pending asynchronous method calls and ensures proper ordering. Both
  # methods return a {Concurrent::IVar} which can be inspected for the result
  # of the proxied method call. Calling a method with `async` will return a
  # `:pending` `IVar` whereas `await` will return a `:complete` `IVar`.
  #
  # ```
  # class Echo
  #   include Concurrent::Async
  #
  #   def echo(msg)
  #     print "#{msg}\n"
  #   end
  # end
  #
  # horn = Echo.new
  # horn.echo('zero')      # synchronous, not thread-safe
  #                        # returns the actual return value of the method
  #
  # horn.async.echo('one') # asynchronous, non-blocking, thread-safe
  #                        # returns an IVar in the :pending state
  #
  # horn.await.echo('two') # synchronous, blocking, thread-safe
  #                        # returns an IVar in the :complete state
  # ```
  #
  # ## Let It Fail
  #
  # The `async` and `await` proxy methods have built-in error protection based
  # on Erlang's famous "let it fail" philosophy. Instance methods should not be
  # programmed defensively. When an exception is raised by a delegated method
  # the proxy will rescue the exception, expose it to the caller as the `reason`
  # attribute of the returned future, then process the next method call.
  #
  # ## Calling Methods Internally
  #
  # External method calls should *always* use the `async` and `await` proxy
  # methods. When one method calls another method, the `async` proxy should
  # rarely be used and the `await` proxy should *never* be used.
  #
  # When an object calls one of its own methods using the `await` proxy the
  # second call will be enqueued *behind* the currently running method call.
  # Any attempt to wait on the result will fail as the second call will never
  # run until after the current call completes.
  #
  # Calling a method using the `await` proxy from within a method that was
  # itself called using `async` or `await` will irreversibly deadlock the
  # object. Do *not* do this, ever.
  #
  # ## Instance Variables and Attribute Accessors
  #
  # Instance variables do not need to be thread-safe so long as they are private.
  # Asynchronous method calls are processed in the order they are received and
  # are processed one at a time. Therefore private instance variables can only
  # be accessed by one thread at a time. This is inherently thread-safe.
  #
  # When using private instance variables within asynchronous methods, the best
  # practice is to read the instance variable into a local variable at the start
  # of the method then update the instance variable at the *end* of the method.
  # This way, should an exception be raised during method execution the internal
  # state of the object will not have been changed.
  #
  # ### Reader Attributes
  #
  # The use of `attr_reader` is discouraged. Internal state exposed externally,
  # when necessary, should be done through accessor methods. The instance
  # variables exposed by these methods *must* be thread-safe, or they must be
  # called using the `async` and `await` proxy methods. These two approaches are
  # subtly different.
  #
  # When internal state is accessed via the `async` and `await` proxy methods,
  # the returned value represents the object's state *at the time the call is
  # processed*, which may *not* be the state of the object at the time the call
  # is made.
  #
  # To get the state *at the current* time, irrespective of an enqueued method
  # calls, a reader method must be called directly. This is inherently unsafe
  # unless the instance variable is itself thread-safe, preferably using one
  # of the thread-safe classes within this library. Because the thread-safe
  # classes within this library are internally-locking or non-locking, they can
  # be safely used from within asynchronous methods without causing deadlocks.
  #
  # Generally speaking, the best practice is to *not* expose internal state via
  # reader methods. The best practice is to simply use the method's return value.
  #
  # ### Writer Attributes
  #
  # Writer attributes should never be used with asynchronous classes. Changing
  # the state externally, even when done in the thread-safe way, is not logically
  # consistent. Changes to state need to be timed with respect to all asynchronous
  # method calls which my be in-process or enqueued. The only safe practice is to
  # pass all necessary data to each method as arguments and let the method update
  # the internal state as necessary.
  #
  # ## Class Constants, Variables, and Methods
  #
  # ### Class Constants
  #
  # Class constants do not need to be thread-safe. Since they are read-only and
  # immutable they may be safely read both externally and from within
  # asynchronous methods.
  #
  # ### Class Variables
  #
  # Class variables should be avoided. Class variables represent shared state.
  # Shared state is anathema to concurrency. Should there be a need to share
  # state using class variables they *must* be thread-safe, preferably
  # using the thread-safe classes within this library. When updating class
  # variables, never assign a new value/object to the variable itself. Assignment
  # is not thread-safe in Ruby. Instead, use the thread-safe update functions
  # of the variable itself to change the value.
  #
  # The best practice is to *never* use class variables with `Async` classes.
  #
  # ### Class Methods
  #
  # Class methods which are pure functions are safe. Class methods which modify
  # class variables should be avoided, for all the reasons listed above.
  #
  # ## An Important Note About Thread Safe Guarantees
  #
  # > Thread safe guarantees can only be made when asynchronous method calls
  # > are not mixed with direct method calls. Use only direct method calls
  # > when the object is used exclusively on a single thread. Use only
  # > `async` and `await` when the object is shared between threads. Once you
  # > call a method using `async` or `await`, you should no longer call methods
  # > directly on the object. Use `async` and `await` exclusively from then on.
  #
  # @example
  #
  #   class Echo
  #     include Concurrent::Async
  #
  #     def echo(msg)
  #       print "#{msg}\n"
  #     end
  #   end
  #
  #   horn = Echo.new
  #   horn.echo('zero')      # synchronous, not thread-safe
  #                          # returns the actual return value of the method
  #
  #   horn.async.echo('one') # asynchronous, non-blocking, thread-safe
  #                          # returns an IVar in the :pending state
  #
  #   horn.await.echo('two') # synchronous, blocking, thread-safe
  #                          # returns an IVar in the :complete state
  #
  # @see Concurrent::Actor
  # @see https://en.wikipedia.org/wiki/Actor_model "Actor Model" at Wikipedia
  # @see http://www.erlang.org/doc/man/gen_server.html Erlang gen_server
  # @see http://c2.com/cgi/wiki?LetItCrash "Let It Crash" at http://c2.com/
  module Async

    # @!method self.new(*args, &block)
    #
    #   Instanciate a new object and ensure proper initialization of the
    #   synchronization mechanisms.
    #
    #   @param [Array<Object>] args Zero or more arguments to be passed to the
    #     object's initializer.
    #   @param [Proc] block Optional block to pass to the object's initializer.
    #   @return [Object] A properly initialized object of the asynchronous class.

    # Check for the presence of a method on an object and determine if a given
    # set of arguments matches the required arity.
    #
    # @param [Object] obj the object to check against
    # @param [Symbol] method the method to check the object for
    # @param [Array] args zero or more arguments for the arity check
    #
    # @raise [NameError] the object does not respond to `method` method
    # @raise [ArgumentError] the given `args` do not match the arity of `method`
    #
    # @note This check is imperfect because of the way Ruby reports the arity of
    #   methods with a variable number of arguments. It is possible to determine
    #   if too few arguments are given but impossible to determine if too many
    #   arguments are given. This check may also fail to recognize dynamic behavior
    #   of the object, such as methods simulated with `method_missing`.
    #
    # @see http://www.ruby-doc.org/core-2.1.1/Method.html#method-i-arity Method#arity
    # @see http://ruby-doc.org/core-2.1.0/Object.html#method-i-respond_to-3F Object#respond_to?
    # @see http://www.ruby-doc.org/core-2.1.0/BasicObject.html#method-i-method_missing BasicObject#method_missing
    #
    # @!visibility private
    def self.validate_argc(obj, method, *args)
      argc = args.length
      arity = obj.method(method).arity

      if arity >= 0 && argc != arity
        raise ArgumentError.new("wrong number of arguments (#{argc} for #{arity})")
      elsif arity < 0 && (arity = (arity + 1).abs) > argc
        raise ArgumentError.new("wrong number of arguments (#{argc} for #{arity}..*)")
      end
    end

    # @!visibility private
    def self.included(base)
      base.singleton_class.send(:alias_method, :original_new, :new)
      base.extend(ClassMethods)
      super(base)
    end

    # @!visibility private
    module ClassMethods
      def new(*args, &block)
        obj = original_new(*args, &block)
        obj.send(:init_synchronization)
        obj
      end
      ruby2_keywords :new if respond_to?(:ruby2_keywords, true)
    end
    private_constant :ClassMethods

    # Delegates asynchronous, thread-safe method calls to the wrapped object.
    #
    # @!visibility private
    class AsyncDelegator < Synchronization::LockableObject
      safe_initialization!

      # Create a new delegator object wrapping the given delegate.
      #
      # @param [Object] delegate the object to wrap and delegate method calls to
      def initialize(delegate)
        super()
        @delegate = delegate
        @queue = []
        @executor = Concurrent.global_io_executor
        @ruby_pid = $$
      end

      # Delegates method calls to the wrapped object.
      #
      # @param [Symbol] method the method being called
      # @param [Array] args zero or more arguments to the method
      #
      # @return [IVar] the result of the method call
      #
      # @raise [NameError] the object does not respond to `method` method
      # @raise [ArgumentError] the given `args` do not match the arity of `method`
      def method_missing(method, *args, &block)
        super unless @delegate.respond_to?(method)
        Async::validate_argc(@delegate, method, *args)

        ivar = Concurrent::IVar.new
        synchronize do
          reset_if_forked
          @queue.push [ivar, method, args, block]
          @executor.post { perform } if @queue.length == 1
        end

        ivar
      end

      # Check whether the method is responsive
      #
      # @param [Symbol] method the method being called
      def respond_to_missing?(method, include_private = false)
        @delegate.respond_to?(method) || super
      end

      # Perform all enqueued tasks.
      #
      # This method must be called from within the executor. It must not be
      # called while already running. It will loop until the queue is empty.
      def perform
        loop do
          ivar, method, args, block = synchronize { @queue.first }
          break unless ivar # queue is empty

          begin
            ivar.set(@delegate.send(method, *args, &block))
          rescue => error
            ivar.fail(error)
          end

          synchronize do
            @queue.shift
            return if @queue.empty?
          end
        end
      end

      def reset_if_forked
        if $$ != @ruby_pid
          @queue.clear
          @ruby_pid = $$
        end
      end
    end
    private_constant :AsyncDelegator

    # Delegates synchronous, thread-safe method calls to the wrapped object.
    #
    # @!visibility private
    class AwaitDelegator

      # Create a new delegator object wrapping the given delegate.
      #
      # @param [AsyncDelegator] delegate the object to wrap and delegate method calls to
      def initialize(delegate)
        @delegate = delegate
      end

      # Delegates method calls to the wrapped object.
      #
      # @param [Symbol] method the method being called
      # @param [Array] args zero or more arguments to the method
      #
      # @return [IVar] the result of the method call
      #
      # @raise [NameError] the object does not respond to `method` method
      # @raise [ArgumentError] the given `args` do not match the arity of `method`
      def method_missing(method, *args, &block)
        ivar = @delegate.send(method, *args, &block)
        ivar.wait
        ivar
      end

      # Check whether the method is responsive
      #
      # @param [Symbol] method the method being called
      def respond_to_missing?(method, include_private = false)
        @delegate.respond_to?(method) || super
      end
    end
    private_constant :AwaitDelegator

    # Causes the chained method call to be performed asynchronously on the
    # object's thread. The delegated method will return a future in the
    # `:pending` state and the method call will have been scheduled on the
    # object's thread. The final disposition of the method call can be obtained
    # by inspecting the returned future.
    #
    # @!macro async_thread_safety_warning
    #   @note The method call is guaranteed to be thread safe with respect to
    #     all other method calls against the same object that are called with
    #     either `async` or `await`. The mutable nature of Ruby references
    #     (and object orientation in general) prevent any other thread safety
    #     guarantees. Do NOT mix direct method calls with delegated method calls.
    #     Use *only* delegated method calls when sharing the object between threads.
    #
    # @return [Concurrent::IVar] the pending result of the asynchronous operation
    #
    # @raise [NameError] the object does not respond to the requested method
    # @raise [ArgumentError] the given `args` do not match the arity of
    #   the requested method
    def async
      @__async_delegator__
    end
    alias_method :cast, :async

    # Causes the chained method call to be performed synchronously on the
    # current thread. The delegated will return a future in either the
    # `:fulfilled` or `:rejected` state and the delegated method will have
    # completed. The final disposition of the delegated method can be obtained
    # by inspecting the returned future.
    #
    # @!macro async_thread_safety_warning
    #
    # @return [Concurrent::IVar] the completed result of the synchronous operation
    #
    # @raise [NameError] the object does not respond to the requested method
    # @raise [ArgumentError] the given `args` do not match the arity of the
    #   requested method
    def await
      @__await_delegator__
    end
    alias_method :call, :await

    # Initialize the internal serializer and other stnchronization mechanisms.
    #
    # @note This method *must* be called immediately upon object construction.
    #   This is the only way thread-safe initialization can be guaranteed.
    #
    # @!visibility private
    def init_synchronization
      return self if defined?(@__async_initialized__) && @__async_initialized__
      @__async_initialized__ = true
      @__async_delegator__ = AsyncDelegator.new(self)
      @__await_delegator__ = AwaitDelegator.new(@__async_delegator__)
      self
    end
  end
end
