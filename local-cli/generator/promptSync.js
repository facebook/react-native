// Simplified version of:
// https://github.com/0x00A/prompt-sync/blob/master/index.js

'use strict';

var fs = require('fs');
var term = 13; // carriage return

function create() {

  return prompt;

  function prompt(ask, value, opts) {
    var insert = 0, savedinsert = 0, res, i, savedstr;
    opts = opts || {};

    if (Object(ask) === ask) {
      opts = ask;
      ask = opts.ask;
    } else if (Object(value) === value) {
      opts = value;
      value = opts.value;
    }
    ask = ask || '';
    var echo = opts.echo;
    var masked = 'echo' in opts;

    var fd = (process.platform === 'win32') ? 
      process.stdin.fd :
      fs.openSync('/dev/tty', 'rs');

    var wasRaw = process.stdin.isRaw;
    if (!wasRaw) { process.stdin.setRawMode(true); }

    var buf = new Buffer(3);
    var str = '', character, read;

    savedstr = '';

    if (ask) {
      process.stdout.write(ask);
    }

    var cycle = 0;
    var prevComplete;

    while (true) {
      read = fs.readSync(fd, buf, 0, 3);
      if (read > 1) { // received a control sequence
        if (buf.toString()) {
          str = str + buf.toString();
          str = str.replace(/\0/g, '');
          insert = str.length;
          process.stdout.write('\u001b[2K\u001b[0G'+ ask + str);
          process.stdout.write('\u001b[' + (insert+ask.length+1) + 'G');
          buf = new Buffer(3);
        }
        continue; // any other 3 character sequence is ignored
      }

      // if it is not a control character seq, assume only one character is read
      character = buf[read-1];

      // catch a ^C and return null
      if (character == 3){
        process.stdout.write('^C\n');
        fs.closeSync(fd);
        process.exit(130);
        process.stdin.setRawMode(wasRaw);
        return null;
      }

      // catch the terminating character
      if (character == term) {
        fs.closeSync(fd);
        break;
      }

      if (character == 127 || (process.platform == 'win32' && character == 8)) { //backspace
        if (!insert) continue;
        str = str.slice(0, insert-1) + str.slice(insert);
        insert--;
        process.stdout.write('\u001b[2D');
      } else {
        if ((character < 32 ) || (character > 126))
            continue;
        str = str.slice(0, insert) + String.fromCharCode(character) + str.slice(insert);
        insert++;
      };

      if (masked) {
          process.stdout.write('\u001b[2K\u001b[0G' + ask + Array(str.length+1).join(echo));
      } else {
        process.stdout.write('\u001b[s');
        if (insert == str.length) {
            process.stdout.write('\u001b[2K\u001b[0G'+ ask + str);
        } else {
          if (ask) {
            process.stdout.write('\u001b[2K\u001b[0G'+ ask + str);
          } else {
            process.stdout.write('\u001b[2K\u001b[0G'+ str + '\u001b[' + (str.length - insert) + 'D');
          }
        }
        process.stdout.write('\u001b[u');
        process.stdout.write('\u001b[1C');
      }

    }
    
    process.stdout.write('\n')

    process.stdin.setRawMode(wasRaw);
    
    return str || value || '';
  };
};

module.exports = create;