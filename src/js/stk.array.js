var PS1 = '(scratchpad) ';

var welcome = ['        _____________    ',
  '  _____\\__    ___/  | __',
 ' /  ___/ |    |  |  |/ /',
 ' \\___ \\  |    |  |    < ',
' /____ > |____|  |__|_ \\',
     ' \\/              \\/'].join('\n');

var stack = [];

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

var add = function() {
  var a = stack.pop();
  var b = stack.pop();
  stack.push( a + b );
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

var elt_to_s = function(e) {
  var obj_to_s = function(o) {
    var p, result = 'T{ ';
    for(p in o) {
      if( o.hasOwnProperty(p) ) {
        if( p === 'type' ) {
          result += o[p].substring(1, o[p].length-1) + ' ';
        } else {
          result += elt_to_s(o[p]) + ' ';
        }
      }
    }
    return result+'}';
  };
  if( e instanceof Array ) {
    return '['+e.map(elt_to_s).join(' ')+']';
  } else if( e.type ) {
    return obj_to_s(e);
  } else if( typeof(e) === 'string' ) {
    return '"'+e+'"';
  } else {
    return e;
  }
};

var print_stack = function(output) {
  var i;
  if( stack.length > 0 ) {
    output.Write('Data stack ---\n', 'jqconsole-output');
    for(i=0;i<stack.length;i++) {
      output.Write(elt_to_s(stack[i])+'\n', 'jqconsole-output');
    }
  }
};

var ops = {
  drop: function() {
    pop();
  },
  clear: function() {
    stack = [];
  },
  '+': add,
  add: add,
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
  length: function() {
    var a = pop();
    if( !(a instanceof Array) ) {
      throw Error('elt is not a sequence !');
    }
    push( a.length );
  },
  succ: function() {
    var a = pop();
    if( typeof(a) !== 'number' ) {
      throw Error('elt is not a number !');
    }
    push( ++a );
  },
  '.': function(output) {
    var a = pop();
    output.Write(elt_to_s(a)+'\n', 'jqconsole-output');
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
  }
};

var mk_object = function(type, value) {
  return { type: type, value: value };
};

var interpret = function(input, output) {
  var tokens = input.split(' ');
  var a,b,i=0;
  var array, arrays = [];
  while(i<tokens.length) {
    if(tokens[i].charAt(0) === '"') {
      if( array ) {
        array.push(tokens[i].substring(1, tokens[i].length-1));
      } else {
        push(tokens[i].substring(1, tokens[i].length-1));
      }
    } else if( tokens[i] === 'true' || tokens[i] === 'false' ) {
      if( array ) {
        array.push(tokens[i]==='true');
      } else {
        push(tokens[i]==='true');
      }
    } else if( tokens[i] === '[' ) {
      if( arrays.length === 0 ) {
        array = [];
        arrays.push(array);
      } else {
        array = [];
        arrays[arrays.length-1].push(array);
        arrays.push(array);
      }
    } else if( tokens[i] === ']' ) {
      if( arrays.length > 1 ) {
        arrays.pop();
        array = arrays[arrays.length-1];
      } else {
        push(arrays.pop());
        array = undefined;
      }
    } else if( tokens[i].charAt(0) === '<' && tokens[i].charAt(tokens[i].length-1) === '>') {
      if( array ) {
        a = array.pop();
        array.push( mk_object(tokens[i], a) );
      } else {
        a = pop();
        push( mk_object(tokens[i], a) );
      }
    } else if( !isNaN(tokens[i]) ) {
      if( array ) {
        array.push(Number(tokens[i]));
      } else {
        push(Number(tokens[i]));
      }
    } else if( ops[tokens[i]] ) {
      ops[tokens[i]](output);
    } else {
      throw Error(tokens[i]+' undefined !');
    }
    i++;
  }
  print_stack(output);
};

var add_old_prompt_handlers = function(jqc) {
  var old = $('.jqconsole-old-prompt > span');
  old.find('span').off('mouseenter mouseleave');
  old.each(function() {
    var s = $(this).text();
    //$(this).text('');
    $(this).html(PS1);
    var txt = s.substring(PS1.length,s.length-1);
    $(this).append($('<span/>').append(txt +'\n'));
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

  var handler = function(command) {
    if( command ) {
      try {
        interpret(command, jqc);
      } catch(e) {
        jqc.Write('ERROR: ' + e.message + '\n', 'jqconsole-error');
      }
    }
    add_old_prompt_handlers(jqc);
    jqc.Prompt(true, handler);
  };

  handler();
});
