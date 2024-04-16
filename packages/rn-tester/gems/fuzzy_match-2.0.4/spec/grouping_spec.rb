require 'spec_helper'

describe FuzzyMatch::Rule::Grouping do
  it %{matches a single string argument} do
    b = FuzzyMatch::Rule::Grouping.new %r{apple}
    b.xmatch?(r('2 apples')).should == true
  end

  it %{embraces case insensitivity} do
    b = FuzzyMatch::Rule::Grouping.new %r{apple}i
    b.xmatch?(r('2 Apples')).should == true
  end
  
  it %{xjoins two string arguments} do
    b = FuzzyMatch::Rule::Grouping.new %r{apple}
    b.xjoin?(r('apple'), r('2 apples')).should == true
  end
  
  it %{fails to xjoin two string arguments} do
    b = FuzzyMatch::Rule::Grouping.new %r{apple}
    b.xjoin?(r('orange'), r('2 apples')).should == false
  end
  
  it %{returns nil instead of false when it has no information} do
    b = FuzzyMatch::Rule::Grouping.new %r{apple}
    b.xjoin?(r('orange'), r('orange')).should be_nil
  end

  it %{has chains} do
    h, gr, ga = FuzzyMatch::Rule::Grouping.make([/hyatt/, /grand/, /garden/])
    h.xjoin?(r('hyatt'), r('hyatt')).should == true

    h.xjoin?(r('grund hyatt'), r('grand hyatt')).should == true
    gr.xjoin?(r('grund hyatt'), r('grand hyatt')).should == false
    ga.xjoin?(r('grund hyatt'), r('grand hyatt')).should be_nil
    
    h.xjoin?(r('hyatt gurden'), r('hyatt garden')).should == true
    gr.xjoin?(r('hyatt gurden'), r('hyatt garden')).should be_nil
    ga.xjoin?(r('hyatt gurden'), r('hyatt garden')).should == false

    h.xjoin?(r('grand hyatt'), r('grand hyatt')).should == false # sacrificing itself
    gr.xjoin?(r('grand hyatt'), r('grand hyatt')).should == true
    ga.xjoin?(r('grand hyatt'), r('grand hyatt')).should be_nil

    h.xjoin?(r('hyatt garden'), r('hyatt garden')).should == false # sacrificing itself
    gr.xjoin?(r('hyatt garden'), r('hyatt garden')).should be_nil
    ga.xjoin?(r('hyatt garden'), r('hyatt garden')).should == true

    h.xjoin?(r('grand hyatt garden'), r('grand hyatt garden')).should == false # sacrificing itself
    gr.xjoin?(r('grand hyatt garden'), r('grand hyatt garden')).should == true
    ga.xjoin?(r('grand hyatt garden'), r('grand hyatt garden')).should == true # NOT sacrificing itself?
  end

  private

  def r(str)
    FuzzyMatch::Record.new str
  end

end
