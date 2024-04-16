# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy do
  let(:easy) { Ethon::Easy.new }

  describe ".new" do
    it "inits curl" do
      expect(Ethon::Curl).to receive(:init)
      easy
    end

    context "when options are empty" do
      it "sets only callbacks" do
        expect_any_instance_of(Ethon::Easy).to receive(:set_callbacks)
        expect(Ethon::Easy).to receive(:set_option).never
        easy
      end
    end

    context "when options not empty" do
      context "when followlocation is set" do
        let(:options) { { :followlocation => true } }
        let(:easy) { Ethon::Easy.new(options) }

        it "sets followlocation" do
          expect_any_instance_of(Ethon::Easy).to receive(:set_callbacks)
          expect(Ethon::Curl).to receive(:set_option).with(:followlocation, true, anything)
          easy
        end
      end
    end
  end

  describe "#set_attributes" do
    context "when options are empty" do
      it "sets only callbacks" do
        expect_any_instance_of(Ethon::Easy).to receive(:set_callbacks)
        expect(Ethon::Easy).to receive(:set_option).never
        easy
      end
    end

    context "when options aren't empty" do
      context "when valid key" do
        it "sets" do
          expect(easy).to receive(:verbose=).with(true)
          easy.set_attributes({:verbose => true})
        end
      end

      context "when invalid key" do
        it "raises invalid option error" do
          expect{ easy.set_attributes({:fubar => 1}) }.to raise_error(Ethon::Errors::InvalidOption)
        end
      end
    end
  end

  describe "#reset" do
    before { easy.url = "www.example.com" }

    it "resets url" do
      easy.reset
      expect(easy.url).to be_nil
    end

    it "resets escape?" do
      easy.escape = false
      easy.reset
      expect(easy.escape?).to be_truthy
    end

    it "resets hash" do
      easy.reset
      expect(easy.instance_variable_get(:@hash)).to be_nil
    end

    it "resets easy handle" do
      expect(Ethon::Curl).to receive(:easy_reset)
      easy.reset
    end

    it "resets on_complete" do
      easy.on_complete { p 1 }
      easy.reset
      expect(easy.on_complete).to be_empty
    end

    it "resets on_headers" do
      easy.on_headers { p 1 }
      easy.reset
      expect(easy.on_headers).to be_empty
    end

    it "resets on_body" do
      easy.on_body { p 1 }
      easy.reset
      expect(easy.on_body).to be_empty
    end
  end

  describe "#dup" do
    let!(:easy) do
      easy = Ethon::Easy.new
      easy.url = "http://localhost:3001/"
      easy.on_complete { 'on_complete' }
      easy.on_headers { 'on_headers' }
      easy.on_progress { 'on_progress' }
      easy.response_body = String.new('test_body')
      easy.response_headers = String.new('test_headers')
      easy
    end
    let!(:e) { easy.dup }

    it "sets a new handle" do
      expect(e.handle).not_to eq(easy.handle)
    end

    it "preserves url" do
      expect(e.url).to eq(easy.url)
    end

    it "preserves on_complete callback" do
      expect(e.on_complete).to be(easy.on_complete)
    end

    it "preserves on_headers callback" do
      expect(e.on_headers).to be(easy.on_headers)
    end

    it 'preserves body_write_callback of original handle' do
      expect { easy.perform }.to change { easy.response_body }
      expect { easy.perform }.not_to change { e.response_body }
    end

    it "preserves on_progress callback" do
      expect(e.on_progress).to be(easy.on_progress)
    end

    it 'sets new body_write_callback of duplicated handle' do
      expect { e.perform }.to change { e.response_body }
      expect { e.perform }.not_to change { easy.response_body }
    end

    it 'preserves headers_write_callback of original handle' do
      expect { easy.perform }.to change { easy.response_headers }
      expect { easy.perform }.not_to change { e.response_headers }
    end

    it 'sets new headers_write_callback of duplicated handle' do
      expect { e.perform }.to change { e.response_headers }
      expect { e.perform }.not_to change { easy.response_headers }
    end

    it "resets response_body" do
      expect(e.response_body).to be_empty
    end

    it "resets response_headers" do
      expect(e.response_headers).to be_empty
    end

    it "sets response_body for duplicated Easy" do
      e.perform
      expect(e.response_body).not_to be_empty
    end

    it "sets response_headers for duplicated Easy" do
      e.perform
      expect(e.response_headers).not_to be_empty
    end

    it "preserves response_body for original Easy" do
      e.perform
      expect(easy.response_body).to eq('test_body')
    end

    it "preserves response_headers for original Easy" do
      e.perform
      expect(easy.response_headers).to eq('test_headers')
    end
  end

  describe "#mirror" do
    it "returns a Mirror" do
      expect(easy.mirror).to be_a(Ethon::Easy::Mirror)
    end

    it "builds from easy" do
      expect(Ethon::Easy::Mirror).to receive(:from_easy).with(easy)
      easy.mirror
    end
  end

  describe "#log_inspect" do
    [ :url, :response_code, :return_code, :total_time ].each do |name|
      it "contains #{name}" do
        expect(easy.log_inspect).to match name.to_s
      end
    end
  end
end
