import invariant from 'invariant';

export default function processTransformOrigin(input) {
  const output = ['50%', '50%', 0];
  let xSet = false;
  let ySet = false;
  let zSet = false;

  for (const match of input.matchAll(
    /(top|bottom|left|right|center|\d+%?)/gi,
  )) {
    let value = match[0].toLowerCase();
    if (!isNaN(value)) {
      value = Number(value);
    }

    switch (value) {
      case 'top':
      case 'bottom': {
        invariant(!ySet, 'Cannot set %s in transform-origin as the vertical direction has already been set', value);
        output[1] = value === 'top' ? 0 : '100%';
        ySet = true;
        break;
      }
      case 'left':
      case 'right': {
        invariant(!xSet, 'Cannot set %s in transform-origin as the horizontal direction has already been set', value);
        output[0] = value === 'left' ? 0 : '100%';
        xSet = true;
        break;
      }
      case 'center': {
        if (!xSet) {
          output[0] = '50%';
          xSet = true;
        } else if (!ySet) {
          output[1] = '50%';
          ySet = true;
        } else {
          invariant(
            false,
            'Cannot set center in transform-origin as boththe  horizontal and vertical directions have been set',
          );
        }
        break;
      }
      default: {
        if (!xSet) {
          output[0] = value;
          xSet = true;
        } else if (!ySet) {
          output[1] = value;
          ySet = true;
        } else if (!zSet) {
          output[2] = value;
          zSet = true;
        } else {
          invariant(false, 'Cannot set %s in transform-origin as all values have already been set', value);
        }
        break;
      }
    }
  }

  return output;
}
