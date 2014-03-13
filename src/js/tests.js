/* global Objects */
var Tests = (function() {
  var mk_test = function(proto, index) {
    var to_string = function(f) {
      return f.toString().replace(/[\n\r]/g, '');
    };
    var name = (proto.name !== undefined)?proto.name:'test_'+index;

    if( typeof(proto.body) !== 'function' ) {
      console.error('test '+name+' discarded.. Must be lazy !');
      return null;
    }
    
    // for Function ctor
    /*var test_fn = '('+to_string(proto.body)+')()';
    var expected = typeof(proto.expected) === 'function'? // expected must be lazy when new classes
                    '('+to_string(proto.expected)+')()':  // are instanciated otherwise
                    Objects.to_string(proto.expected);    // the instanceof does not work..
    var test_body = 'try { return Tests.assert_equals("'+name+'", '+
                      test_fn+', '+
                      expected+'); } catch(e) { if(e.stack) { console.error("Exception raised during '+name+' -> "+e.stack); } else { console.error("Exception raised during '+name+' -> "+e); } }';
    return new Function(test_body);*/

    // for eval
    var proto_orig = 'tests['+index+']';
    var test_fn = proto_orig+'.body()';
    var expected = typeof(proto.expected) === 'function'?proto_orig+'.expected()':proto_orig+'.expected';
    var test_body = 'try { Tests.assert_equals("'+name+'", '+
                      test_fn+', '+
                      expected+'); } catch(e) { console.error("Exception raised during '+name+' -> "+e); }';
    return test_body;
  };

  var assert_equals = function(test, result, expected) {
    try {
      if(! Objects.equals(result, expected) ) {
        console.error('ERROR : '+test+' -> '+Objects.to_string(result)+ ' != '+ Objects.to_string(expected));
        return false;
      }
    } catch(e) {
      console.error('EXCEPTION : '+test+' -> '+Objects.to_string(result)+ ' != '+ Objects.to_string(expected));
      console.error(e);
      return false;
    }
    return true;
  };

  var assert_all = function(name,tests, n) {
    // second arguments should be named tests
    // see eval scope..
    var count = (n === undefined)?Number.MAX_VALUE:n;
    var result = tests.slice(0, count).map(mk_test).reduce(function(acc, f) {
      if( acc && f !== null ) {
        //return f();
        return eval(f);
      } else {
        return false;
      }
    }, true);

    if( result ) {
      var nb_tests = (n<tests.length)?n:tests.length;
      console.log(name+' : ' + nb_tests + ' tests passed..');
    } else {
      console.log(name+' tests failed !');
    }
  };

  return {
    assert_equals: assert_equals,
    assert_all: assert_all
  };
})();
