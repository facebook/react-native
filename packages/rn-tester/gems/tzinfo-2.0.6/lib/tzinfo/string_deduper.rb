# encoding: UTF-8
# frozen_string_literal: true

require 'concurrent'

module TZInfo
  # Maintains a pool of `String` instances. The {#dedupe} method will return
  # either a pooled copy of a given `String` or add the instance to the pool.
  #
  # @private
  class StringDeduper #:nodoc:
    class << self
      # @return [StringDeduper] a globally available singleton instance of
      #   {StringDeduper}. This instance is safe for use in concurrently
      #   executing threads.
      attr_reader :global
    end

    # Initializes a new {StringDeduper}.
    def initialize
      @strings = create_hash do |h, k|
        v = k.dup.freeze
        h[v] = v
      end
    end

    # @param string [String] the string to deduplicate.
    # @return [bool] `string` if it is frozen, otherwise a frozen, possibly
    #   pre-existing copy of `string`.
    def dedupe(string)
      return string if string.frozen?
      @strings[string]
    end

    protected

    # Creates a `Hash` to store pooled `String` instances.
    #
    # @param block [Proc] Default value block to be passed to `Hash.new`.
    # @return [Hash] a `Hash` to store pooled `String` instances.
    def create_hash(&block)
      Hash.new(&block)
    end
  end
  private_constant :StringDeduper

  # A thread-safe version of {StringDeduper}.
  #
  # @private
  class ConcurrentStringDeduper < StringDeduper #:nodoc:
    protected

    def create_hash(&block)
      Concurrent::Map.new(&block)
    end
  end
  private_constant :ConcurrentStringDeduper


  string_unary_minus_does_dedupe = if '0'.respond_to?(:-@)
    # :nocov_no_string_-@:
    s1 = -('0'.dup)
    s2 = -('0'.dup)
    s1.object_id == s2.object_id
    # :nocov_no_string_-@:
  else
    # :nocov_string_-@:
    false
    # :nocov_string_-@:
  end

  if string_unary_minus_does_dedupe
    # :nocov_no_deduping_string_unary_minus:

    # An implementation of {StringDeduper} using the `String#-@` method where
    # that method performs deduplication (Ruby 2.5 and later).
    #
    # Note that this is slightly different to the plain {StringDeduper}
    # implementation. In this implementation, frozen literal strings are already
    # in the pool and are candidates for being returned, even when passed
    # another equal frozen non-literal string. {StringDeduper} will always
    # return frozen strings.
    #
    # There are also differences in encoding handling. This implementation will
    # treat strings with different encodings as different strings.
    # {StringDeduper} will treat strings with the compatible encodings as the
    # same string.
    #
    # @private
    class UnaryMinusGlobalStringDeduper #:nodoc:
      # @param string [String] the string to deduplicate.
      # @return [bool] `string` if it is frozen, otherwise a frozen, possibly
      #   pre-existing copy of `string`.
      def dedupe(string)
        # String#-@ on Ruby 2.6 will dedupe a frozen non-literal String. Ruby
        # 2.5 will just return frozen strings.
        #
        # The pooled implementation can't tell the difference between frozen
        # literals and frozen non-literals, so must always return frozen String
        # instances to avoid doing unncessary work when loading format 2
        # TZInfo::Data modules.
        #
        # For compatibility with the pooled implementation, just return frozen
        # string instances (acting like Ruby 2.5).
        return string if string.frozen?
        -string
      end
    end
    private_constant :UnaryMinusGlobalStringDeduper

    StringDeduper.instance_variable_set(:@global, UnaryMinusGlobalStringDeduper.new)
    # :nocov_no_deduping_string_unary_minus:
  else
    # :nocov_deduping_string_unary_minus:
    StringDeduper.instance_variable_set(:@global, ConcurrentStringDeduper.new)
    # :nocov_deduping_string_unary_minus:
  end
end
