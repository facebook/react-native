# frozen_string_literal: true

require "active_support/core_ext/object/duplicable"

module ActiveSupport
  # +ParameterFilter+ replaces values in a <tt>Hash</tt>-like object if their
  # keys match one of the specified filters.
  #
  # Matching based on nested keys is possible by using dot notation, e.g.
  # <tt>"credit_card.number"</tt>.
  #
  # If a proc is given as a filter, each key and value of the <tt>Hash</tt>-like
  # and of any nested <tt>Hash</tt>es will be passed to it. The value or key can
  # then be mutated as desired using methods such as <tt>String#replace</tt>.
  #
  #   # Replaces values with "[FILTERED]" for keys that match /password/i.
  #   ActiveSupport::ParameterFilter.new([:password])
  #
  #   # Replaces values with "[FILTERED]" for keys that match /foo|bar/i.
  #   ActiveSupport::ParameterFilter.new([:foo, "bar"])
  #
  #   # Replaces values for the exact key "pin" and for keys that begin with
  #   # "pin_". Does not match keys that otherwise include "pin" as a
  #   # substring, such as "shipping_id".
  #   ActiveSupport::ParameterFilter.new([/\Apin\z/, /\Apin_/])
  #
  #   # Replaces the value for :code in `{ credit_card: { code: "xxxx" } }`.
  #   # Does not change `{ file: { code: "xxxx" } }`.
  #   ActiveSupport::ParameterFilter.new(["credit_card.code"])
  #
  #   # Reverses values for keys that match /secret/i.
  #   ActiveSupport::ParameterFilter.new([-> (k, v) do
  #     v.reverse! if /secret/i.match?(k)
  #   end])
  #
  class ParameterFilter
    FILTERED = "[FILTERED]" # :nodoc:

    # Create instance with given filters. Supported type of filters are +String+, +Regexp+, and +Proc+.
    # Other types of filters are treated as +String+ using +to_s+.
    # For +Proc+ filters, key, value, and optional original hash is passed to block arguments.
    #
    # ==== Options
    #
    # * <tt>:mask</tt> - A replaced object when filtered. Defaults to <tt>"[FILTERED]"</tt>.
    def initialize(filters = [], mask: FILTERED)
      @filters = filters
      @mask = mask
    end

    # Mask value of +params+ if key matches one of filters.
    def filter(params)
      compiled_filter.call(params)
    end

    # Returns filtered value for given key. For +Proc+ filters, third block argument is not populated.
    def filter_param(key, value)
      @filters.empty? ? value : compiled_filter.value_for_key(key, value)
    end

  private
    def compiled_filter
      @compiled_filter ||= CompiledFilter.compile(@filters, mask: @mask)
    end

    class CompiledFilter # :nodoc:
      def self.compile(filters, mask:)
        return lambda { |params| params.dup } if filters.empty?

        strings, regexps, blocks, deep_regexps, deep_strings = [], [], [], nil, nil

        filters.each do |item|
          case item
          when Proc
            blocks << item
          when Regexp
            if item.to_s.include?("\\.")
              (deep_regexps ||= []) << item
            else
              regexps << item
            end
          else
            s = Regexp.escape(item.to_s)
            if s.include?("\\.")
              (deep_strings ||= []) << s
            else
              strings << s
            end
          end
        end

        regexps << Regexp.new(strings.join("|"), true) unless strings.empty?
        (deep_regexps ||= []) << Regexp.new(deep_strings.join("|"), true) if deep_strings&.any?

        new regexps, deep_regexps, blocks, mask: mask
      end

      attr_reader :regexps, :deep_regexps, :blocks

      def initialize(regexps, deep_regexps, blocks, mask:)
        @regexps = regexps
        @deep_regexps = deep_regexps&.any? ? deep_regexps : nil
        @blocks = blocks
        @mask = mask
      end

      def call(params, parents = [], original_params = params)
        filtered_params = params.class.new

        params.each do |key, value|
          filtered_params[key] = value_for_key(key, value, parents, original_params)
        end

        filtered_params
      end

      def value_for_key(key, value, parents = [], original_params = nil)
        parents.push(key) if deep_regexps
        if regexps.any? { |r| r.match?(key.to_s) }
          value = @mask
        elsif deep_regexps && (joined = parents.join(".")) && deep_regexps.any? { |r| r.match?(joined) }
          value = @mask
        elsif value.is_a?(Hash)
          value = call(value, parents, original_params)
        elsif value.is_a?(Array)
          # If we don't pop the current parent it will be duplicated as we
          # process each array value.
          parents.pop if deep_regexps
          value = value.map { |v| value_for_key(key, v, parents, original_params) }
          # Restore the parent stack after processing the array.
          parents.push(key) if deep_regexps
        elsif blocks.any?
          key = key.dup if key.duplicable?
          value = value.dup if value.duplicable?
          blocks.each { |b| b.arity == 2 ? b.call(key, value) : b.call(key, value, original_params) }
        end
        parents.pop if deep_regexps
        value
      end
    end
  end
end
