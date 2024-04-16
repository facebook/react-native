require File.expand_path('../../../spec_helper', __FILE__)

module Pod
  describe Command::Trunk::Register do
    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk register )).should.be.instance_of Command::Trunk::Register
      end
    end

    it 'should error if email is not supplied' do
      Netrc.any_instance.stubs(:[]).returns(nil)
      command = Command.parse(%w( trunk register ))
      exception = lambda { command.validate! }.should.raise CLAide::Help
      exception.message.should.include 'email address'
    end

    it 'should register user' do
      url = 'https://trunk.cocoapods.org/api/v1/sessions'
      stub_request(:post, url).
        with(:body => hash_including('email' => 'kyle@cocoapods.org')).
        to_return(:status => 200, :body => '{"token": "acct"}')
      Netrc.any_instance.stubs(:[]).returns(nil)
      Netrc.any_instance.expects(:[]=).with('trunk.cocoapods.org', ['kyle@cocoapods.org', 'acct'])
      Netrc.any_instance.expects(:save)

      command = Command.parse(%w( trunk register kyle@cocoapods.org ))
      lambda { command.run }.should.not.raise
    end
  end
end
