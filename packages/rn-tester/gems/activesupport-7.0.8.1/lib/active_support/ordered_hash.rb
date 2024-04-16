# frozen_string_literal: true

require "yaml"

YAML.add_builtin_type("omap") do |type, val|
  ActiveSupport::OrderedHash[val.map { |v| v.to_a.first }]
end

module ActiveSupport
  # DEPRECATED: <tt>ActiveSupport::OrderedHash</tt> implements a hash that preserves
  # insertion order.
  #
  #   oh = ActiveSupport::OrderedHash.new
  #   oh[:a] = 1
  #   oh[:b] = 2
  #   oh.keys # => [:a, :b], this order is guaranteed
  #
  # Also, maps the +omap+ feature for YAML files
  # (See https://yaml.org/type/omap.html) to support ordered items
  # when loading from yaml.
  #
  # <tt>ActiveSupport::OrderedHash</tt> is namespaced to prevent conflicts
  # with other implementations.
  class OrderedHash < ::Hash # :nodoc:
    def to_yaml_type
      "!tag:yaml.org,2002:omap"
    end

    def encode_with(coder)
      coder.represent_seq "!omap", map { |k, v| { k => v } }
    end

    def select(*args, &block)
      dup.tap { |hash| hash.select!(*args, &block) }
    end

    def reject(*args, &block)
      dup.tap { |hash| hash.reject!(*args, &block) }
    end

    def nested_under_indifferent_access
      self
    end

    # Returns true to make sure that this hash is extractable via <tt>Array#extract_options!</tt>
    def extractable_options?
      true
    end
  end
end
