require File.expand_path('spec/spec_helper')
require 'colored2/object'

subject1 = red('hello')
subject2 = red('blue').on.blue
subject3 = on.yellow('on yellow')

RSpec.describe Object do

  describe 'with foreground and background colors' do
    it 'should work with one color' do
      expect(subject1).to eql('hello'.red)
    end

    it 'should work with color on color' do
      expect(subject2).to eql('blue'.red.on.blue)
    end

    it 'should add background color using on_<color>' do
      expect(subject3).to eql('on yellow'.on.yellow)
    end

  end
end
