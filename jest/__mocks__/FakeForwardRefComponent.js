const React = require('react');

const ForwardedComponent = () => null;

const ForwardRefComponent = React.forwardRef((props, ref) => <ForwardedComponent {...props} forwardedRef={ref} />);

ForwardRefComponent.displayName = 'ForwardedComponent';

module.exports = ForwardRefComponent;
