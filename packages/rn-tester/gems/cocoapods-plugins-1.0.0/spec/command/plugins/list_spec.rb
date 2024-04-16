require File.expand_path('../../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Plugins::List do
    extend SpecHelper::PluginsStubs

    before do
      UI.output = ''
      @command = Pod::Command::Plugins::List.new CLAide::ARGV.new []
    end

    it 'registers itself' do
      Command.parse(%w(plugins list)).
        should.be.instance_of Command::Plugins::List
    end

    #--- Output printing

    it 'prints out all plugins' do
      stub_plugins_json_request
      @command.run
      UI.output.should.include('github.com/CocoaPods/cocoapods-fake-1')
      UI.output.should.include('github.com/CocoaPods/cocoapods-fake-2')
      UI.output.should.include('github.com/chneukirchen/bacon')
    end
  end
end
