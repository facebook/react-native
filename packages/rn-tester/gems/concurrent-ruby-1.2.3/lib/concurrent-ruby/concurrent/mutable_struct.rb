require 'concurrent/synchronization/abstract_struct'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # An thread-safe variation of Ruby's standard `Struct`. Values can be set at
  # construction or safely changed at any time during the object's lifecycle.
  #
  # @see http://ruby-doc.org/core/Struct.html Ruby standard library `Struct`
  module MutableStruct
    include Synchronization::AbstractStruct

    # @!macro struct_new
    #
    #   Factory for creating new struct classes.
    #
    #   ```
    #   new([class_name] [, member_name]+>) -> StructClass click to toggle source
    #   new([class_name] [, member_name]+>) {|StructClass| block } -> StructClass
    #   new(value, ...) -> obj
    #   StructClass[value, ...] -> obj
    #   ```
    #
    #   The first two forms are used to create a new struct subclass `class_name`
    #   that can contain a value for each   member_name . This subclass can be
    #   used to create instances of the structure like any other  Class .
    #
    #   If the `class_name` is omitted an anonymous struct class will be created.
    #   Otherwise, the name of this struct will appear as a constant in the struct class,
    #   so it must be unique for all structs under this base class and must start with a
    #   capital letter. Assigning a struct class to a constant also gives the class
    #   the name of the constant.
    #
    #   If a block is given it will be evaluated in the context of `StructClass`, passing
    #   the created class as a parameter. This is the recommended way to customize a struct.
    #   Subclassing an anonymous struct creates an extra anonymous class that will never be used.
    #
    #   The last two forms create a new instance of a struct subclass. The number of value
    #   parameters must be less than or equal to the number of attributes defined for the
    #   struct. Unset parameters default to nil. Passing more parameters than number of attributes
    #   will raise an `ArgumentError`.
    #
    #   @see http://ruby-doc.org/core/Struct.html#method-c-new Ruby standard library `Struct#new`

    # @!macro struct_values
    #
    #   Returns the values for this struct as an Array.
    #
    #   @return [Array] the values for this struct
    #
    def values
      synchronize { ns_values }
    end
    alias_method :to_a, :values

    # @!macro struct_values_at
    #
    #   Returns the struct member values for each selector as an Array.
    #
    #   A selector may be either an Integer offset or a Range of offsets (as in `Array#values_at`).
    #
    #   @param [Fixnum, Range] indexes the index(es) from which to obatin the values (in order)
    def values_at(*indexes)
      synchronize { ns_values_at(indexes) }
    end

    # @!macro struct_inspect
    #
    #   Describe the contents of this struct in a string.
    #
    #   @return [String] the contents of this struct in a string
    def inspect
      synchronize { ns_inspect }
    end
    alias_method :to_s, :inspect

    # @!macro struct_merge
    #
    #   Returns a new struct containing the contents of `other` and the contents
    #   of `self`. If no block is specified, the value for entries with duplicate
    #   keys will be that of `other`. Otherwise the value for each duplicate key
    #   is determined by calling the block with the key, its value in `self` and
    #   its value in `other`.
    #
    #   @param [Hash] other the hash from which to set the new values
    #   @yield an options block for resolving duplicate keys
    #   @yieldparam [String, Symbol] member the name of the member which is duplicated
    #   @yieldparam [Object] selfvalue the value of the member in `self`
    #   @yieldparam [Object] othervalue the value of the member in `other`
    #
    #   @return [Synchronization::AbstractStruct] a new struct with the new values
    #
    #   @raise [ArgumentError] of given a member that is not defined in the struct
    def merge(other, &block)
      synchronize { ns_merge(other, &block) }
    end

    # @!macro struct_to_h
    #
    #   Returns a hash containing the names and values for the struct’s members.
    #
    #   @return [Hash] the names and values for the struct’s members
    def to_h
      synchronize { ns_to_h }
    end

    # @!macro struct_get
    #
    #   Attribute Reference
    #
    #   @param [Symbol, String, Integer] member the string or symbol name of the member
    #     for which to obtain the value or the member's index
    #
    #   @return [Object] the value of the given struct member or the member at the given index.
    #
    #   @raise [NameError] if the member does not exist
    #   @raise [IndexError] if the index is out of range.
    def [](member)
      synchronize { ns_get(member) }
    end

    # @!macro struct_equality
    #
    #   Equality
    #
    #   @return [Boolean] true if other has the same struct subclass and has
    #     equal member values (according to `Object#==`)
    def ==(other)
      synchronize { ns_equality(other) }
    end

    # @!macro struct_each
    #
    #   Yields the value of each struct member in order. If no block is given
    #   an enumerator is returned.
    #
    #   @yield the operation to be performed on each struct member
    #   @yieldparam [Object] value each struct value (in order)
    def each(&block)
      return enum_for(:each) unless block_given?
      synchronize { ns_each(&block) }
    end

    # @!macro struct_each_pair
    #
    #   Yields the name and value of each struct member in order. If no block is
    #   given an enumerator is returned.
    #
    #   @yield the operation to be performed on each struct member/value pair
    #   @yieldparam [Object] member each struct member (in order)
    #   @yieldparam [Object] value each struct value (in order)
    def each_pair(&block)
      return enum_for(:each_pair) unless block_given?
      synchronize { ns_each_pair(&block) }
    end

    # @!macro struct_select
    #
    #   Yields each member value from the struct to the block and returns an Array
    #   containing the member values from the struct for which the given block
    #   returns a true value (equivalent to `Enumerable#select`).
    #
    #   @yield the operation to be performed on each struct member
    #   @yieldparam [Object] value each struct value (in order)
    #
    #   @return [Array] an array containing each value for which the block returns true
    def select(&block)
      return enum_for(:select) unless block_given?
      synchronize { ns_select(&block) }
    end

    # @!macro struct_set
    #
    #   Attribute Assignment
    #
    #   Sets the value of the given struct member or the member at the given index.
    #
    #   @param [Symbol, String, Integer] member the string or symbol name of the member
    #     for which to obtain the value or the member's index
    #
    #   @return [Object] the value of the given struct member or the member at the given index.
    #
    #   @raise [NameError] if the name does not exist
    #   @raise [IndexError] if the index is out of range.
    def []=(member, value)
      if member.is_a? Integer
        length = synchronize { @values.length }
        if member >= length
          raise IndexError.new("offset #{member} too large for struct(size:#{length})")
        end
        synchronize { @values[member] = value }
      else
        send("#{member}=", value)
      end
    rescue NoMethodError
      raise NameError.new("no member '#{member}' in struct")
    end

    private

    # @!visibility private
    def initialize_copy(original)
      synchronize do
        super(original)
        ns_initialize_copy
      end
    end

    # @!macro struct_new
    def self.new(*args, &block)
      clazz_name = nil
      if args.length == 0
        raise ArgumentError.new('wrong number of arguments (0 for 1+)')
      elsif args.length > 0 && args.first.is_a?(String)
        clazz_name = args.shift
      end
      FACTORY.define_struct(clazz_name, args, &block)
    end

    FACTORY = Class.new(Synchronization::LockableObject) do
      def define_struct(name, members, &block)
        synchronize do
          clazz = Synchronization::AbstractStruct.define_struct_class(MutableStruct, Synchronization::LockableObject, name, members, &block)
          members.each_with_index do |member, index|
            clazz.send :remove_method, member
            clazz.send(:define_method, member) do
              synchronize { @values[index] }
            end
            clazz.send(:define_method, "#{member}=") do |value|
              synchronize { @values[index] = value }
            end
          end
          clazz
        end
      end
    end.new
    private_constant :FACTORY
  end
end
