require 'concurrent/synchronization/object'

module Concurrent

  # A `Maybe` encapsulates an optional value. A `Maybe` either contains a value
  # of (represented as `Just`), or it is empty (represented as `Nothing`). Using
  # `Maybe` is a good way to deal with errors or exceptional cases without
  # resorting to drastic measures such as exceptions.
  #
  # `Maybe` is a replacement for the use of `nil` with better type checking.
  #
  # For compatibility with {Concurrent::Concern::Obligation} the predicate and
  # accessor methods are aliased as `fulfilled?`, `rejected?`, `value`, and
  # `reason`.
  #
  # ## Motivation
  #
  # A common pattern in languages with pattern matching, such as Erlang and
  # Haskell, is to return *either* a value *or* an error from a function
  # Consider this Erlang code:
  #
  # ```erlang
  # case file:consult("data.dat") of
  #   {ok, Terms} -> do_something_useful(Terms);
  #   {error, Reason} -> lager:error(Reason)
  # end.
  # ```
  #
  # In this example the standard library function `file:consult` returns a
  # [tuple](http://erlang.org/doc/reference_manual/data_types.html#id69044)
  # with two elements: an [atom](http://erlang.org/doc/reference_manual/data_types.html#id64134)
  # (similar to a ruby symbol) and a variable containing ancillary data. On
  # success it returns the atom `ok` and the data from the file. On failure it
  # returns `error` and a string with an explanation of the problem. With this
  # pattern there is no ambiguity regarding success or failure. If the file is
  # empty the return value cannot be misinterpreted as an error. And when an
  # error occurs the return value provides useful information.
  #
  # In Ruby we tend to return `nil` when an error occurs or else we raise an
  # exception. Both of these idioms are problematic. Returning `nil` is
  # ambiguous because `nil` may also be a valid value. It also lacks
  # information pertaining to the nature of the error. Raising an exception
  # is both expensive and usurps the normal flow of control. All of these
  # problems can be solved with the use of a `Maybe`.
  #
  # A `Maybe` is unambiguous with regard to whether or not it contains a value.
  # When `Just` it contains a value, when `Nothing` it does not. When `Just`
  # the value it contains may be `nil`, which is perfectly valid. When
  # `Nothing` the reason for the lack of a value is contained as well. The
  # previous Erlang example can be duplicated in Ruby in a principled way by
  # having functions return `Maybe` objects:
  #
  # ```ruby
  # result = MyFileUtils.consult("data.dat") # returns a Maybe
  # if result.just?
  #   do_something_useful(result.value)      # or result.just
  # else
  #   logger.error(result.reason)            # or result.nothing
  # end
  # ```
  #
  # @example Returning a Maybe from a Function
  #   module MyFileUtils
  #     def self.consult(path)
  #       file = File.open(path, 'r')
  #       Concurrent::Maybe.just(file.read)
  #     rescue => ex
  #       return Concurrent::Maybe.nothing(ex)
  #     ensure
  #       file.close if file
  #     end
  #   end
  #
  #   maybe = MyFileUtils.consult('bogus.file')
  #   maybe.just?    #=> false
  #   maybe.nothing? #=> true
  #   maybe.reason   #=> #<Errno::ENOENT: No such file or directory @ rb_sysopen - bogus.file>
  #
  #   maybe = MyFileUtils.consult('README.md')
  #   maybe.just?    #=> true
  #   maybe.nothing? #=> false
  #   maybe.value    #=> "# Concurrent Ruby\n[![Gem Version..."
  #
  # @example Using Maybe with a Block
  #   result = Concurrent::Maybe.from do
  #     Client.find(10) # Client is an ActiveRecord model
  #   end
  #
  #   # -- if the record was found
  #   result.just? #=> true
  #   result.value #=> #<Client id: 10, first_name: "Ryan">
  #
  #   # -- if the record was not found
  #   result.just?  #=> false
  #   result.reason #=> ActiveRecord::RecordNotFound
  #
  # @example Using Maybe with the Null Object Pattern
  #   # In a Rails controller...
  #   result = ClientService.new(10).find    # returns a Maybe
  #   render json: result.or(NullClient.new)
  #
  # @see https://hackage.haskell.org/package/base-4.2.0.1/docs/Data-Maybe.html Haskell Data.Maybe
  # @see https://github.com/purescript/purescript-maybe/blob/master/docs/Data.Maybe.md PureScript Data.Maybe
  class Maybe < Synchronization::Object
    include Comparable
    safe_initialization!

    # Indicates that the given attribute has not been set.
    # When `Just` the {#nothing} getter will return `NONE`.
    # When `Nothing` the {#just} getter will return `NONE`.
    NONE = ::Object.new.freeze

    # The value of a `Maybe` when `Just`. Will be `NONE` when `Nothing`.
    attr_reader :just

    # The reason for the `Maybe` when `Nothing`. Will be `NONE` when `Just`.
    attr_reader :nothing

    private_class_method :new

    # Create a new `Maybe` using the given block.
    #
    # Runs the given block passing all function arguments to the block as block
    # arguments. If the block runs to completion without raising an exception
    # a new `Just` is created with the value set to the return value of the
    # block. If the block raises an exception a new `Nothing` is created with
    # the reason being set to the raised exception.
    #
    # @param [Array<Object>] args Zero or more arguments to pass to the block.
    # @yield The block from which to create a new `Maybe`.
    # @yieldparam [Array<Object>] args Zero or more block arguments passed as
    #   arguments to the function.
    #
    # @return [Maybe] The newly created object.
    #
    # @raise [ArgumentError] when no block given.
    def self.from(*args)
      raise ArgumentError.new('no block given') unless block_given?
      begin
        value = yield(*args)
        return new(value, NONE)
      rescue => ex
        return new(NONE, ex)
      end
    end

    # Create a new `Just` with the given value.
    #
    # @param [Object] value The value to set for the new `Maybe` object.
    #
    # @return [Maybe] The newly created object.
    def self.just(value)
      return new(value, NONE)
    end

    # Create a new `Nothing` with the given (optional) reason.
    #
    # @param [Exception] error The reason to set for the new `Maybe` object.
    #   When given a string a new `StandardError` will be created with the
    #   argument as the message. When no argument is given a new
    #   `StandardError` with an empty message will be created.
    #
    # @return [Maybe] The newly created object.
    def self.nothing(error = '')
      if error.is_a?(Exception)
        nothing = error
      else
        nothing = StandardError.new(error.to_s)
      end
      return new(NONE, nothing)
    end

    # Is this `Maybe` a `Just` (successfully fulfilled with a value)?
    #
    # @return [Boolean] True if `Just` or false if `Nothing`.
    def just?
      ! nothing?
    end
    alias :fulfilled? :just?

    # Is this `Maybe` a `nothing` (rejected with an exception upon fulfillment)?
    #
    # @return [Boolean] True if `Nothing` or false if `Just`.
    def nothing?
      @nothing != NONE
    end
    alias :rejected? :nothing?

    alias :value :just

    alias :reason :nothing

    # Comparison operator.
    #
    # @return [Integer] 0 if self and other are both `Nothing`;
    #   -1 if self is `Nothing` and other is `Just`;
    #   1 if self is `Just` and other is nothing;
    #   `self.just <=> other.just` if both self and other are `Just`.
    def <=>(other)
      if nothing?
        other.nothing? ? 0 : -1
      else
        other.nothing? ? 1 : just <=> other.just
      end
    end

    # Return either the value of self or the given default value.
    #
    # @return [Object] The value of self when `Just`; else the given default.
    def or(other)
      just? ? just : other
    end

    private

    # Create a new `Maybe` with the given attributes.
    #
    # @param [Object] just The value when `Just` else `NONE`.
    # @param [Exception, Object] nothing The exception when `Nothing` else `NONE`.
    #
    # @return [Maybe] The new `Maybe`.
    #
    # @!visibility private
    def initialize(just, nothing)
      @just = just
      @nothing = nothing
    end
  end
end
