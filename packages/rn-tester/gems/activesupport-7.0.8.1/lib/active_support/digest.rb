# frozen_string_literal: true

require "openssl"

module ActiveSupport
  class Digest # :nodoc:
    class << self
      def hash_digest_class
        @hash_digest_class ||= OpenSSL::Digest::MD5
      end

      def hash_digest_class=(klass)
        raise ArgumentError, "#{klass} is expected to implement hexdigest class method" unless klass.respond_to?(:hexdigest)
        @hash_digest_class = klass
      end

      def hexdigest(arg)
        hash_digest_class.hexdigest(arg)[0...32]
      end
    end
  end
end
