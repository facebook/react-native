# frozen_string_literal: true

# This module allows you to easily cache all responses from the backend - thus
# speeding up the I18n aspects of your application quite a bit.
#
# To enable caching you can simply include the Cache module to the Simple
# backend - or whatever other backend you are using:
#
#   I18n::Backend::Simple.send(:include, I18n::Backend::Cache)
#
# You will also need to set a cache store implementation that you want to use:
#
#   I18n.cache_store = ActiveSupport::Cache.lookup_store(:memory_store)
#
# You can use any cache implementation you want that provides the same API as
# ActiveSupport::Cache (only the methods #fetch and #write are being used).
#
# The cache_key implementation by default assumes you pass values that return
# a valid key from #hash (see
# https://www.ruby-doc.org/core/classes/Object.html#M000337). However, you can
# configure your own digest method via which responds to #hexdigest (see
# https://ruby-doc.org/stdlib/libdoc/openssl/rdoc/OpenSSL/Digest.html):
#
#   I18n.cache_key_digest = OpenSSL::Digest::SHA256.new
#
# If you use a lambda as a default value in your translation like this:
#
#   I18n.t(:"date.order", :default => lambda {[:month, :day, :year]})
#
# Then you will always have a cache miss, because each time this method
# is called the lambda will have a different hash value. If you know
# the result of the lambda is a constant as in the example above, then
# to cache this you can make the lambda a constant, like this:
#
#   DEFAULT_DATE_ORDER = lambda {[:month, :day, :year]}
#   ...
#   I18n.t(:"date.order", :default => DEFAULT_DATE_ORDER)
#
# If the lambda may result in different values for each call then consider
# also using the Memoize backend.
#
module I18n
  class << self
    @@cache_store = nil
    @@cache_namespace = nil
    @@cache_key_digest = nil

    def cache_store
      @@cache_store
    end

    def cache_store=(store)
      @@cache_store = store
    end

    def cache_namespace
      @@cache_namespace
    end

    def cache_namespace=(namespace)
      @@cache_namespace = namespace
    end

    def cache_key_digest
      @@cache_key_digest
    end

    def cache_key_digest=(key_digest)
      @@cache_key_digest = key_digest
    end

    def perform_caching?
      !cache_store.nil?
    end
  end

  module Backend
    # TODO Should the cache be cleared if new translations are stored?
    module Cache
      def translate(locale, key, options = EMPTY_HASH)
        I18n.perform_caching? ? fetch(cache_key(locale, key, options)) { super } : super
      end

      protected

        def fetch(cache_key, &block)
          result = _fetch(cache_key, &block)
          throw(:exception, result) if result.is_a?(MissingTranslation)
          result = result.dup if result.frozen? rescue result
          result
        end

        def _fetch(cache_key, &block)
          result = I18n.cache_store.read(cache_key)
          return result unless result.nil?
          result = catch(:exception, &block)
          I18n.cache_store.write(cache_key, result) unless result.is_a?(Proc)
          result
        end

        def cache_key(locale, key, options)
          # This assumes that only simple, native Ruby values are passed to I18n.translate.
          "i18n/#{I18n.cache_namespace}/#{locale}/#{digest_item(key)}/#{digest_item(options)}"
        end

      private

        def digest_item(key)
          I18n.cache_key_digest ? I18n.cache_key_digest.hexdigest(key.to_s) : key.to_s.hash
        end
    end
  end
end
