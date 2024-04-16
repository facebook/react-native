# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Form do
  let(:hash) { {} }
  let!(:easy) { Ethon::Easy.new }
  let(:form) { Ethon::Easy::Form.new(easy, hash) }

  describe ".new" do
    it "assigns attribute to @params" do
      expect(form.instance_variable_get(:@params)).to eq(hash)
    end
  end

  describe "#first" do
    it "returns a pointer" do
      expect(form.first).to be_a(FFI::Pointer)
    end
  end

  describe "#last" do
    it "returns a pointer" do
      expect(form.first).to be_a(FFI::Pointer)
    end
  end

  describe "#multipart?" do
    before { form.instance_variable_set(:@query_pairs, pairs) }

    context "when query_pairs contains string values" do
      let(:pairs) { [['a', '1'], ['b', '2']] }

      it "returns false" do
        expect(form.multipart?).to be_falsey
      end
    end

    context "when query_pairs contains file" do
      let(:pairs) { [['a', '1'], ['b', ['path', 'encoding', 'abs_path']]] }

      it "returns true" do
        expect(form.multipart?).to be_truthy
      end
    end

    context "when options contains multipart=true" do
      before { form.instance_variable_set(:@multipart, true) }
      let(:pairs) { [['a', '1'], ['b', '2']] }

      it "returns true" do
        expect(form.multipart?).to be_truthy
      end
    end
  end

  describe "#materialize" do
    before { form.instance_variable_set(:@query_pairs, pairs) }

    context "when query_pairs contains string values" do
      let(:pairs) { [['a', '1']] }

      it "adds params to form" do
        expect(Ethon::Curl).to receive(:formadd)
        form.materialize
      end
    end

    context "when query_pairs contains nil" do
      let(:pairs) { [['a', nil]] }

      it "adds params to form" do
        expect(Ethon::Curl).to receive(:formadd)
        form.materialize
      end
    end

    context "when query_pairs contains file" do
      let(:pairs) { [['a', ["file", "type", "path/file"]]] }

      it "adds file to form" do
        expect(Ethon::Curl).to receive(:formadd)
        form.materialize
      end
    end

    context "when query_pairs contains file and string values" do
      let(:pairs) { [['a', ["file", "type", "path/file"]], ['b', '1']] }

      it "adds file to form" do
        expect(Ethon::Curl).to receive(:formadd).twice
        form.materialize
      end
    end

    context "when query_pairs contains file, string and int values" do
      let(:pairs) { [['a', ["file", "type", "path/file"]], ['b', '1'], ['c', 1]] }

      it "adds file to form" do
        expect(Ethon::Curl).to receive(:formadd).exactly(3).times
        form.materialize
      end
    end
  end
end
