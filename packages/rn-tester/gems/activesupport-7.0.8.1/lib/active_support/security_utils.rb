# frozen_string_literal: true

module ActiveSupport
  module SecurityUtils
    # Constant time string comparison, for fixed length strings.
    #
    # The values compared should be of fixed length, such as strings
    # that have already been processed by HMAC. Raises in case of length mismatch.

    if defined?(OpenSSL.fixed_length_secure_compare)
      def fixed_length_secure_compare(a, b)
        OpenSSL.fixed_length_secure_compare(a, b)
      end
    else
      def fixed_length_secure_compare(a, b)
        raise ArgumentError, "string length mismatch." unless a.bytesize == b.bytesize

        l = a.unpack "C#{a.bytesize}"

        res = 0
        b.each_byte { |byte| res |= byte ^ l.shift }
        res == 0
      end
    end
    module_function :fixed_length_secure_compare

    # Secure string comparison for strings of variable length.
    #
    # While a timing attack would not be able to discern the content of
    # a secret compared via secure_compare, it is possible to determine
    # the secret length. This should be considered when using secure_compare
    # to compare weak, short secrets to user input.
    def secure_compare(a, b)
      a.bytesize == b.bytesize && fixed_length_secure_compare(a, b)
    end
    module_function :secure_compare
  end
end
