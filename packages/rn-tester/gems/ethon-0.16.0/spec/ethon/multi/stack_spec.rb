# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Multi::Stack do
  let(:multi) { Ethon::Multi.new }
  let(:easy) { Ethon::Easy.new }

  describe "#add" do
    context "when easy already added" do
      before { multi.add(easy) }

      it "returns nil" do
        expect(multi.add(easy)).to be_nil
      end
    end

    context "when easy new" do
      it "adds easy to multi" do
        expect(Ethon::Curl).to receive(:multi_add_handle).and_return(:ok)
        multi.add(easy)
      end

      it "adds easy to easy_handles" do
        multi.add(easy)
        expect(multi.easy_handles).to include(easy)
      end
    end

    context "when multi_add_handle fails" do
      it "raises multi add error" do
        expect(Ethon::Curl).to receive(:multi_add_handle).and_return(:bad_easy_handle)
        expect{ multi.add(easy) }.to raise_error(Ethon::Errors::MultiAdd)
      end
    end

    context "when multi cleaned up before" do
      it "raises multi add error" do
        Ethon::Curl.multi_cleanup(multi.handle)
        expect{ multi.add(easy) }.to raise_error(Ethon::Errors::MultiAdd)
      end
    end
  end

  describe "#delete" do
    context "when easy in easy_handles" do
      before { multi.add(easy) }

      it "deletes easy from multi" do
        expect(Ethon::Curl).to receive(:multi_remove_handle).and_return(:ok)
        multi.delete(easy)
      end

      it "deletes easy from easy_handles" do
        multi.delete(easy)
        expect(multi.easy_handles).to_not include(easy)
      end
    end

    context "when easy is not in easy_handles" do
      it "does nothing" do
        expect(Ethon::Curl).to receive(:multi_add_handle).and_return(:ok)
        multi.add(easy)
      end

      it "adds easy to easy_handles" do
        multi.add(easy)
        expect(multi.easy_handles).to include(easy)
      end
    end

    context "when multi_remove_handle fails" do
      before { multi.add(easy) }

      it "raises multi remove error" do
        expect(Ethon::Curl).to receive(:multi_remove_handle).and_return(:bad_easy_handle)
        expect{ multi.delete(easy) }.to raise_error(Ethon::Errors::MultiRemove)
      end
    end
  end
end
