require 'spec_helper'
require 'colored2/strings'

RSpec.describe Colored2 do
  describe 'global enable and disable' do
    before do
      Colored2.disable!
    end
    after do
      Colored2.enable!
    end
    let(:sample) { 'sample string' }

    describe 'colors' do
      subject { sample.red.on.blue }
      it { should eql(sample) }
    end
    describe 'effects' do
      subject { sample.bold.on.red }
      it { should eql(sample) }
    end
  end
end
