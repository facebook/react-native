# frozen_string_literal: true

module I18n
  module Backend
    # Backend that chains multiple other backends and checks each of them when
    # a translation needs to be looked up. This is useful when you want to use
    # standard translations with a Simple backend but store custom application
    # translations in a database or other backends.
    #
    # To use the Chain backend instantiate it and set it to the I18n module.
    # You can add chained backends through the initializer or backends
    # accessor:
    #
    #   # preserves the existing Simple backend set to I18n.backend
    #   I18n.backend = I18n::Backend::Chain.new(I18n::Backend::ActiveRecord.new, I18n.backend)
    #
    # The implementation assumes that all backends added to the Chain implement
    # a lookup method with the same API as Simple backend does.
    # 
    # Fallback translations using the :default option are only used by the last backend of a chain.
    class Chain
      module Implementation
        include Base

        attr_accessor :backends

        def initialize(*backends)
          self.backends = backends
        end

        def initialized?
          backends.all? do |backend|
            backend.instance_eval do
              return false unless initialized?
            end
          end
          true
        end

        def reload!
          backends.each { |backend| backend.reload! }
        end

        def eager_load!
          backends.each { |backend| backend.eager_load! }
        end

        def store_translations(locale, data, options = EMPTY_HASH)
          backends.first.store_translations(locale, data, options)
        end

        def available_locales
          backends.map { |backend| backend.available_locales }.flatten.uniq
        end

        def translate(locale, key, default_options = EMPTY_HASH)
          namespace = nil
          options = Utils.except(default_options, :default)

          backends.each do |backend|
            catch(:exception) do
              options = default_options if backend == backends.last
              translation = backend.translate(locale, key, options)
              if namespace_lookup?(translation, options)
                namespace = _deep_merge(translation, namespace || {})
              elsif !translation.nil? || (options.key?(:default) && options[:default].nil?)
                return translation
              end
            end
          end

          return namespace if namespace
          throw(:exception, I18n::MissingTranslation.new(locale, key, options))
        end

        def exists?(locale, key, options = EMPTY_HASH)
          backends.any? do |backend|
            backend.exists?(locale, key, options)
          end
        end

        def localize(locale, object, format = :default, options = EMPTY_HASH)
          backends.each do |backend|
            catch(:exception) do
              result = backend.localize(locale, object, format, options) and return result
            end
          end
          throw(:exception, I18n::MissingTranslation.new(locale, format, options))
        end

        protected
          def init_translations
            backends.each do |backend|
              backend.send(:init_translations)
            end
          end

          def translations
            backends.reverse.each_with_object({}) do |backend, memo|
              partial_translations = backend.instance_eval do
                init_translations unless initialized?
                translations
              end
              Utils.deep_merge!(memo, partial_translations) { |_, a, b| b || a }
            end
          end

          def namespace_lookup?(result, options)
            result.is_a?(Hash) && !options.has_key?(:count)
          end

        private
          # This is approximately what gets used in ActiveSupport.
          # However since we are not guaranteed to run in an ActiveSupport context
          # it is wise to have our own copy. We underscore it
          # to not pollute the namespace of the including class.
          def _deep_merge(hash, other_hash)
            copy = hash.dup
            other_hash.each_pair do |k,v|
              value_from_other = hash[k]
              copy[k] = value_from_other.is_a?(Hash) && v.is_a?(Hash) ? _deep_merge(value_from_other, v) : v
            end
            copy
          end
      end

      include Implementation
    end
  end
end
