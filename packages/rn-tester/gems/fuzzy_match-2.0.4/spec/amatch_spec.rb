unless RUBY_PLATFORM == 'java'
  require 'spec_helper'
  require 'amatch'
  
  describe FuzzyMatch do
    describe %{when using the :amatch string similarity engine} do
      before do
        $testing_amatch = true
        FuzzyMatch.engine = :amatch
      end
      after do
        $testing_amatch = false
        FuzzyMatch.engine = nil
      end
    end
  end
end
