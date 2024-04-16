class FuzzyMatch
  # Records are the tokens that are passed around when doing scoring and optimizing.
  class Record #:nodoc: all
    # "Foo's" is one word
    # "North-west" is just one word
    # "Bolivia," is just Bolivia
    WORD_BOUNDARY = %r{\W*(?:\s+|$)}
    EMPTY = [].freeze
    BLANK = ''.freeze

    attr_reader :original
    attr_reader :read
    attr_reader :stop_words

    def initialize(original, options = {})
      @original = original
      @read = options[:read]
      @stop_words = options.fetch(:stop_words, EMPTY)
    end

    def inspect
      "w(#{clean.inspect})"
    end

    def clean
      @clean ||= begin
        memo = whole.dup
        stop_words.each do |stop_word|
          memo.gsub! stop_word, BLANK
        end
        memo.strip.freeze
      end
    end

    def words
      @words ||= clean.downcase.split(WORD_BOUNDARY).freeze
    end

    def similarity(other)
      Similarity.new self, other
    end

    def whole
      @whole ||= case read
      when ::NilClass
        original
      when ::Numeric, ::String
        original[read]
      when ::Proc
        read.call original
      when ::Symbol
        original.respond_to?(read) ? original.send(read) : original[read]
      else
        raise "Expected nil, a proc, or a symbol, got #{read.inspect}"
      end.to_s.strip.freeze
    end
  end
end
