require File.expand_path('../../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Plugins::Publish do
    extend SpecHelper::PluginsPublishCommand

    before do
      UI.output = ''
    end

    it 'registers itself' do
      Command.parse(%w(plugins publish)).
        should.be.instance_of Command::Plugins::Publish
    end

    #--- Utils

    def create_temp_dir(*gemspecs)
      Dir.mktmpdir do |tmpdir|
        Dir.chdir(tmpdir) do
          gemspecs.each do |filename|
            File.write(filename, File.read(fixture(filename)))
          end
          yield if block_given?
        end
      end
    end

    #--- Validation

    it 'validate if there is only one gemfile' do
      create_temp_dir('cocoapods-foo1.gemspec') do
        should.not.raise(CLAide::Help) do
          publish_command.validate!
        end
      end
    end

    it 'raise if there is no gemfile' do
      create_temp_dir do
        should.raise(CLAide::Help) do
          publish_command.validate!
        end.message.should.include('No `.gemspec` file found')
      end
    end

    it 'raise if there is more than one gemfile' do
      create_temp_dir('cocoapods-foo1.gemspec', 'cocoapods-foo2.gemspec') do
        should.raise(CLAide::Help) do
          publish_command.validate!
        end.message.should.include('There is more than one gemspec')
      end
    end

    #--- Proper Generation

    it 'should notice when the gem name is not prefixed' do
      create_temp_dir('unprefixed.gemspec') do
        publish_command.tap { |t| t.stubs(:open_new_issue_url) }.run
        UI.output.should.include('Your gem name should start with ' \
          + '`cocoapods-` to be loaded as a plugin by CocoaPods')
      end
    end

    it 'should not notice when the gem name is prefixed' do
      create_temp_dir('cocoapods-foo1.gemspec') do
        publish_command.tap { |t| t.stubs(:open_new_issue_url) }.run
        UI.output.should.not.include('Your gem name should start with ' \
          + '`cocoapods-` to be loaded as a plugin by CocoaPods')
      end
    end

    it 'should have the plugin name in the issue title' do
      create_temp_dir('cocoapods-foo1.gemspec') do
        command = publish_command
        command.expects(:open_new_issue_url).
          with('[plugins.json] Add cocoapods-foo1', anything)
        command.run
      end
    end

    it 'should compute a nice plugin name' do
      publish_command.instance_eval do
        pretty_name_from_gemname('cocoapods-foo1')
      end.should.equal('CocoaPods Foo1')
    end

    it 'should have the plugin json entry in the issue body' do
      create_temp_dir('cocoapods-foo1.gemspec') do
        command = publish_command
        json = <<-JSON.chomp
Please add the following entry to the `plugins.json` file:

```
{
  "gem": "cocoapods-foo1",
  "name": "CocoaPods Foo1",
  "author": "Author 1",
  "url": "https://github.com/proper-man/cocoapods-foo1",
  "description": "Gem Summary 1"
}
```
        JSON
        command.expects(:open_new_issue_url).with(anything, json)
        command.run
      end
    end

    it 'should concatenate authors if more than one' do
      create_temp_dir('cocoapods-foo2.gemspec') do
        command = publish_command
        json = <<-JSON.chomp
Please add the following entry to the `plugins.json` file:

```
{
  "gem": "cocoapods-foo2",
  "name": "CocoaPods Foo2",
  "author": "Author 1, Author 2",
  "url": "https://github.com/proper-man/cocoapods-foo2",
  "description": "Gem Description 2"
}
```
        JSON
        command.expects(:open_new_issue_url).with(anything, json)
        command.run
      end
    end
  end
end
