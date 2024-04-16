# -*- encoding: utf-8 -*-
require 'spec_helper'

describe FuzzyMatch do
  describe '#find' do
    it %{finds the best match using string similarity} do
      d = FuzzyMatch.new %w{ RATZ CATZ }
      d.find('RITZ').should == 'RATZ'
    end

    it %{doesn't mind crazy characters} do
      d = FuzzyMatch.new %w{ RATZ CATZ }
      d.find('RíTZ').should == 'RATZ'
    end
  
    it %{not return any result if the maximum score is zero} do
      FuzzyMatch.new(['a']).find('b').should be_nil
    end

    it %{finds exact matches} do
      d = FuzzyMatch.new [ 'X' ]
      d.find('X').should == 'X'
    end
  end
  
  describe '#find_all' do
    it %{return all records in sorted order} do
      d = FuzzyMatch.new [ 'X', 'X22', 'Y', 'Y4' ], :groupings => [ /X/, /Y/ ], :must_match_grouping => true
      d.find_all('X').should == ['X', 'X22' ]
      d.find_all('A').should == []
    end
  end

  describe '#find_best' do
    it %{returns one or more records with the best score} do
      d = FuzzyMatch.new [ 'X', 'X', 'X22', 'Y', 'Y', 'Y4' ], :groupings => [ /X/, /Y/ ], :must_match_grouping => true
      d.find_best('X').should == ['X', 'X' ]
      d.find_best('A').should == []
    end
  end

  describe '#find_all_with_score' do
    it %{return records with 2 scores} do
      d = FuzzyMatch.new [ 'X', 'X22', 'Y', 'Y4' ], :groupings => [ /X/, /Y/ ], :must_match_grouping => true
      d.find_all_with_score('X').should == [ ['X', 1, 1], ['X22', 0, 0.33333333333333337] ]
      d.find_all_with_score('A').should == []
    end
  end

  describe '#find_with_score' do
    it %{return record with dice's and lev's scores} do
      d = FuzzyMatch.new [ 'X', 'X22', 'Y', 'Y4' ], :groupings => [ /X/, /Y/ ], :must_match_grouping => true
      d.find_with_score('X').should == ['X', 1, 1]
      d.find_with_score('A').should be_nil
    end
  end

  describe '#explain' do
    before do
      require 'stringio'
      @capture = StringIO.new
      @old_stdout = $stdout
      $stdout = @capture
    end
    after do
      $stdout = @old_stdout
    end
      
    it %{print a basic explanation to stdout} do
      d = FuzzyMatch.new %w{ RATZ CATZ }
      d.explain('RITZ')
      @capture.rewind
      @capture.read.should include('CATZ')
    end
    
    it %{explains match failures} do
      FuzzyMatch.new(['aaa']).explain('bbb')
      @capture.rewind
      @capture.read.should =~ %r{No winner assigned.*aaa.*bbb}
    end
  end

  describe "groupings replacings normalizers" do
    it %{sometimes gets false results without them} do
      d = FuzzyMatch.new ['BOEING 737-100/200', 'BOEING 737-900']
      d.find('BOEING 737100 number 900').should == 'BOEING 737-900'
    end

    it %{can be used to improve results} do
      d = FuzzyMatch.new ['BOEING 737-100/200', 'BOEING 737-900'], :groupings => [ [/boeing/i, /7(\d\d)-?(\d\d\d)?/]]
      d.find('BOEING 737100 number 900').should == 'BOEING 737-100/200'
    end
  end

  describe "identities" do
    it %{sometimes gets false results without them} do
      # false positive without identity
      d = FuzzyMatch.new %w{ foo bar }
      d.find('bar').should == 'bar'
      d.find('bare').should == 'bar'
      d.find('baz').should == 'bar'
    end

    it %{can be used to improve results} do
      d = FuzzyMatch.new %w{ foo bar }, :identities => [ /ba(.)/ ]
      d.find('bar').should == 'bar'
      d.find('bare').should == 'bar'
      d.find('baz').should be_nil
      d.find('baze').should be_nil
    end

    it %{is sort of like backreferences} do
      one = '1 sauk ONEONEONEONEONE'
      two = '2 sauk TWOTWOTWOTWO'
      d = FuzzyMatch.new([one, two])
      d.find('1 sauk TWOTWOTWOTWO').should == two # wrong
      d = FuzzyMatch.new([one, two], :identities => [/\A(\d+)\s+(\w+)/])
      d.find('1 sauk TWOTWOTWOTWO').should == one # correct
    end

    it %{has a proc form} do
      d = FuzzyMatch.new %w{ foo bar }, :identities => [ lambda { |a, b| (a.start_with?('ba') and b.start_with?('ba') ? a[2] == b[2] : nil) } ]
      d.find('bar').should == 'bar'
      d.find('bare').should == 'bar'
      d.find('baz').should be_nil
      d.find('baze').should be_nil
    end
  end

  describe 'groupings' do
    it %{sometimes gets false results without them} do
      d = FuzzyMatch.new [ 'Barack Obama', 'George Bush' ]
      d.find('Barack Bush').should == 'Barack Obama' # luke i am your father
      d.find('George Obama').should == 'George Bush' # nooooooooooooooooooo
    end
    
    it %{can be used to improve results} do
      d = FuzzyMatch.new [ 'Barack Obama', 'George Bush' ], :groupings => [ /Obama/, /Bush/ ]
      d.find('Barack Bush').should == 'George Bush'
      d.find('George Obama').should == 'Barack Obama'
    end

    it %{stays within the group} do
      d = FuzzyMatch.new [ 'AB', 'CD' ]
      d.find('ABCDCD').should == 'CD'
      d = FuzzyMatch.new [ 'AB', 'CD' ], :groupings => [/A/]
      d.find('ABCDCD').should == 'AB'
    end

    describe 'with chains' do
      describe 'hotel example' do
        before do
          @grandh = 'Grand Hyatt'
          @h = 'Hyatt'
          @hgarden = 'Hyatt Garden'
          @grandhotel = 'Grand Hotel'
          @fz = FuzzyMatch.new([@grandh, @h, @hgarden, @grandhotel], :groupings => [ [ /hyatt/i, /garden/i, /grand/i ] ], :stop_words => [ /hotel/i ])
        end

        it %{works as expected} do
          @fz.find('Grand Hyatt').should == @grandh
          @fz.find('Grand Hyatt Foobar').should == @grandh
          @fz.find('Hyatt Garden').should == @hgarden
          @fz.find('Hyatt Garden Foobar').should == @hgarden
        end

        it %{enforces some stuff} do
          # nope
          @fz.find('Grund Hyatt').should == @h
          @fz.find('Grund Hyatt Foobar').should == @h
          @fz.find('Hyatt Gurden').should == @h
          @fz.find('Hyatt Gurden Foobar').should == @h
          # hmm - hyatt misspelled, so totally prevented from matching hyatt
          @fz.find('Grund Hyutt').should == @grandhotel
          @fz.find('Grund Hyutt Foobar').should == @grandhotel
          # precedence
          @fz.find('Grand Hyatt Garden').should == @hgarden
          @fz.find('Grand Hyatt Garden Foobar').should == @hgarden
          # sanity
          @fz.find('Grund Hyatt Garden').should == @hgarden
          @fz.find('Grund Hyatt Garden Foobar').should == @hgarden
          @fz.find('Grand Hyatt Gurden').should == @grandh
          @fz.find('Grand Hyatt Gurden Foobar').should == @grandh
        end

        it %{is sticky} do
          @fz.find('Grand Hotel').should == @grandhotel
          @fz.find('Hotel Garden').should be_nil
          @fz.find('Grand Hotel Garden').should == @grandhotel
        end
      end

      it "helps with subgroups" do
        d = FuzzyMatch.new [ 'Boeing 747', 'Boeing 747SR', 'Boeing ER6' ], :groupings => [ [/boeing/i, /(7\d{2})/] ]
        d.find_all('Boeing 747').should == [ 'Boeing 747', 'Boeing 747SR' ]

        d = FuzzyMatch.new [ 'Boeing 747', 'Boeing 747SR', 'Boeing ER6' ], :groupings => [ [/boeing/i, /(7\d{2})/] ]
        d.find_all('Boeing ER6').should == ["Boeing ER6"]

        d = FuzzyMatch.new [ 'Boeing 747', 'Boeing 747SR', 'Boeing ER6' ], :groupings => [ [/boeing/i, /(7|E\d{2})/i] ]
        d.find_all('Boeing ER6').should == [ 'Boeing ER6' ]
        d.find_all('Boeing 747').should == [ 'Boeing 747', 'Boeing 747SR' ]
      end
    end
  end
  
  describe "the :must_match_grouping option" do
    it %{optionally only attempt matches with records that fit into a grouping} do
      d = FuzzyMatch.new [ 'Barack Obama', 'George Bush' ], :groupings => [ /Obama/, /Bush/ ], :must_match_grouping => true
      d.find('George Clinton').should be_nil

      d = FuzzyMatch.new [ 'Barack Obama', 'George Bush' ], :groupings => [ /Obama/, /Bush/ ]
      d.find('George Clinton', :must_match_grouping => true).should be_nil
    end
  end
  
  describe "the :read option" do
    it %{interpret a Numeric as an array index} do
      ab = ['a', 'b']
      ba = ['b', 'a']
      haystack = [ab, ba]
      by_first = FuzzyMatch.new haystack, :read => 0
      by_last = FuzzyMatch.new haystack, :read => 1
      by_first.find('a').should == ab
      by_last.find('b').should == ab
      by_first.find('b').should == ba
      by_last.find('a').should == ba
    end

    it %{interpret a Symbol, etc. as hash key} do
      ab = { :one => 'a', :two => 'b' }
      ba = { :one => 'b', :two => 'a' }
      haystack = [ab, ba]
      by_first = FuzzyMatch.new haystack, :read => :one
      by_last = FuzzyMatch.new haystack, :read => :two
      by_first.find('a').should == ab
      by_last.find('b').should == ab
      by_first.find('b').should == ba
      by_last.find('a').should == ba
    end

    MyStruct = Struct.new(:one, :two)
    it %{interpret a Symbol as a method id (if the object responds to it)} do
      ab = MyStruct.new('a', 'b')
      ba = MyStruct.new('b', 'a')
      haystack = [ab, ba]
      by_first = FuzzyMatch.new haystack, :read => :one
      by_last = FuzzyMatch.new haystack, :read => :two
      by_first.read.should == :one
      by_last.read.should == :two
      by_first.find('a').should == ab
      by_last.find('b').should == ab
      by_first.find('b').should == ba
      by_last.find('a').should == ba
    end
  end
  
  describe 'the :must_match_at_least_one_word option' do
    it %{optionally require that the matching record share at least one word with the needle} do
      d = FuzzyMatch.new %w{ RATZ CATZ }, :must_match_at_least_one_word => true
      d.find('RITZ').should be_nil

      d = FuzzyMatch.new ["Foo's Bar"], :must_match_at_least_one_word => true
      d.find("Foo's").should == "Foo's Bar"
      d.find("'s").should be_nil
      d.find("Foo").should be_nil

      d = FuzzyMatch.new ["Bolivia, Plurinational State of"], :must_match_at_least_one_word => true
      d.find("Bolivia").should == "Bolivia, Plurinational State of"
    end

    it %{use STOP WORDS} do
      d = FuzzyMatch.new [ 'A HOTEL', 'B HTL' ]
      d.find('A HTL', :must_match_at_least_one_word => true).should == 'B HTL'

      d = FuzzyMatch.new [ 'A HOTEL', 'B HTL' ], :must_match_at_least_one_word => true
      d.find('A HTL').should == 'B HTL'

      d = FuzzyMatch.new [ 'A HOTEL', 'B HTL' ], :must_match_at_least_one_word => true, :stop_words => [ %r{HO?TE?L} ]
      d.find('A HTL').should == 'A HOTEL'
    end
    
    it %{not be fooled by substrings (but rather compare whole words to whole words)} do
      d = FuzzyMatch.new [ 'PENINSULA HOTELS' ], :must_match_at_least_one_word => true
      d.find('DOLCE LA HULPE BXL FI').should be_nil
    end

    it %{not be case-sensitive when checking for sharing of words} do
      d = FuzzyMatch.new [ 'A', 'B' ]
      d.find('a', :must_match_at_least_one_word => true).should == 'A'
    end
  end
  
  describe "the :gather_last_result option" do
    it %{not gather metadata about the last result by default} do
      d = FuzzyMatch.new %w{ NISSAN HONDA }
      d.find('MISSAM')
      lambda do
        d.last_result
      end.should raise_error(::RuntimeError, /gather_last_result/)
    end

    it %{optionally gather metadata about the last result} do
      d = FuzzyMatch.new %w{ NISSAN HONDA }
      d.find 'MISSAM', :gather_last_result => true
      d.last_result.score.should == 0.6
      d.last_result.winner.should == 'NISSAN'
    end
  end
  
  describe 'quirks' do
    it %{should not return false negatives because of one-letter similarities} do
      # dices coefficient doesn't think these two are similar at all because it looks at pairs
      FuzzyMatch.score_class.new('X foo', 'X bar').dices_coefficient_similar.should == 0
      # so we must compensate for that somewhere
      d = FuzzyMatch.new ['X foo', 'randomness']
      d.find('X bar').should == 'X foo'
      # without making false positives
      d.find('Y bar').should be_nil
    end

    it %{finds possible matches even when pair distance fails} do
      d = FuzzyMatch.new ['XX', '2 A']
      d.find('2A').should == '2 A'
      d = FuzzyMatch.new ['XX', '2A']
      d.find('2 A').should == '2A'
    end

    it %{weird blow ups} do
      d = FuzzyMatch.new ['XX', '2 A']
      d.find('A').should == '2 A'
      d = FuzzyMatch.new ['XX', 'A']
      d.find('2 A').should == 'A'
    end

    it %{from the wild 1} do
      d = FuzzyMatch.new ["Doyle Collection", "Trump  Collection", "Luxury Collection", "Autograph Collection"]
      d.find("Algonquin  Autograph Collection").should == "Autograph Collection"
    end

  end

  describe 'deprecations' do
    it %{takes :must_match_blocking as :must_match_grouping} do
      d = FuzzyMatch.new [], :must_match_blocking => :a
      d.default_options[:must_match_grouping].should == :a
    end

    it %{takes :haystack_reader as :read} do
      d = FuzzyMatch.new [], :haystack_reader => :c
      d.read.should == :c
    end

    it %{takes :blockings as :groupings} do
      d = FuzzyMatch.new [], :blockings => [ /X/, /Y/ ]
      d.groupings.should == [ FuzzyMatch::Rule::Grouping.new(/X/), FuzzyMatch::Rule::Grouping.new(/Y/) ]
    end
  end
  
  it %{defaults to a pure-ruby engine, but also has amatch} do
    if defined?($testing_amatch) and $testing_amatch
      FuzzyMatch.engine.should == :amatch
    else
      FuzzyMatch.engine.should == :pure_ruby
    end
  end
end
