# frozen_string_literal: true

require "active_support/core_ext/hash/keys"
require "active_support/core_ext/hash/reverse_merge"
require "active_support/core_ext/hash/except"
require "active_support/core_ext/hash/slice"

module ActiveSupport
  # Implements a hash where keys <tt>:foo</tt> and <tt>"foo"</tt> are considered
  # to be the same.
  #
  #   rgb = ActiveSupport::HashWithIndifferentAccess.new
  #
  #   rgb[:black] = '#000000'
  #   rgb[:black]  # => '#000000'
  #   rgb['black'] # => '#000000'
  #
  #   rgb['white'] = '#FFFFFF'
  #   rgb[:white]  # => '#FFFFFF'
  #   rgb['white'] # => '#FFFFFF'
  #
  # Internally symbols are mapped to strings when used as keys in the entire
  # writing interface (calling <tt>[]=</tt>, <tt>merge</tt>, etc). This
  # mapping belongs to the public interface. For example, given:
  #
  #   hash = ActiveSupport::HashWithIndifferentAccess.new(a: 1)
  #
  # You are guaranteed that the key is returned as a string:
  #
  #   hash.keys # => ["a"]
  #
  # Technically other types of keys are accepted:
  #
  #   hash = ActiveSupport::HashWithIndifferentAccess.new(a: 1)
  #   hash[0] = 0
  #   hash # => {"a"=>1, 0=>0}
  #
  # but this class is intended for use cases where strings or symbols are the
  # expected keys and it is convenient to understand both as the same. For
  # example the +params+ hash in Ruby on Rails.
  #
  # Note that core extensions define <tt>Hash#with_indifferent_access</tt>:
  #
  #   rgb = { black: '#000000', white: '#FFFFFF' }.with_indifferent_access
  #
  # which may be handy.
  #
  # To access this class outside of Rails, require the core extension with:
  #
  #   require "active_support/core_ext/hash/indifferent_access"
  #
  # which will, in turn, require this file.
  class HashWithIndifferentAccess < Hash
    # Returns +true+ so that <tt>Array#extract_options!</tt> finds members of
    # this class.
    def extractable_options?
      true
    end

    def with_indifferent_access
      dup
    end

    def nested_under_indifferent_access
      self
    end

    def initialize(constructor = nil)
      if constructor.respond_to?(:to_hash)
        super()
        update(constructor)

        hash = constructor.is_a?(Hash) ? constructor : constructor.to_hash
        self.default = hash.default if hash.default
        self.default_proc = hash.default_proc if hash.default_proc
      elsif constructor.nil?
        super()
      else
        super(constructor)
      end
    end

    def self.[](*args)
      new.merge!(Hash[*args])
    end

    alias_method :regular_writer, :[]= unless method_defined?(:regular_writer)
    alias_method :regular_update, :update unless method_defined?(:regular_update)

    # Assigns a new value to the hash:
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash[:key] = 'value'
    #
    # This value can be later fetched using either +:key+ or <tt>'key'</tt>.
    def []=(key, value)
      regular_writer(convert_key(key), convert_value(value, conversion: :assignment))
    end

    alias_method :store, :[]=

    # Updates the receiver in-place, merging in the hashes passed as arguments:
    #
    #   hash_1 = ActiveSupport::HashWithIndifferentAccess.new
    #   hash_1[:key] = 'value'
    #
    #   hash_2 = ActiveSupport::HashWithIndifferentAccess.new
    #   hash_2[:key] = 'New Value!'
    #
    #   hash_1.update(hash_2) # => {"key"=>"New Value!"}
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash.update({ "a" => 1 }, { "b" => 2 }) # => { "a" => 1, "b" => 2 }
    #
    # The arguments can be either an
    # <tt>ActiveSupport::HashWithIndifferentAccess</tt> or a regular +Hash+.
    # In either case the merge respects the semantics of indifferent access.
    #
    # If the argument is a regular hash with keys +:key+ and <tt>"key"</tt> only one
    # of the values end up in the receiver, but which one is unspecified.
    #
    # When given a block, the value for duplicated keys will be determined
    # by the result of invoking the block with the duplicated key, the value
    # in the receiver, and the value in +other_hash+. The rules for duplicated
    # keys follow the semantics of indifferent access:
    #
    #   hash_1[:key] = 10
    #   hash_2['key'] = 12
    #   hash_1.update(hash_2) { |key, old, new| old + new } # => {"key"=>22}
    def update(*other_hashes, &block)
      if other_hashes.size == 1
        update_with_single_argument(other_hashes.first, block)
      else
        other_hashes.each do |other_hash|
          update_with_single_argument(other_hash, block)
        end
      end
      self
    end

    alias_method :merge!, :update

    # Checks the hash for a key matching the argument passed in:
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash['key'] = 'value'
    #   hash.key?(:key)  # => true
    #   hash.key?('key') # => true
    def key?(key)
      super(convert_key(key))
    end

    alias_method :include?, :key?
    alias_method :has_key?, :key?
    alias_method :member?, :key?

    # Same as <tt>Hash#[]</tt> where the key passed as argument can be
    # either a string or a symbol:
    #
    #   counters = ActiveSupport::HashWithIndifferentAccess.new
    #   counters[:foo] = 1
    #
    #   counters['foo'] # => 1
    #   counters[:foo]  # => 1
    #   counters[:zoo]  # => nil
    def [](key)
      super(convert_key(key))
    end

    # Same as <tt>Hash#assoc</tt> where the key passed as argument can be
    # either a string or a symbol:
    #
    #   counters = ActiveSupport::HashWithIndifferentAccess.new
    #   counters[:foo] = 1
    #
    #   counters.assoc('foo') # => ["foo", 1]
    #   counters.assoc(:foo)  # => ["foo", 1]
    #   counters.assoc(:zoo)  # => nil
    def assoc(key)
      super(convert_key(key))
    end

    # Same as <tt>Hash#fetch</tt> where the key passed as argument can be
    # either a string or a symbol:
    #
    #   counters = ActiveSupport::HashWithIndifferentAccess.new
    #   counters[:foo] = 1
    #
    #   counters.fetch('foo')          # => 1
    #   counters.fetch(:bar, 0)        # => 0
    #   counters.fetch(:bar) { |key| 0 } # => 0
    #   counters.fetch(:zoo)           # => KeyError: key not found: "zoo"
    def fetch(key, *extras)
      super(convert_key(key), *extras)
    end

    # Same as <tt>Hash#dig</tt> where the key passed as argument can be
    # either a string or a symbol:
    #
    #   counters = ActiveSupport::HashWithIndifferentAccess.new
    #   counters[:foo] = { bar: 1 }
    #
    #   counters.dig('foo', 'bar')     # => 1
    #   counters.dig(:foo, :bar)       # => 1
    #   counters.dig(:zoo)             # => nil
    def dig(*args)
      args[0] = convert_key(args[0]) if args.size > 0
      super(*args)
    end

    # Same as <tt>Hash#default</tt> where the key passed as argument can be
    # either a string or a symbol:
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new(1)
    #   hash.default                   # => 1
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new { |hash, key| key }
    #   hash.default                   # => nil
    #   hash.default('foo')            # => 'foo'
    #   hash.default(:foo)             # => 'foo'
    def default(*args)
      super(*args.map { |arg| convert_key(arg) })
    end

    # Returns an array of the values at the specified indices:
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash[:a] = 'x'
    #   hash[:b] = 'y'
    #   hash.values_at('a', 'b') # => ["x", "y"]
    def values_at(*keys)
      super(*keys.map { |key| convert_key(key) })
    end

    # Returns an array of the values at the specified indices, but also
    # raises an exception when one of the keys can't be found.
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash[:a] = 'x'
    #   hash[:b] = 'y'
    #   hash.fetch_values('a', 'b') # => ["x", "y"]
    #   hash.fetch_values('a', 'c') { |key| 'z' } # => ["x", "z"]
    #   hash.fetch_values('a', 'c') # => KeyError: key not found: "c"
    def fetch_values(*indices, &block)
      super(*indices.map { |key| convert_key(key) }, &block)
    end

    # Returns a shallow copy of the hash.
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new({ a: { b: 'b' } })
    #   dup  = hash.dup
    #   dup[:a][:c] = 'c'
    #
    #   hash[:a][:c] # => "c"
    #   dup[:a][:c]  # => "c"
    def dup
      self.class.new(self).tap do |new_hash|
        set_defaults(new_hash)
      end
    end

    # This method has the same semantics of +update+, except it does not
    # modify the receiver but rather returns a new hash with indifferent
    # access with the result of the merge.
    def merge(*hashes, &block)
      dup.update(*hashes, &block)
    end

    # Like +merge+ but the other way around: Merges the receiver into the
    # argument and returns a new hash with indifferent access as result:
    #
    #   hash = ActiveSupport::HashWithIndifferentAccess.new
    #   hash['a'] = nil
    #   hash.reverse_merge(a: 0, b: 1) # => {"a"=>nil, "b"=>1}
    def reverse_merge(other_hash)
      super(self.class.new(other_hash))
    end
    alias_method :with_defaults, :reverse_merge

    # Same semantics as +reverse_merge+ but modifies the receiver in-place.
    def reverse_merge!(other_hash)
      super(self.class.new(other_hash))
    end
    alias_method :with_defaults!, :reverse_merge!

    # Replaces the contents of this hash with other_hash.
    #
    #   h = { "a" => 100, "b" => 200 }
    #   h.replace({ "c" => 300, "d" => 400 }) # => {"c"=>300, "d"=>400}
    def replace(other_hash)
      super(self.class.new(other_hash))
    end

    # Removes the specified key from the hash.
    def delete(key)
      super(convert_key(key))
    end

    # Returns a hash with indifferent access that includes everything except given keys.
    #   hash = { a: "x", b: "y", c: 10 }.with_indifferent_access
    #   hash.except(:a, "b") # => {c: 10}.with_indifferent_access
    #   hash                 # => { a: "x", b: "y", c: 10 }.with_indifferent_access
    def except(*keys)
      slice(*self.keys - keys.map { |key| convert_key(key) })
    end
    alias_method :without, :except

    def stringify_keys!; self end
    def deep_stringify_keys!; self end
    def stringify_keys; dup end
    def deep_stringify_keys; dup end
    undef :symbolize_keys!
    undef :deep_symbolize_keys!
    def symbolize_keys; to_hash.symbolize_keys! end
    alias_method :to_options, :symbolize_keys
    def deep_symbolize_keys; to_hash.deep_symbolize_keys! end
    def to_options!; self end

    def select(*args, &block)
      return to_enum(:select) unless block_given?
      dup.tap { |hash| hash.select!(*args, &block) }
    end

    def reject(*args, &block)
      return to_enum(:reject) unless block_given?
      dup.tap { |hash| hash.reject!(*args, &block) }
    end

    def transform_values(*args, &block)
      return to_enum(:transform_values) unless block_given?
      dup.tap { |hash| hash.transform_values!(*args, &block) }
    end

    def transform_keys(*args, &block)
      return to_enum(:transform_keys) unless block_given?
      dup.tap { |hash| hash.transform_keys!(*args, &block) }
    end

    def transform_keys!
      return enum_for(:transform_keys!) { size } unless block_given?
      keys.each do |key|
        self[yield(key)] = delete(key)
      end
      self
    end

    def slice(*keys)
      keys.map! { |key| convert_key(key) }
      self.class.new(super)
    end

    def slice!(*keys)
      keys.map! { |key| convert_key(key) }
      super
    end

    def compact
      dup.tap(&:compact!)
    end

    # Convert to a regular hash with string keys.
    def to_hash
      _new_hash = Hash.new
      set_defaults(_new_hash)

      each do |key, value|
        _new_hash[key] = convert_value(value, conversion: :to_hash)
      end
      _new_hash
    end

    private
      if Symbol.method_defined?(:name)
        def convert_key(key)
          key.kind_of?(Symbol) ? key.name : key
        end
      else
        def convert_key(key)
          key.kind_of?(Symbol) ? key.to_s : key
        end
      end

      def convert_value(value, conversion: nil)
        if value.is_a? Hash
          if conversion == :to_hash
            value.to_hash
          else
            value.nested_under_indifferent_access
          end
        elsif value.is_a?(Array)
          if conversion != :assignment || value.frozen?
            value = value.dup
          end
          value.map! { |e| convert_value(e, conversion: conversion) }
        else
          value
        end
      end

      def set_defaults(target)
        if default_proc
          target.default_proc = default_proc.dup
        else
          target.default = default
        end
      end

      def update_with_single_argument(other_hash, block)
        if other_hash.is_a? HashWithIndifferentAccess
          regular_update(other_hash, &block)
        else
          other_hash.to_hash.each_pair do |key, value|
            if block && key?(key)
              value = block.call(convert_key(key), self[key], value)
            end
            regular_writer(convert_key(key), convert_value(value))
          end
        end
      end
  end
end

# :stopdoc:

HashWithIndifferentAccess = ActiveSupport::HashWithIndifferentAccess
