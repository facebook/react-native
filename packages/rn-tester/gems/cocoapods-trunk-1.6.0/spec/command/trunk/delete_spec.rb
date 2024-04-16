require File.expand_path('../../../spec_helper', __FILE__)
require 'tmpdir'

module Pod
  describe Command::Trunk::Delete do
    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk delete )).should.be.instance_of Command::Trunk::Delete
      end
    end

    it 'should error without a pod name' do
      command = Command.parse(%w( trunk delete ))
      lambda { command.validate! }.should.raise CLAide::Help
    end

    it 'should error without a version' do
      command = Command.parse(%w( trunk delete Stencil ))
      lambda { command.validate! }.should.raise CLAide::Help
    end

    it 'confirms deletion' do
      Colored2.disable!
      UI.inputs += %w(garbage true false)
      command = Command.parse(%w( trunk delete Stencil 1.0.0 ))
      command.send(:confirm_deletion?).should.be.true
      command.send(:confirm_deletion?).should.be.false

      UI.output.should == <<-OUTPUT.gsub(/^>$/, '> ')
WARNING: It is generally considered bad behavior to remove versions of a Pod that others are depending on!
Please consider using the `deprecate` command instead.
Are you sure you want to delete this Pod version?
>
Are you sure you want to delete this Pod version?
>
WARNING: It is generally considered bad behavior to remove versions of a Pod that others are depending on!
Please consider using the `deprecate` command instead.
Are you sure you want to delete this Pod version?
>
      OUTPUT
    end

    it 'does not delete if the user does not confirm' do
      Command::Trunk::Delete.any_instance.expects(:confirm_deletion?).returns(false)
      Command::Trunk::Delete.any_instance.expects(:delete).never
      Command::Trunk::Delete.invoke(%w(Stencil 1.0.0))
    end

    it 'should show information for a pod' do
      response = {
        'messages' => [
          {
            '2015-12-05 02:00:25 UTC' => 'Push for `Stencil 1.0.0` initiated.',
          },
          {
            '2015-12-05 02:00:26 UTC' => 'Push for `Stencil 1.0.0` has been pushed (1.02409270 s).',
          },
        ],
        'data_url' => 'https://raw.githubusercontent.com/CocoaPods/Specs/ce4efe9f986d297008e8c61010a4b0d5881c50d0/Specs/Stencil/1.0.0/Stencil.podspec.json',
      }
      Command::Trunk::Delete.any_instance.expects(:delete).returns(response)
      UI.inputs << 'TRUE '
      Command::Trunk::Delete.invoke(%w(Stencil 1.0.0))

      UI.output.should.include 'Data URL: https://raw.githubusercontent'
      UI.output.should.include 'Push for `Stencil 1.0.0` initiated'
    end
  end
end
