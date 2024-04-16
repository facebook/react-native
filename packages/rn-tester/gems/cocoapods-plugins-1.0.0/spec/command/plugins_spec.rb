require File.expand_path('../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Plugins do
    before do
      argv = CLAide::ARGV.new([])
      @command = Command::Plugins.new(argv)
    end

    it 'registers itself and uses the default subcommand' do
      Command.parse(%w(plugins)).should.be.instance_of Command::Plugins::List
    end

    it 'exists' do
      @command.should.not.be.nil?
    end
  end
end
