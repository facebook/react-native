require 'fuzzy_match/score/pure_ruby'
require 'fuzzy_match/score/amatch'

class FuzzyMatch
  class Score
    include Comparable
    
    attr_reader :str1
    attr_reader :str2

    def initialize(str1, str2)
      @str1 = str1.downcase
      @str2 = str2.downcase
    end

    def inspect
      %{(dice=#{"%0.5f" % dices_coefficient_similar},lev=#{"%0.5f" % levenshtein_similar})}
    end

    def <=>(other)
      a = dices_coefficient_similar
      b = other.dices_coefficient_similar
      if a.nan? or b.nan? or (by_dices_coefficient = (a <=> b)) == 0
        levenshtein_similar <=> other.levenshtein_similar
      else
        by_dices_coefficient
      end
    end
  end
end
