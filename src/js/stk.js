var PS1 = '(scratchpad) ';

var welcome = ['        _____________    ',
  '  _____\\__    ___/  | __',
 ' /  ___/ |    |  |  |/ /',
 ' \\___ \\  |    |  |    < ',
' /____ > |____|  |__|_ \\',
     ' \\/              \\/'].join('\n');

var stack = [];

var prelude = [': sum 0 [+] fold ;',
               ': product 1 [*] fold ;',
               ': concatenation "" [concat] fold ;',
               ': >>t {"t"} swap concat ;',
               ': >>tx {} cons {"tx"} swap concat ;',
               ': >>ty {} cons {"ty"} swap concat ;',
               ': >>r {"r"} swap concat ;',
               ': >>rx {} cons {"rx"} swap concat ;',
               ': >>ry {} cons {"rx"} swap concat ;',
               ': >>rz {} cons {"rz"} swap concat ;',
               ': transition {} cons cons cons {"transition"} swap concat ;'
              ];

var tests = [ '{1 2} {1 2} = assert',
              '{1 2 3} length 3 = assert',
              '"hello" length 5 = assert',
              '"" small assert',
              '"a" small assert',
              '"ab" small not assert',
              '[] small assert',
              '[1] small assert',
              '[1 2] small not assert',
              '{} small assert',
              '{1} small assert',
              '{1 2} small not assert',
              '1 [1 =] [1 +] [2 +] ifte 2 = assert',
              '1 [2 =] [1 +] [2 +] ifte 3 = assert',
              '[dup * 1 +] 3 swap i 10 = assert',
              '{1 2 3} [1 +] map {2 3 4} = assert',
              '{1 2 3} 8 [+] fold 14 = assert',
              '[dup * 1 +] [[1 +] [id] ifnumber] map 5 swap i 27 = assert',
              '5 [ 1 = ] [ ] [ dup pred ] [ * ] linrec 120 = assert',
              '5 [1] [*] primrec 120 = assert',
              '12 [small] [] [pred dup pred] [+] binrec 144 = assert'
             ];


var push = function(e) {
  stack.push(e);
};

var pop = function() {
  if( stack.length === 0 ) {
    throw Error('Stack underflow');
  }
  var e = stack.pop();
  return e;
};

var peek = function() {
  if( stack.length === 0 ) {
    throw Error('Stack underflow');
  }
  return stack[stack.length-1];
};

var add = function() {
  var a = stack.pop();
  var b = stack.pop();
  stack.push( a + b );
};

var sub = function() {
  var b = stack.pop();
  var a = stack.pop();
  stack.push( a - b );
};

var mul = function() {
  var a = stack.pop();
  var b = stack.pop();
  stack.push( a * b );
};

var div = function() {
  var a = stack.pop();
  var b = stack.pop();
  stack.push( a / b );
};

var is_sequence = function(e) {
  return e.quotation ||
         (e instanceof Array) ||
         typeof(e) === 'string';
};

var deep_equals = function(a, b) {
  var array_equals = function(a,b) {
    if( a.length !== b.length ) {
      return false;
    }
    var i;
    for(i=0;i<a.length;i++) {
      if( !deep_equals(a[i], b[i]) ) {
        return false;
      }
    }
    return true;
  };

  if( a instanceof Array && b instanceof Array ) {
    return array_equals(a,b);
  } else if( a.quotation && b.quotation ) {
    return array_equals(a.quotation, b.quotation);
  } else {
    return a === b;
  }
  return false;
};

var dictionnary = {};
var ops;

var interpret = function(fragments, output) {
  if( !(fragments instanceof Array) ) {
    return interpret([fragments], output);
  }

  var i;

  for(i=0;i<fragments.length;i++) {
    if( typeof(fragments[i]) === 'function' ) {
      fragments[i](output);
    } else if( fragments[i].reference ) {
      interpret(fragments[i].reference, output);
    } else {
      push ( fragments[i] );
    }
  }
};

var fragment_to_string = function(e) {
  var find_name = function(root, x) {
    var p;
    for(p in root) {
      if( root.hasOwnProperty(p) ) {
        if( deep_equals(x, root[p]) ) {
          return p;
        }
      }
    }
    return '???';
  };
  if( e.quotation ) {
    return ['['].concat(e.quotation.map(fragment_to_string)).concat(']').join(' ');
  } else if( e.reference ) {
    return find_name(dictionnary, e);
  } else if( e instanceof Array ) {
    return '{ '+e.map(fragment_to_string).join(' ')+' }';
  } else if( (typeof(e) === 'string') ) {
    return '"'+e+'"';
  } else if( (typeof(e) === 'function') ) {
    return find_name(ops, e);
  } else if( (typeof(e) === 'boolean') ) {
    return e?'t':'f';
  } else {
    return e;
  }
};

var print_stack = function(output) {
  var i;
  if( stack.length > 0 ) {
    output.Write('Data stack ---\n', 'jqconsole-output');
    for(i=0;i<stack.length;i++) {
      output.Write(fragment_to_string(stack[i])+'\n', 'jqconsole-output');
    }
  }
};


ops = {
  'number?': function() {
    var a = pop();
    push( typeof(a) === 'number' );
  },
  'string?': function() {
    var a = pop();
    push( typeof(a) === 'string' );
  },
  'array?': function() {
    var a = pop();
    push( a instanceof Array );
  },
  'quotation?': function() {
    var a = pop();
    push( a.quotation !== undefined );
  },
  drop: function() {
    pop();
  },
  clear: function() {
    stack = [];
  },
  '+': add,
  add: add,
  '-': sub,
  sub: sub,
  '*': mul,
  mul: mul,
  '/': function() {
    var a = pop();
    var b = pop();
    push( b / a );
  },
  div: function() {
    var a = pop();
    var b = pop();
    push( b % a );
    push( b / a );
  },
  rem: function() {
    var a = pop();
    var b = pop();
    push( b % a );
  },
  and: function() {
    var a = pop();
    var b = pop();
    if( typeof(a) === 'boolean' && typeof(b) === 'boolean' ) {
      push( a && b );
    } else if( typeof(a) === 'number' && typeof(b) === 'number' ) {
      push( a & b );
    } else {
      throw Error('boolean or number are required !');
    }
  },
  or: function() {
    var a = pop();
    var b = pop();
    if( typeof(a) === 'boolean' && typeof(b) === 'boolean' ) {
      push( a || b );
    } else if( typeof(a) === 'number' && typeof(b) === 'number' ) {
      push( a | b );
    } else {
      throw Error('boolean or number are required !');
    }
  },
  xor: function() {
    var a = pop();
    var b = pop();
    if( typeof(a) === 'boolean' && typeof(b) === 'boolean' ) {
      push( Boolean(a ^ b) );
    } else if( typeof(a) === 'number' && typeof(b) === 'number' ) {
      push( a ^ b );
    } else {
      throw Error('boolean or number are required !');
    }
  },
  not: function() {
    var a = pop();
    if( typeof(a) === 'boolean' ) {
      push( !a );
    } else {
      throw Error('boolean value is required !');
    }
  },
  '>': function() {
    var b = pop();
    var a = pop();
    if( typeof(a) === 'number' && typeof(b) === 'number' ||
        typeof(a) === 'string' && typeof(b) === 'string' ) {
      push( a > b );
    } else {
      throw Error('number values are required !');
    }
  },
  '>=': function() {
    var b = pop();
    var a = pop();
    if( typeof(a) === 'number' && typeof(b) === 'number' ||
        typeof(a) === 'string' && typeof(b) === 'string' ) {
      push( a >= b );
    } else {
      throw Error('number values are required !');
    }
  },
  '=': function() {
    var b = pop();
    var a = pop();
    push( deep_equals(a, b) );
  },
  '!=': function() {
    var b = pop();
    var a = pop();
    if( typeof(a) === 'number' && typeof(b) === 'number' ||
        typeof(a) === 'string' && typeof(b) === 'string' ) {
      push( a !== b );
    } else {
      throw Error('number values are required !');
    }
  },
  '<=': function() {
    var b = pop();
    var a = pop();
    if( typeof(a) === 'number' && typeof(b) === 'number' ||
        typeof(a) === 'string' && typeof(b) === 'string' ) {
      push( a <= b );
    } else {
      throw Error('number values are required !');
    }
  },
  '<': function() {
    var b = pop();
    var a = pop();
    if( typeof(a) === 'number' && typeof(b) === 'number' ||
        typeof(a) === 'string' && typeof(b) === 'string' ) {
      push( a < b );
    } else {
      throw Error('number values are required !');
    }
  },
  choice: function() {
    var f = pop();
    var t = pop();
    var b = pop();
    if( typeof(b) !== 'boolean' ) {
      throw Error('elt is not a boolean !');
    }
    if( b ) {
      push( t );
    } else {
      push( f );
    }
  },
  ifte: function(output) {
    var f = pop();
    var t = pop();
    var q = pop();
    var stack_backup = stack.slice();

    if( !f.quotation || !t.quotation || !q.quotation  ) {
      throw Error('elts must be quotations !');
    }
    push( q );
    ops.i(output);
    var b = pop();

    if( typeof(b) !== 'boolean' ) {
      throw Error('return value must be a boolean !');
    }

    stack = stack_backup;

    if( b ) {
      push( t );
    } else {
      push( f );
    }

    ops.i(output);
  },
  assert: function() {
    var a = pop();
    if( typeof(a) !== 'boolean' ) {
      throw Error('value is not of type boolean !');
    }

    if( !a  ) {
      throw Error('Assert Error !');
    }
  },
  length: function() {
    var a = pop();
    if( !is_sequence(a) ) {
      throw Error('elt is not a sequence !');
    }
    if( a.quotation ) {
      push( a.quotation.length );
    } else {
      push( a.length );
    }
  },
  small: function() {
    var a = pop();
    if( typeof(a) === 'boolean' ) {
      throw Error('elt should not be a boolean !');
    }
    if( a.quotation ) {
      push( (a.quotation.length === 0) || (a.quotation.length === 1) );
    } else if( typeof(a) === 'number' ) {
      push( a < 2 );
    } else {
      push( a.length === 0 || a.length === 1 );
    }
  },
  succ: function() {
    var a = pop();
    if( typeof(a) !== 'number' ) {
      throw Error('elt is not a number !');
    }
    push( ++a );
  },
  pred: function() {
    var a = pop();
    if( typeof(a) !== 'number' ) {
      throw Error('elt is not a number !');
    }
    push( --a );
  },
  '.': function(output) {
    var a = pop();
    output.Write(fragment_to_string(a)+'\n', 'jqconsole-output');
  },
  id: function() {
  },
  dup: function() {
    var a = pop();
    push(a);
    push(a);
  },
  swap: function() {
    var a = pop();
    var b = pop();
    push( a );
    push( b );
  },
  rollup: function() {
    var z = pop();
    var y = pop();
    var x = pop();
    push(z);
    push(x);
    push(y);
  },
  rolldown: function() {
    var z = pop();
    var y = pop();
    var x = pop();
    push(y);
    push(z);
    push(x);
  },
  rotate: function() {
    var z = pop();
    var y = pop();
    var x = pop();
    push(z);
    push(y);
    push(x);
  },
  dip: function(output) {
    var q = pop();
    var x = pop();
    if( !q.quotation ) {
      throw Error('elt is not a quotation !');
    }
    interpret(q.quotation, output);
    push(x);
  },
  i: function(output) {
    var q = pop();
    if( !q.quotation ) {
      throw Error('elt is not a quotation !');
    }
    interpret(q.quotation, output);
  },
  nth: function(output) {
    var q = pop();
    var n = pop();
    if( typeof(n) !== 'number' ) {
      throw Error('index is not a number !');
    }
    if( !is_sequence(q) ) {
      throw Error('elt is not a sequence !');
    }
    if( q.quotation ) {
      if( n < q.quotation.length ) {
        interpret(q.quotation[n], output);
      } else {
        throw Error('index out of range !');
      }
    } else if( q instanceof Array ) {
      if( n < q.length ) {
        push( q[n] );
      } else {
        throw Error('index out of range !');
      }
    } else if( typeof(q) === 'string' ) {
      if( n < q.length ) {
        push( q.charAt(n) );
      } else {
        throw Error('index out of range !');
      }
    }
  },
  concat: function() {
    var b = pop();
    var a = pop();
    if( !is_sequence(a) || !is_sequence(b) ) {
      throw Error('elts should be sequences !');
    }
    if( a.quotation && b.quotation ) {
      var result = a.quotation.concat(b.quotation);
      push({ quotation: result });
    } else if( a instanceof Array && b instanceof Array ) {
      push(a.concat(b));
    } else if( typeof(a) === 'string' && typeof(b) === 'string' ) {
      push(a.concat(b));
    } else {
      throw Error('elts should have same type !');
    }
  },
  cons: function() { // faire cons pour un string
    var b = pop();
    var a = pop();
    if( !(b instanceof Array) && !b.quotation ) {
      throw Error('second elt should be a quotation or an array !');
    }
    if( b.quotation ) {
      var result = [a].concat(b.quotation);
      push({ quotation: result });
    } else if( b instanceof Array ) {
      push([a].concat(b));
    }
  },
  swons: function() { // faire swons pour un string
    var a = pop();
    var b = pop();
    if( !(b instanceof Array) && !b.quotation ) {
      throw Error('second elt should be a quotation or an array !');
    }
    if( b.quotation ) {
      var result = [a].concat(b.quotation);
      push({ quotation: result });
    } else if( b instanceof Array ) {
      push([a].concat(b));
    }
  },
  uncons: function(output) { // faire uncons pour un string
    var first, rest, a = pop();
    if( !(a instanceof Array) && !a.quotation ) {
      throw Error('second elt should be a quotation or an array !');
    }
    if( a.quotation ) {
      if( a.quotation.length < 1 ) {
        throw Error('uncons on empty quotation !');
      }
      first = a.quotation[0];
      rest = a.quotation.slice(1);
      interpret(first, output);
      push({ quotation: rest });
    } else if( a instanceof Array ) {
      if( a.length < 1 ) {
        throw Error('uncons on empty array !');
      }
      first = a[0];
      push( first );
      push( a.slice(1) );
    }
  },
  first: function(output) { // faire first pour un string
    var first, a = pop();
    if( !(a instanceof Array) && !a.quotation ) {
      throw Error('elt should be a quotation or an array !');
    }
    if( a.quotation ) {
      if( a.quotation.length < 1 ) {
        throw Error('first on empty quotation !');
      }
      first = a.quotation[0];
      interpret(first, output);
    } else if( a instanceof Array ) {
      if( a.length < 1 ) {
        throw Error('first on empty array !');
      }
      first = a[0];
      push( first );
    }
  }, // faire rest
  map : function(output) {
    var i;
    var q = pop();
    var a = pop();
    if( !(a instanceof Array) && !a.quotation ) {
      throw Error('first elt should be an array or a quotation !');
    }
    if( !q.quotation ) {
      throw Error('second elt should be a quotation !');
    }
    var array;
    if( a instanceof Array ) {
      array = a;
    } else {
      array = a.quotation;
    }
    var result = [];
    for(i=0;i<array.length;i++) {
      push(array[i]);
      push(q);
      ops.i(output);
      result.push(pop());
    }
    if( a instanceof Array ) {
      push(result);
    } else {
      push({quotation: result});
    }
  },
  fold : function(output) {
    var i;
    var q = pop();
    var v0 = pop();
    var a = pop();
    if( (v0 instanceof Array) || v0.quotation ) {
      throw Error('v0 must be a primitive value !');
    }
    if( !(a instanceof Array) || !q.quotation ) {
      throw Error('elts should be an array and a quotation !');
    }
    var v = v0;
    for(i=0;i<a.length;i++) {
      push(v);
      push(a[i]);
      push(q);
      ops.i(output);
      v = pop();
    }
    push(v);
  },
  ifnumber: function(output) {
    var fq = pop();
    var tq = pop();
    var a = pop();

    if( !fq.quotation || !tq.quotation ) {
      throw Error('elts must quotations !');
    }

    if( (a instanceof Array) || a.quotation ) {
      throw Error('elt must be a primitive value !');
    }

    push( a );

    if( typeof(a) === 'number'  ) {
      push( tq );
    } else {
      push( fq );
    }
    ops.i(output);
  },
  primrec: function(output) {
    var qc = pop();
    var qi = pop();
    var x = peek();

    if( !qc.quotation || !qi.quotation ) {
      throw Error('two elts must be a quotation !');
    }

    if( typeof(x) !== 'number' ) {
      throw Error('first element must be a number !');
    }

    while(x>0) {
      x = x - 1;
      if(x === 0) {
        push(qi);
        ops.i(output);
      } else {
        push( x );
      }
      push(qc);
      ops.i(output);
    }
  },
  linrec: function(output) {
    var qr2 = pop();
    var qr1 = pop();
    var qt = pop();
    var qp = pop();
    if( !qr2.quotation || !qr1.quotation || !qt.quotation || !qp.quotation ) {
      throw Error('all elts must be a quotation !');
    }

    var calls = [];
    calls.push({stage:0});
    while(calls.length>0) {
      var cur = calls.pop();
      switch(cur.stage) {
        case 0: {
            ops.dup();
            push(qp);
            ops.i(output);
            var b = pop();
            if( typeof(b) !== 'boolean' ) {
              throw Error('result of first quotation must be a boolean !');
            }
            if( b ) {
              push(qt);
              ops.i(output);
            } else {
              push(qr1);
              ops.i(output);
              calls.push({stage:1});
              calls.push({stage:0});
            }
          }
          break;
        case 1: {
            push(qr2);
            ops.i(output);
          }
          break;
      }
    }
  },
  binrec: function(output) {
    var qr2 = pop();
    var qr1 = pop();
    var qt = pop();
    var qp = pop();
    if( !qr2.quotation || !qr1.quotation || !qt.quotation || !qp.quotation ) {
      throw Error('all elts must be a quotation !');
    }

    var result;
    var calls = [];
    calls.push({stage:0});

    while(calls.length>0) {
      var cur = calls.pop();
      switch(cur.stage) {
        case 0: {
            if( cur.input !== undefined ) {
              push(cur.input);
            }
            ops.dup();
            push(qp);
            ops.i(output);
            var b = pop();
            if( typeof(b) !== 'boolean' ) {
              throw Error('result of first quotation must be a boolean !');
            }
            if( b ) {
              push(qt);
              ops.i(output);
              result = pop();
              continue;
            } else {
              push(qr1);
              ops.i(output);
              calls.push({stage:1, input: pop()});
              calls.push({stage:0});
            }
          }
          break;
        case 1: {
            calls.push({stage: 2, input: result});
            calls.push({stage:0, input: cur.input});
          }
          break;
        case 2: {
            push(result);
            push(cur.input);
            push(qr2);
            ops.i(output);
            result = pop();
            continue;
          }
          break;
      }
    }
    push(result);
  }
};

var mk_object = function(type, value) {
  return { type: type, value: value };
};

var next_token = function(input, pos) {
  var open = 0, delimiters = [];
  pos = pos || 0;
  var result = [];
  if( pos >= input.length ) {
    return ['', -1];
  }
  while ( true ) {
    if( !open && input.charAt(pos) === ' ' && result.length === 0 ) {
      // skip whitespaces
      pos++;
      continue;
    } else if( !open && (pos === input.length || input.charAt(pos) === ' ') ) {
      // end of token
      var new_pos = (pos === input.length)?-1:pos+1;
      return [result.join(''), new_pos];
    } else if ( !open && input.charAt(pos) === '"' ) {
      // begin of string
      open++;
      delimiters.push('"');
    } else if ( open && delimiters[delimiters.length-1] === '"' && input.charAt(pos) === '"' ) {
      // end of string
      open = 0;
      delimiters.push('');
    } else if ( input.charAt(pos) === '[' ) {
      // begin of quotation
      open++;
      delimiters.push('[');
    } else if ( open && delimiters[delimiters.length-1] === '[' && input.charAt(pos) === ']' ) {
      // end of quotation
      open--;
      delimiters.pop();
    } else if ( input.charAt(pos) === '{' ) {
      // begin of array
      open++;
      delimiters.push('{');
    } else if ( open && delimiters[delimiters.length-1] === '{' && input.charAt(pos) === '}' ) {
      // end of array
      open--;
      delimiters.pop();
    } else if ( input.charAt(pos) === ':' ) {
      //if( pos !== 0 ) {
        //throw Error('word definition must be at the begining !')
      //}
      open++;
      delimiters.push(':');
    } else if( open && delimiters[delimiters.length-1] === ':' && input.charAt(pos) === ';' ) {
      // end of definition
      open--;
      delimiters.pop();
    }
    result.push(input.charAt(pos++));
  }
};

var convert = function(input) {
  var convert_all_tokens;
  var convert_token = function(token) {
    if( token.charAt(0) === '"' && token.charAt(token.length-1) === '"' ) {
      return token.substring(1, token.length-1);
    } else if( token.charAt(0) === '[' && token.charAt(token.length-1) === ']' ) {
      return {quotation: convert_all_tokens(token.substring(1, token.length-1))};
    } else if( token.charAt(0) === '{' && token.charAt(token.length-1) === '}' ) {
      return convert_all_tokens(token.substring(1, token.length-1));
    } else if( token === 't' ) {
      return true;
    } else if( token === 'f' ) {
      return false;
    } else if( !isNaN(token) ) {
      return Number(token);
    } else if( ops[token] ) {
      return ops[token];
    } else if( dictionnary[token] ) {
      return dictionnary[token];
    }
  };

  convert_all_tokens = function(input) {
    var result = [];
    var next = 0;
    while ( next !== -1 ) {
      var token = next_token(input, next);
      if( token[0].length > 0 ) {
        if( token[0].charAt(0) === ':' && token[0].charAt(token[0].length-1) === ';' ) {
          var body = token[0].substring(1, token[0].length-1);
          var name = next_token(body);
          var ref = { reference: [] };
          dictionnary[name[0]] = ref;
          ref.reference = convert(body.substring(name[1], body.length-1));
        } else {
          var t = convert_token(token[0]);
          if( t !== undefined ) {
            result.push(t);
          } else {
            throw Error('token '+token[0]+' not found !');
          }
        }
      }
      next = token[1];
    }
    return result;
  };

  return convert_all_tokens(input);
};


var interpret_string = function(input, output) {
  interpret( convert(input), output );
};

var interpret_strings = function(array) {
  var i;
  for(i=0;i<array.length;i++) {
    try {
      interpret_string(array[i]);
    } catch(e) {
      console.error('Error '+i+': '+array[i]+' -> '+e.message);
    }
  }
};

var add_old_prompt_handlers = function(jqc) {
  var old = $('.jqconsole-old-prompt > span');
  old.find('span').off('mouseenter mouseleave');
  old.each(function() {
    var s = $(this).text();
    //$(this).text('');
    $(this).html(PS1);
    var txt = s.substring(PS1.length,s.length-1);
    $(this).append($('<span/>').text(txt +'\n'));
  });
  var spans = old.find('span');
  var handler = function() {
    jqc.SetPromptText($(this).text().trim());
  };
  spans.mouseenter(function(e) {
    $(e.target).addClass('selected');
    $(e.target).bind('click', handler);
  });
  spans.mouseleave(function(e) {
    $(e.target).removeClass('selected');
    $(e.target).unbind('click', handler);
  });
};

$(document).ready(function() {
  var jqc = $('#console').jqconsole(welcome+'\n\n', PS1);

  interpret_strings(prelude);
  interpret_strings(tests);

  var handler = function(command) {
    if( command ) {
      try {
        interpret_string(command, jqc);
        print_stack(jqc);
      } catch(e) {
        jqc.Write('ERROR: ' + e.message + '\n', 'jqconsole-error');
      }
    }
    add_old_prompt_handlers(jqc);
    jqc.Prompt(true, handler);
  };

  handler();
});
