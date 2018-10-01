const mockComponent = require('../mockComponent');
const FakeComponent = require('FakeComponent')
const TextInput = require('TextInput')

it('defaults to a displayName of "Component" when the mocked component does not have one', () => {
    expect(FakeComponent.displayName).toBeUndefined();
    expect(mockComponent('FakeComponent').displayName).toBe('Component');
});

it('forwards the mocked component\'s displayName when available', () => {
    expect(TextInput.displayName).toBe('TextInput');
    expect(mockComponent('TextInput').displayName).toBe('TextInput');
});
