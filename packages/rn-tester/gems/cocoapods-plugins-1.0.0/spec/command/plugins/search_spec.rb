require File.expand_path('../../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Plugins::Search do
    extend SpecHelper::PluginsStubs
    extend SpecHelper::PluginsSearchCommand

    before do
      UI.output = ''
    end

    it 'registers itself' do
      Command.parse(%w(plugins search)).
        should.be.instance_of Command::Plugins::Search
    end

    #--- Validation

    it 'should require a non-empty query' do
      @command = search_command
      should.raise(CLAide::Help) do
        @command.validate!
      end.message.should.match(/A search query is required./)
    end

    it 'should require a valid RegExp as query' do
      @command = search_command('[invalid')
      should.raise(CLAide::Help) do
        @command.validate!
      end.message.should.match(/A valid regular expression is required./)
    end

    #--- Output printing

    it 'should filter plugins only by name without full search' do
      stub_plugins_json_request
      @command = search_command('search')
      @command.run
      UI.output.should.not.include('-> CocoaPods Fake Gem')
      UI.output.should.include('-> CocoaPods Searchable Fake Gem')
      UI.output.should.not.include('-> Bacon')
    end

    it 'should filter plugins by name, author, description with full search' do
      stub_plugins_json_request
      @command = search_command('--full', 'search')
      @command.run
      UI.output.should.include('-> CocoaPods Fake Gem')
      UI.output.should.include('-> CocoaPods Searchable Fake Gem')
      UI.output.should.not.include('-> Bacon')
    end
  end
end
