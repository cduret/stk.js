/* global Parser */
/*jshint -W083 */
var Stk = (function() {
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
                '5 [1 =] [] [dup pred] [*] linrec 120 = assert',
                '5 [1] [*] primrec 120 = assert',
                '12 [small] [] [pred dup pred] [+] binrec 144 = assert'
               ];

  var stack = [];
  var dictionnary = {};
  var words;

  var push = function(e) {
    stack.push(e);
  };

  var pop = function() {
    if( stack.length === 0 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
    var e = stack.pop();
    return e;
  };

  var peek = function() {
    if( stack.length === 0 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
    return stack[stack.length-1];
  };

  var add = function() {
    if( stack.length < 2 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
    var a = stack.pop();
    var b = stack.pop();
    stack.push( a + b );
  };

  var sub = function() {
    if( stack.length < 2 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
    var b = stack.pop();
    var a = stack.pop();
    stack.push( a - b );
  };

  var mul = function() {
    if( stack.length < 2 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
    var a = stack.pop();
    var b = stack.pop();
    stack.push( a * b );
  };

  var div = function() {
    if( stack.length < 2 ) {
      throw {
        runtime_error: {
          message: 'Stack underflow'
        }
      };
    }
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

  var interpret = function(fragments, io) {
    if( !(fragments instanceof Array) ) {
      return interpret([fragments], io);
    }

    var i;
    for(i=0;i<fragments.length;i++) {
      if( typeof(fragments[i]) === 'function' ) {
        fragments[i](io);
      } else if( fragments[i].reference ) {
        interpret(fragments[i].reference, io);
      } else {
        push ( fragments[i] );
      }
    }
  };

  var word_to_string = function(e) {
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
      return ['['].concat(e.quotation.map(word_to_string)).concat(']').join(' ');
    } else if( e.reference ) {
      return find_name(dictionnary, e);
    } else if( e.tuple ) {
      return 'T{ ' + e.tuple + ' ' + Object.getOwnPropertyNames(e.fields)
        .map(function(p) { return ''+word_to_string(e.fields[p]); }).join(' ')+' }';
    } else if( e instanceof Array ) {
      return '{ '+e.map(word_to_string).join(' ')+' }';
    } else if( (typeof(e) === 'string') ) {
      return '"'+e+'"';
    } else if( (typeof(e) === 'function') ) {
      return find_name(words, e);
    } else if( (typeof(e) === 'boolean') ) {
      return e?'t':'f';
    } else {
      return e;
    }
  };

  words = {
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
        throw {
          runtime_error: {
            message: 'boolean or number are required !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'boolean or number are required !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'boolean or number are required !'
          }
        };
      }
    },
    not: function() {
      var a = pop();
      if( typeof(a) === 'boolean' ) {
        push( !a );
      } else {
        throw {
          runtime_error: {
            message: 'boolean value is required !'
          }
        };
      }
    },
    '>': function() {
      var b = pop();
      var a = pop();
      if( typeof(a) === 'number' && typeof(b) === 'number' ||
          typeof(a) === 'string' && typeof(b) === 'string' ) {
        push( a > b );
      } else {
        throw {
          runtime_error: {
            message: 'number values are required !'
          }
        };
      }
    },
    '>=': function() {
      var b = pop();
      var a = pop();
      if( typeof(a) === 'number' && typeof(b) === 'number' ||
          typeof(a) === 'string' && typeof(b) === 'string' ) {
        push( a >= b );
      } else {
        throw {
          runtime_error: {
            message: 'number values are required !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'number values are required !'
          }
        };
      }
    },
    '<=': function() {
      var b = pop();
      var a = pop();
      if( typeof(a) === 'number' && typeof(b) === 'number' ||
          typeof(a) === 'string' && typeof(b) === 'string' ) {
        push( a <= b );
      } else {
        throw {
          runtime_error: {
            message: 'number values are required !'
          }
        };
      }
    },
    '<': function() {
      var b = pop();
      var a = pop();
      if( typeof(a) === 'number' && typeof(b) === 'number' ||
          typeof(a) === 'string' && typeof(b) === 'string' ) {
        push( a < b );
      } else {
        throw {
          runtime_error: {
            message: 'number values are required !'
          }
        };
      }
    },
    choice: function() {
      var f = pop();
      var t = pop();
      var b = pop();
      if( typeof(b) !== 'boolean' ) {
        throw {
          runtime_error: {
            message: 'elt is not a boolean !'
          }
        };
      }
      if( b ) {
        push( t );
      } else {
        push( f );
      }
    },
    ifte: function(io) {
      var f = pop();
      var t = pop();
      var q = pop();
      var stack_backup = stack.slice();

      if( !f.quotation || !t.quotation || !q.quotation  ) {
        throw {
          runtime_error: {
            message: 'elts must be quotations !'
          }
        };
      }
      push( q );
      words.i(io);
      var b = pop();

      if( typeof(b) !== 'boolean' ) {
        throw {
          runtime_error: {
            message: 'return value must be a boolean !'
          }
        };
      }

      stack = stack_backup;

      if( b ) {
        push( t );
      } else {
        push( f );
      }

      words.i(io);
    },
    assert: function() {
      var a = pop();
      if( typeof(a) !== 'boolean' ) {
        throw {
          runtime_error: {
            message: 'value is not of type boolean !'
          }
        };
      }

      if( !a  ) {
        throw {
          runtime_error: {
            message: 'Assert Error !'
          }
        };
      }
    },
    length: function() {
      var a = pop();
      if( !is_sequence(a) ) {
        throw {
          runtime_error: {
            message: 'elt is not a sequence !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'elt should not be a boolean !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'elt is not a number !'
          }
        };
      }
      push( ++a );
    },
    pred: function() {
      var a = pop();
      if( typeof(a) !== 'number' ) {
        throw {
          runtime_error: {
            message: 'elt is not a number !'
          }
        };
      }
      push( --a );
    },
    '.': function(io) {
      var a = pop();
      io.write(word_to_string(a)+'\n');
    },
    '.s': function(io) {
      var i;
      if( stack.length > 0 ) {
        io.write('Data stack ---\n');
        for(i=0;i<stack.length;i++) {
          io.write(word_to_string(stack[i])+'\n');
        }
      }
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
    dip: function(io) {
      var q = pop();
      var x = pop();
      if( !q.quotation ) {
        throw {
          runtime_error: {
            message: 'elt is not a quotation !'
          }
        };
      }
      interpret(q.quotation, io);
      push(x);
    },
    i: function(io) {
      var q = pop();
      if( !q.quotation ) {
        throw {
          runtime_error: {
            message: 'elt is not a quotation !'
          }
        };
      }
      interpret(q.quotation, io);
    },
    nth: function(io) {
      var q = pop();
      var n = pop();
      if( typeof(n) !== 'number' ) {
        throw {
          runtime_error: {
            message: 'index is not a number !'
          }
        };
      }
      if( !is_sequence(q) ) {
        throw {
          runtime_error: {
            message: 'elt is not a sequence !'
          }
        };
      }
      if( q.quotation ) {
        if( n < q.quotation.length ) {
          interpret(q.quotation[n], io);
        } else {
          throw {
            runtime_error: {
              message: 'index out of range !'
            }
          };
        }
      } else if( q instanceof Array ) {
        if( n < q.length ) {
          push( q[n] );
        } else {
          throw {
            runtime_error: {
              message: 'index out of range !'
            }
          };
        }
      } else if( typeof(q) === 'string' ) {
        if( n < q.length ) {
          push( q.charAt(n) );
        } else {
          throw {
            runtime_error: {
              message: 'index out of range !'
            }
          };
        }
      }
    },
    concat: function() {
      var b = pop();
      var a = pop();
      if( !is_sequence(a) || !is_sequence(b) ) {
        throw {
          runtime_error: {
            message: 'elts should be sequences !'
          }
        };
      }
      if( a.quotation && b.quotation ) {
        var result = a.quotation.concat(b.quotation);
        push({ quotation: result });
      } else if( a instanceof Array && b instanceof Array ) {
        push(a.concat(b));
      } else if( typeof(a) === 'string' && typeof(b) === 'string' ) {
        push(a.concat(b));
      } else {
        throw {
          runtime_error: {
            message: 'elts should have same type !'
          }
        };
      }
    },
    enconcat: function() {
      var t = pop();
      var s = pop();
      var x = pop();
      if( !is_sequence(s) || !is_sequence(t) ) {
        throw {
          runtime_error: {
            message: 'elts should be sequences !'
          }
        };
      }
      if( t.quotation && s.quotation ) {
        var result = s.quotation.concat([x].concat(t.quotation));
        push({ quotation: result });
      } else if( s instanceof Array && t instanceof Array ) {
        push(s.concat([x].concat(t)));
      //} else if( typeof(a) === 'string' && typeof(b) === 'string' ) {// what is a char ?
        //push(a.concat(b));
      } else {
        throw {
          runtime_error: {
            message: 'elts should have same type !'
          }
        };
      }
    },
    cons: function() { // faire cons pour un string
      var b = pop();
      var a = pop();
      if( !(b instanceof Array) && !b.quotation ) {
        throw {
          runtime_error: {
            message: 'second elt should be a quotation or an array !'
          }
        };
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
        throw {
          runtime_error: {
            message: 'second elt should be a quotation or an array !'
          }
        };
      }
      if( b.quotation ) {
        var result = [a].concat(b.quotation);
        push({ quotation: result });
      } else if( b instanceof Array ) {
        push([a].concat(b));
      }
    },
    uncons: function(io) { // faire uncons pour un string
      var first, rest, a = pop();
      if( !(a instanceof Array) && !a.quotation ) {
        throw {
          runtime_error: {
            message: 'second elt should be a quotation or an array !'
          }
        };
      }
      if( a.quotation ) {
        if( a.quotation.length < 1 ) {
          throw {
            runtime_error: {
              message: 'uncons on empty quotation !'
            }
          };
        }
        first = a.quotation[0];
        rest = a.quotation.slice(1);
        interpret(first, io);
        push({ quotation: rest });
      } else if( a instanceof Array ) {
        if( a.length < 1 ) {
          throw {
            runtime_error: {
              message: 'uncons on empty array !'
            }
          };
        }
        first = a[0];
        push( first );
        push( a.slice(1) );
      }
    },
    first: function(io) { // faire first pour un string
      var first, a = pop();
      if( !(a instanceof Array) && !a.quotation ) {
        throw {
          runtime_error: {
            message: 'elt should be a quotation or an array !'
          }
        };
      }
      if( a.quotation ) {
        if( a.quotation.length < 1 ) {
          throw {
            runtime_error: {
              message: 'first on empty quotation !'
            }
          };
        }
        first = a.quotation[0];
        interpret(first, io);
      } else if( a instanceof Array ) {
        if( a.length < 1 ) {
          throw {
            runtime_error: {
              message: 'first on empty array !'
            }
          };
        }
        first = a[0];
        push( first );
      }
    }, // faire rest
    map : function(io) {
      var i;
      var q = pop();
      var a = pop();
      if( !(a instanceof Array) && !a.quotation ) {
        throw {
          runtime_error: {
            message: 'first elt should be an array or a quotation !'
          }
        };
      }
      if( !q.quotation ) {
        throw {
          runtime_error: {
            message: 'second elt should be a quotation !'
          }
        };
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
        words.i(io);
        result.push(pop());
      }
      if( a instanceof Array ) {
        push(result);
      } else {
        push({quotation: result});
      }
    },
    fold : function(io) {
      var i;
      var q = pop();
      var v0 = pop();
      var a = pop();
      /*if( (v0 instanceof Array) || v0.quotation ) {
        throw {
          runtime_error: {
            message: 'v0 must be a primitive value !'
          }
        };
      }*/
      if( !(a instanceof Array) || !q.quotation ) {
        throw {
          runtime_error: {
            message: 'elts should be an array and a quotation !'
          }
        };
      }
      var v = v0;
      for(i=0;i<a.length;i++) {
        push(v);
        push(a[i]);
        push(q);
        words.i(io);
        v = pop();
      }
      push(v);
    },
    ifnumber: function(io) {
      var fq = pop();
      var tq = pop();
      var a = pop();

      if( !fq.quotation || !tq.quotation ) {
        throw {
          runtime_error: {
            message: 'elts must quotations !'
          }
        };
      }

      if( (a instanceof Array) || a.quotation ) {
        throw {
          runtime_error: {
            message: 'elt must be a primitive value !'
          }
        };
      }

      push( a );

      if( typeof(a) === 'number'  ) {
        push( tq );
      } else {
        push( fq );
      }
      words.i(io);
    },
    primrec: function(io) {
      var qc = pop();
      var qi = pop();
      var x = peek();

      if( !qc.quotation || !qi.quotation ) {
        throw {
          runtime_error: {
            message: 'two elts must be a quotation !'
          }
        };
      }

      if( typeof(x) !== 'number' ) {
        throw {
          runtime_error: {
            message: 'first element must be a number !'
          }
        };
      }

      while(x>0) {
        x = x - 1;
        if(x === 0) {
          push(qi);
          words.i(io);
        } else {
          push( x );
        }
        push(qc);
        words.i(io);
      }
    },
    linrec: function(io) {
      var qr2 = pop();
      var qr1 = pop();
      var qt = pop();
      var qp = pop();
      if( !qr2.quotation || !qr1.quotation || !qt.quotation || !qp.quotation ) {
        throw {
          runtime_error: {
            message: 'all elts must be a quotation !'
          }
        };
      }

      var calls = [];
      calls.push({stage:0});
      while(calls.length>0) {
        var cur = calls.pop();
        switch(cur.stage) {
          case 0: {
              words.dup();
              push(qp);
              words.i(io);
              var b = pop();
              if( typeof(b) !== 'boolean' ) {
                throw {
                  runtime_error: {
                    message: 'result of first quotation must be a boolean !'
                  }
                };
              }
              if( b ) {
                push(qt);
                words.i(io);
              } else {
                push(qr1);
                words.i(io);
                calls.push({stage:1});
                calls.push({stage:0});
              }
            }
            break;
          case 1: {
              push(qr2);
              words.i(io);
            }
            break;
        }
      }
    },
    binrec: function(io) {
      var qr2 = pop();
      var qr1 = pop();
      var qt = pop();
      var qp = pop();
      if( !qr2.quotation || !qr1.quotation || !qt.quotation || !qp.quotation ) {
        throw {
          runtime_error: {
            message: 'all elts must be a quotation !'
          }
        };
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
              words.dup();
              push(qp);
              words.i(io);
              var b = pop();
              if( typeof(b) !== 'boolean' ) {
                throw {
                  runtime_error: {
                    message: 'result of first quotation must be a boolean !'
                  }
                };
              }
              if( b ) {
                push(qt);
                words.i(io);
                result = pop();
                continue;
              } else {
                push(qr1);
                words.i(io);
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
              words.i(io);
              result = pop();
              continue;
            }
            break;
        }
      }
      push(result);
    }
  };

  var interpret_ast = function(program) {
    var a, i, fragments = [];
    var set_property = function(o, f) {
      return Object.defineProperty(o, f.identifier, {enumerable: true, writable: true});
    };
    for(i=0;i<program.length;i++) {
      a = program[i];
      if( a.definition ) {
        var ref = {reference: []};
        dictionnary[ a.definition.identifier ] = ref;
        ref.reference = interpret_ast(a.body);
      //} else if( a.use ) {
      } else if( a.tuple ) {
        // ctor
        dictionnary['<'+a.tuple.identifier+'>'] = (function(a) {
          return function() {
            push({
              tuple: a.tuple.identifier,
              fields: a.fields.reduce(set_property, {})
            });
          };
        })(a);
        // accessors
        var j;
        for(j=0;j<a.fields.length;j++) {
          dictionnary['>>'+a.fields[j].identifier] = (function(a, j) {
            return function() {
              var elt = pop();
              var struct = pop();

              if( !struct.tuple ) {
                throw {
                  runtime_error: {
                    message: 'first argument is not a tuple !'
                  }
                };
              } else if( struct.tuple !== a.tuple.identifier ) {
                throw {
                  runtime_error: {
                    message: 'tuple mismatch error !'
                  }
                };
              }
              struct.fields[a.fields[j].identifier] = elt;

              push(struct);
            };
          })(a, j);
        }
        for(j=0;j<a.fields.length;j++) {
          dictionnary[a.fields[j].identifier+'>>'] = (function(a, j) {
            return function() {
              var struct = pop();

              if( !struct.tuple ) {
                throw {
                  runtime_error: {
                    message: 'first argument is not a tuple !'
                  }
                };
              } else if( struct.tuple !== a.tuple.identifier ) {
                throw {
                  runtime_error: {
                    message: 'tuple mismatch error !'
                  }
                };
              }

              push( struct.fields[a.fields[j].identifier] );
            };
          })(a, j);
        }
      } else if( a.string !== undefined ) {
        fragments.push(a.string);
      } else if( a.number !== undefined ) {
        fragments.push(a.number);
      } else if( a.array ) {
        fragments.push( interpret_ast(a.array) );
      } else if( a.quotation ) {
        fragments.push( {quotation: interpret_ast(a.quotation)} );
      } else if( a.identifier ) {
        if( a.identifier === 't' ) {
          fragments.push( true );
        } else if( a.identifier === 'f' ) {
          fragments.push( false );
        } else if( words[a.identifier] ) {
          fragments.push( words[a.identifier] );
        } else if( dictionnary[a.identifier] ) {
          fragments.push( dictionnary[a.identifier] ) ;
        } else {
          throw {
            runtime_error: {
              message: 'token '+a.identifier+' not found !'
            }
          };
        }
      }
    }
    return fragments;
  };

  var interpret_string = function(code, io) {
    //interpret( lexer(code), io );
    var find_token = function(token) {
      var i, j, line = 0, col = 0;
      for(i=0;i<code.length-token.length+1;i++) {
        var found = true;
        for(j=0;j<token.length;j++) {
          if( code.charAt(j+i) !== '\n' ) {
            found = found && code.charAt(j+i) === token[j];
          } else {
            found = false;
            break;
          }
        }
        if( !found ) {
          if( code.charAt(i) === '\n' ) {
            line++;
            col = 0;
          } else {
            col++;
          }
        } else {
          return {line: line, col: col};
        }
      }
    };

    var result = Parser.parse(code);

    try {
      interpret( interpret_ast(result.program), io );
    } catch(e) {
      if(e.runtime_error) {
        var m = /^token (.+) not found !$/.exec(e.runtime_error.message);
        if( m !== null && m.length > 1 ) {
          var pos = find_token(m[1]);
          if( pos ) {
            throw {
              resolution_error: {
                row: pos.line,
                col: pos.col,
                token: m[1],
                message: e.runtime_error.message
              }
            };
          }
        }
      }
      throw e;
    }
  };

  var test;
  try {
    for(test=0;test<tests.length;test++) {
      interpret_string(tests[test]);
    }
  } catch(e) {
    var m = e.syntax_error?e.syntax_error.message:e.parse_error?e.parse_error.message:e.runtime_error?e.runtime_error.message:undefined;
    if( m ) {
      console.error('test['+test+']: '+m);
    } else {
      console.error('test['+test+']: unknown error ! ('+e+')');
    }
  }

  return {
    stack: function() { return stack; },
    dictionnary: function() { return dictionnary; },
    print_stack: words['.s'],
    words: words,
    word_to_string: word_to_string,
    interpret: interpret_string
  };

})();
