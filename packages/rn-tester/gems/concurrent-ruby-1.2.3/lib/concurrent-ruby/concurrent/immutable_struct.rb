require 'concurrent/synchronization/abstract_struct'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # A thread-safe, immutable variation of Ruby's standard `Struct`.
  #
  # @see http://ruby-doc.org/core/Struct.html Ruby standard library `Struct`
  module ImmutableStruct
    include Synchronization::AbstractStruct

    def self.included(base)
      base.safe_initialization!
    end

    # @!macro struct_values
    def values
      ns_values
    end

    alias_method :to_a, :values

    # @!macro struct_values_at
    def values_at(*indexes)
      ns_values_at(indexes)
    end

    # @!macro struct_inspect
    def inspect
      ns_inspect
    end

    alias_method :to_s, :inspect

    # @!macro struct_merge
    def merge(other, &block)
      ns_merge(other, &block)
    end

    # @!macro struct_to_h
    def to_h
      ns_to_h
    end

    # @!macro struct_get
    def [](member)
      ns_get(member)
    end

    # @!macro struct_equality
    def ==(other)
      ns_equality(other)
    end

    # @!macro struct_each
    def each(&block)
      return enum_for(:each) unless block_given?
      ns_each(&block)
    end

    # @!macro struct_each_pair
    def each_pair(&block)
      return enum_for(:each_pair) unless block_given?
      ns_each_pair(&block)
    end

    # @!macro struct_select
    def select(&block)
      return enum_for(:select) unless block_given?
      ns_select(&block)
    end

    private

    # @!visibility private
    def initialize_copy(original)
      super(original)
      ns_initialize_copy
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
          Synchronization::AbstractStruct.define_struct_class(ImmutableStruct, Synchronization::Object, name, members, &block)
        end
      end
    end.new
    private_constant :FACTORY
  end
end
