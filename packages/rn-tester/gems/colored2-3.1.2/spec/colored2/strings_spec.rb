require File.expand_path('spec/spec_helper')
require 'colored2/strings'

RSpec.describe String do
  before do
    Colored2.decorate(String)
  end

  describe 'with foreground and background colors' do
    it 'should work with one color' do
      expect('red'.red).to eql("\e[31mred\e[0m")
    end

    it 'should add two colors chained' do
      expect('blue'.red.blue).to eql("\e[34m\e[31mblue\e[0m")
    end

    it 'should add background color using on_<color>' do
      expect('on yellow'.on.yellow).to eql("\e[43mon yellow\e[0m")
    end

    it 'should work with <color>_on_<color> syntax' do
      expect('red on blue'.red.on.blue).to eql("\e[44m\e[31mred on blue\e[0m")
    end
  end

  describe 'with effects' do
    it 'should add a bold modifier' do
      expect('way bold'.bold).to eql("\e[1mway bold\e[0m")
    end

    it 'should let modifiers stack' do
      expect('underlinedd bold'.bold.underlined).to eql("\e[4m\e[1munderlinedd bold\e[0m")
    end

    it 'should let modifiers stack with colors' do
      expect('cyan underlinedd bold'.bold.underlined.cyan).to eql("\e[36m\e[4m\e[1mcyan underlinedd bold\e[0m")
    end
  end

  describe 'new block syntax' do
    it 'should defined block syntax nested colors' do
      expect('No Color, then'.blue!('blue inside')).to eql('No Color, then' + 'blue inside'.blue)
    end

    it 'should defined block syntax nested colors two levels deep' do
      expect('regular here'.blue! + 'blue here'.no_color!).to eql('regular here' << 'blue here'.blue)
    end

    it 'should defined block syntax nested colors two levels deep' do
      expect('regular here'.blue! { 'something else'.red!('red riding hood') }).to eql('regular here'.blue! << 'something else'.red! << 'red riding hood'.no_color!)
    end

    it 'should defined block syntax nested colors two levels deep' do
      expectation = 'this is regular, but '.red! do
        'this is red '.yellow! do
          ' and yellow'.no_color!
        end
      end
      expect(expectation).to eql('this is regular, but '.red! << 'this is red '.yellow! << ' and yellow'.no_color!)
    end
  end

  describe 'end of line' do
    it 'should work with eol' do
      expect('nothing to see here really.'.to_eol).to eql("\e[2Knothing to see here really.")
    end

    it 'should work with eol_with_with_two_colors' do
      expect('blue'.red.blue.to_eol).to eql("\e[34m\e[31m\e[2Kblue\e[0m")
    end

    it 'should work with eol_with_modifiers_stack_with_colors' do
      expect('cyan underlinedd bold'.bold.underlined.cyan.to_eol).to eql("\e[36m\e[4m\e[1m\e[2Kcyan underlinedd bold\e[0m")
    end
  end
end
