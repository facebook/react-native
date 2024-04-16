require 'concurrent/atomic/atomic_reference'

module Concurrent

  # A fixed size array with volatile (synchronized, thread safe) getters/setters.
  # Mixes in Ruby's `Enumerable` module for enhanced search, sort, and traversal.
  #
  # @example
  #   tuple = Concurrent::Tuple.new(16)
  #
  #   tuple.set(0, :foo)                   #=> :foo  | volatile write
  #   tuple.get(0)                         #=> :foo  | volatile read
  #   tuple.compare_and_set(0, :foo, :bar) #=> true  | strong CAS
  #   tuple.cas(0, :foo, :baz)             #=> false | strong CAS
  #   tuple.get(0)                         #=> :bar  | volatile read
  #
  # @see https://en.wikipedia.org/wiki/Tuple Tuple entry at Wikipedia
  # @see http://www.erlang.org/doc/reference_manual/data_types.html#id70396 Erlang Tuple
  # @see http://ruby-doc.org/core-2.2.2/Enumerable.html Enumerable
  class Tuple
    include Enumerable

    # The (fixed) size of the tuple.
    attr_reader :size

    # Create a new tuple of the given size.
    #
    # @param [Integer] size the number of elements in the tuple
    def initialize(size)
      @size = size
      @tuple = tuple = ::Array.new(size)
      i = 0
      while i < size
        tuple[i] = Concurrent::AtomicReference.new
        i += 1
      end
    end

    # Get the value of the element at the given index.
    #
    # @param [Integer] i the index from which to retrieve the value
    # @return [Object] the value at the given index or nil if the index is out of bounds
    def get(i)
      return nil if i >= @size || i < 0
      @tuple[i].get
    end
    alias_method :volatile_get, :get

    # Set the element at the given index to the given value
    #
    # @param [Integer] i the index for the element to set
    # @param [Object] value the value to set at the given index
    #
    # @return [Object] the new value of the element at the given index or nil if the index is out of bounds
    def set(i, value)
      return nil if i >= @size || i < 0
      @tuple[i].set(value)
    end
    alias_method :volatile_set, :set

    # Set the value at the given index to the new value if and only if the current
    # value matches the given old value.
    #
    # @param [Integer] i the index for the element to set
    # @param [Object] old_value the value to compare against the current value
    # @param [Object] new_value the value to set at the given index
    #
    # @return [Boolean] true if the value at the given element was set else false
    def compare_and_set(i, old_value, new_value)
      return false if i >= @size || i < 0
      @tuple[i].compare_and_set(old_value, new_value)
    end
    alias_method :cas, :compare_and_set

    # Calls the given block once for each element in self, passing that element as a parameter.
    #
    # @yieldparam [Object] ref the `Concurrent::AtomicReference` object at the current index
    def each
      @tuple.each {|ref| yield ref.get}
    end
  end
end
