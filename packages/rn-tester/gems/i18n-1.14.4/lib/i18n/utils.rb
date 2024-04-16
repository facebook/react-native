# frozen_string_literal: true

module I18n
  module Utils
    class << self
      if Hash.method_defined?(:except)
        def except(hash, *keys)
          hash.except(*keys)
        end
      else
        def except(hash, *keys)
          hash = hash.dup
          keys.each { |k| hash.delete(k) }
          hash
        end
      end

      def deep_merge(hash, other_hash, &block)
        deep_merge!(hash.dup, other_hash, &block)
      end

      def deep_merge!(hash, other_hash, &block)
        hash.merge!(other_hash) do |key, this_val, other_val|
          if this_val.is_a?(Hash) && other_val.is_a?(Hash)
            deep_merge(this_val, other_val, &block)
          elsif block_given?
            yield key, this_val, other_val
          else
            other_val
          end
        end
      end

      def deep_symbolize_keys(hash)
        hash.each_with_object({}) do |(key, value), result|
          result[key.respond_to?(:to_sym) ? key.to_sym : key] = deep_symbolize_keys_in_object(value)
          result
        end
      end

      private

      def deep_symbolize_keys_in_object(value)
        case value
        when Hash
          deep_symbolize_keys(value)
        when Array
          value.map { |e| deep_symbolize_keys_in_object(e) }
        else
          value
        end
      end
    end
  end
end
