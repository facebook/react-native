import invariant from 'invariant';

const INDEX_X = 0;
const INDEX_Y = 1;
const INDEX_Z = 2;

export default function processTransformOrigin(input) {
  const regExp = /(top|bottom|left|right|center|\d+(?:%|px))/gi;
  const output = ['50%', '50%', 0];

  let index = 0;
  let match;
  while ((match = regExp.exec(input))) {
    const value = match[0];
    const valueLower = value.toLowerCase();

    switch (valueLower) {
      case 'left':
      case 'right': {
        invariant(
          index === INDEX_X,
          'Transform-origin %s can only be used for x-position',
          value,
        );
        output[INDEX_X] = valueLower === 'left' ? 0 : '100%';
        break;
      }
      case 'top':
      case 'bottom': {
        const yValue = valueLower === 'top' ? 0 : '100%';

        // Handle one-value case
        if (index === INDEX_X) {
          invariant(
            regExp.exec(input) === null,
            'Could not parse transform-origin: %s',
            input,
          );
          output[INDEX_Y] = yValue;
          return output;
        }

        invariant(
          index === INDEX_Y,
          'Transform-origin %s can only be used for y-position',
          value,
        );
        output[INDEX_Y] = yValue;
        break;
      }
      case 'center': {
        invariant(
          index !== INDEX_Z,
          'Transform-origin value %s cannot be used for z-position',
          value,
        );
        output[index] = '50%';
        break;
      }
      default: {
        if (value.endsWith('%')) {
          invariant(
            index !== INDEX_Z,
            'Transform-origin value %s cannot be used for z-position',
            value,
          );
          output[index] = value;
        } else {
          output[index] = parseFloat(value); // Remove `px`
        }
        break;
      }
    }

    index += 1;
  }

  return output;
}
