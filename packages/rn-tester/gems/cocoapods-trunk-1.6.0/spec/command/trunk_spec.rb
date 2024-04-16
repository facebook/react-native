require File.expand_path('../../spec_helper', __FILE__)

module Pod
  describe Command::Trunk do
    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk        )).should.be.instance_of Command::Trunk
      end
    end

    before do
      @command = Command.parse(%w(trunk))
    end

    describe 'authorization' do
      it 'will use the trunk token from ENV if present' do
        ENV.stubs(:[]).with('COCOAPODS_TRUNK_TOKEN').returns('token')

        @command.send(:token).should == 'token'
      end
    end
  end
end
