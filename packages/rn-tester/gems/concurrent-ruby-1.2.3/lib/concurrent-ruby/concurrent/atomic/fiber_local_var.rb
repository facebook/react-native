require 'concurrent/constants'
require_relative 'locals'

module Concurrent

  # A `FiberLocalVar` is a variable where the value is different for each fiber.
  # Each variable may have a default value, but when you modify the variable only
  # the current fiber will ever see that change.
  #
  # This is similar to Ruby's built-in fiber-local variables (`Thread.current[:name]`),
  # but with these major advantages:
  # * `FiberLocalVar` has its own identity, it doesn't need a Symbol.
  # * Each Ruby's built-in fiber-local variable leaks some memory forever (it's a Symbol held forever on the fiber),
  #   so it's only OK to create a small amount of them.
  #   `FiberLocalVar` has no such issue and it is fine to create many of them.
  # * Ruby's built-in fiber-local variables leak forever the value set on each fiber (unless set to nil explicitly).
  #   `FiberLocalVar` automatically removes the mapping for each fiber once the `FiberLocalVar` instance is GC'd.
  #
  # @example
  #   v = FiberLocalVar.new(14)
  #   v.value #=> 14
  #   v.value = 2
  #   v.value #=> 2
  #
  # @example
  #   v = FiberLocalVar.new(14)
  #
  #   Fiber.new do
  #     v.value #=> 14
  #     v.value = 1
  #     v.value #=> 1
  #   end.resume
  #
  #   Fiber.new do
  #     v.value #=> 14
  #     v.value = 2
  #     v.value #=> 2
  #   end.resume
  #
  #   v.value #=> 14
  class FiberLocalVar
    LOCALS = FiberLocals.new

    # Creates a fiber local variable.
    #
    # @param [Object] default the default value when otherwise unset
    # @param [Proc] default_block Optional block that gets called to obtain the
    #   default value for each fiber
    def initialize(default = nil, &default_block)
      if default && block_given?
        raise ArgumentError, "Cannot use both value and block as default value"
      end

      if block_given?
        @default_block = default_block
        @default = nil
      else
        @default_block = nil
        @default = default
      end

      @index = LOCALS.next_index(self)
    end

    # Returns the value in the current fiber's copy of this fiber-local variable.
    #
    # @return [Object] the current value
    def value
      LOCALS.fetch(@index) { default }
    end

    # Sets the current fiber's copy of this fiber-local variable to the specified value.
    #
    # @param [Object] value the value to set
    # @return [Object] the new value
    def value=(value)
      LOCALS.set(@index, value)
    end

    # Bind the given value to fiber local storage during
    # execution of the given block.
    #
    # @param [Object] value the value to bind
    # @yield the operation to be performed with the bound variable
    # @return [Object] the value
    def bind(value)
      if block_given?
        old_value = self.value
        self.value = value
        begin
          yield
        ensure
          self.value = old_value
        end
      end
    end

    protected

    # @!visibility private
    def default
      if @default_block
        self.value = @default_block.call
      else
        @default
      end
    end
  end
end
