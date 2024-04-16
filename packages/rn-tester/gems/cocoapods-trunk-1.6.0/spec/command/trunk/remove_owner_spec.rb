require File.expand_path('../../../spec_helper', __FILE__)

module Pod
  describe Command::Trunk::RemoveOwner do
    describe 'CLAide' do
      it 'registers itself' do
        Command.parse(%w( trunk remove-owner )).should.be.instance_of Command::Trunk::RemoveOwner
      end
    end

    describe 'validation' do
      it "should error if we don't have a token" do
        Netrc.any_instance.stubs(:[]).returns(nil)
        command = Command.parse(%w( trunk remove-owner ))
        exception = lambda { command.validate! }.should.raise CLAide::Help
        exception.message.should.include 'register a session'
      end

      it 'should error if pod name is not supplied' do
        command = Command.parse(%w( trunk remove-owner ))
        command.stubs(:token).returns('token')
        exception = lambda { command.validate! }.should.raise CLAide::Help
        exception.message.should.include 'pod name'
      end

      it 'should error if new owners email is not supplied' do
        command = Command.parse(%w( trunk remove-owner QueryKit ))
        command.stubs(:token).returns('token')
        exception = lambda { command.validate! }.should.raise CLAide::Help
        exception.message.should.include 'email'
      end

      it 'should should validate with valid pod and email' do
        command = Command.parse(%w( trunk remove-owner QueryKit kyle@cocoapods.org ))
        command.stubs(:token).returns('token')
        lambda { command.validate! }.should.not.raise CLAide::Help
      end
    end

    it 'should successfully remove an owner' do
      url = 'https://trunk.cocoapods.org/api/v1/pods/QueryKit/owners/kyle@cocoapods.org'
      stub_request(:delete, url).
        with(:headers => { 'Authorization' => 'Token 527d11fe429f3426cb8dbeba183a0d80' }).
        to_return(:status => 200, :body => '[]', :headers => {})

      command = Command.parse(%w( trunk remove-owner QueryKit kyle@cocoapods.org ))
      command.stubs(:token).returns('527d11fe429f3426cb8dbeba183a0d80')
      lambda { command.run }.should.not.raise
    end
  end
end
