require File.expand_path('../../../spec_helper', __FILE__)

module Pod
  describe Command::Trunk::Me do
    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk me        )).should.be.instance_of Command::Trunk::Me
      end
    end

    it "should error if we don't have a token" do
      Netrc.any_instance.stubs(:[]).returns(nil)
      command = Command.parse(%w( trunk me      ))
      lambda { command.validate! }.should.raise CLAide::Help
    end
  end
end
