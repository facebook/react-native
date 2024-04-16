class FuzzyMatch
  class Similarity
    attr_reader :record1
    attr_reader :record2
    
    def initialize(record1, record2)
      @record1 = record1
      @record2 = record2
    end
    
    def <=>(other)
      by_score = best_score <=> other.best_score
      if by_score == 0
        original_weight <=> other.original_weight
      else
        by_score
      end
    end
    
    def best_score
      @best_score ||= FuzzyMatch.score_class.new(record1.clean, record2.clean)
    end

    def satisfy?(needle, threshold)
      best_score.dices_coefficient_similar > threshold or
        ((record2.clean.length < 3 or needle.clean.length < 3) and best_score.levenshtein_similar > 0) or
        (needle.words & record2.words).any?
    end

    def inspect
      %{#{record2.clean.inspect} ~ #{record1.clean.inspect} => #{best_score.inspect}}
    end

    # Weight things towards short original strings
    def original_weight
      @original_weight ||= (1.0 / (record1.clean.length * record2.clean.length))
    end
  end
end
