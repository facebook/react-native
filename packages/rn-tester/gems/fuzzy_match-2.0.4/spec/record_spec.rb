require 'spec_helper'

describe FuzzyMatch::Record do
  it %{does not treat "'s" as a word} do
    assert_split ["foo's", "bar"], "Foo's Bar"
  end
  
  it %{treats "bolivia," as just "bolivia"} do
    assert_split ["bolivia", "plurinational", "state"], "Bolivia, Plurinational State"
  end
  
  it %{does not split up hyphenated words} do
    assert_split ['north-west'], "north-west"
  end
  
  it %{splits up words as expected} do
    assert_split ['the', 'quick', "fox's", 'mouth', 'is', 'always', 'full'], "the quick fox's mouth -- is always full."
  end
  
  private
  
  def assert_split(ary, str)
    FuzzyMatch::Record.new(str).words.should == ary
  end
end
