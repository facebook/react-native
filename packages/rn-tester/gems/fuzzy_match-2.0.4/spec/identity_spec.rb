require 'spec_helper'

describe FuzzyMatch::Rule::Identity do
  it %{determines whether two records COULD be identical} do
    i = FuzzyMatch::Rule::Identity.new %r{(A)[ ]*(\d)}
    i.identical?(r('A1'), r('A     1foobar')).should == true
  end
  
  it %{determines that two records MUST NOT be identical} do
    i = FuzzyMatch::Rule::Identity.new %r{(A)[ ]*(\d)}
    i.identical?(r('A1'), r('A     2foobar')).should == false
  end
  
  it %{returns nil indicating no information} do
    i = FuzzyMatch::Rule::Identity.new %r{(A)[ ]*(\d)}
    i.identical?(r('B1'), r('A     2foobar')).should == nil
  end
  
  it %{embraces case insensitivity} do
    i = FuzzyMatch::Rule::Identity.new %r{(A)[ ]*(\d)}i
    i.identical?(r('A1'), r('a     1foobar')).should == true
  end

  private

  def r(str)
    FuzzyMatch::Record.new str
  end
end
