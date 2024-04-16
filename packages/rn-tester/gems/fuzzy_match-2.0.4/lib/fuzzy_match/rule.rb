class FuzzyMatch
  # A rule characterized by a regexp. Abstract.
  class Rule
    attr_reader :regexp
    
    def initialize(regexp)
      unless regexp.is_a?(::Regexp)
        raise ArgumentError, "[FuzzyMatch] Rules must be set with Regexp objects, but got #{regexp.inspect} (#{regexp.class.name})"
      end
      @regexp = regexp
    end
    
    def ==(other)
      other.class == self.class and regexp == other.regexp
    end
  end
end
