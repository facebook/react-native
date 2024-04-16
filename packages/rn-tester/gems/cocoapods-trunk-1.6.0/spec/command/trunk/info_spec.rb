require File.expand_path('../../../spec_helper', __FILE__)
require 'tmpdir'

module Pod
  describe Command::Trunk::Info do
    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk info )).should.be.instance_of Command::Trunk::Info
      end
    end

    it 'should error without a pod name' do
      command = Command.parse(%w( trunk info ))
      lambda { command.validate! }.should.raise CLAide::Help
    end

    it 'should show information for a pod' do
      url = 'https://trunk.cocoapods.org/api/v1/pods/Stencil'
      stub_request(:get, url).to_return(:body => {
        'owners' => [
          {
            'name' => 'Kyle Fuller',
            'email' => 'kyle@example.com',
          },
        ],
      }.to_json)

      command = Command.parse(%w( trunk info Stencil ))
      lambda { command.validate! }.should.not.raise CLAide::Help
      command.run

      UI.output.should.include 'Owners'
      UI.output.should.include 'Kyle Fuller <kyle@example.com>'
    end
  end
end
