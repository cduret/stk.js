var Objects = (function() {
  var to_string = function(o) {
    var obj_tostring = function(o) {
      var i, res = '{';
      for(i in o) {
        if( o.hasOwnProperty(i) ) {
          res += i+':'+to_string(o[i])+',';
        }
      }
      return res.substring(0, res.length-1)+'}';
    };
    var arr_tostring = function(o) {
      var i;
      var res = '[';
      for(i=0;i<o.length;i++) {
        if( i < (o.length-1) ) {
          res += to_string(o[i])+',';
        } else { res += to_string(o[i]); }
      }
      return res+']';
    };
    var atom_tostring = function(o) {
      if( typeof(o) === 'string' ) {
        return '"'+o+'"';
      } else {
        return ''+o;
      }
    };
    var fun_tostring = function(f) {
      return f.toString();
    };
    if( o instanceof Array ) {
      return arr_tostring(o);
    } else if( typeof(o) === 'function' ) {
      return fun_tostring(o);
    } else if( o instanceof Object ) {
      return obj_tostring(o);
    } else { return atom_tostring(o); }
  };

  var equals = function(o1, o2) {
    var prop_count = function(o) {
      var i, res = 0;
      for(i in o) {
        if( o.hasOwnProperty(i) ) { res++; }
      }
      return res;
    };
    var equals_aux = function(o1, o2) {
      var amap, i, new_status, p1, p2;
      if( o1 instanceof Array &&
          o2 instanceof Array ) {
        if( o1.length === o2.length ) {
          for(i=0;i<o1.length;i++) {
            new_status = equals_aux(o1[i], o2[i]);
            if(!new_status) {
              return false;
            }
          }
          return true;
        }
        return false;
      } else if( o1 instanceof Object && o2 instanceof Object ) {
        if( prop_count(o1) === prop_count(o2) ) {
          for(i in o1) {
            if( o1.hasOwnProperty(i) ) {
              p2 = o2[i];
              if( p2 === undefined ) {
                return false;
              } else {
                new_status = equals_aux(o1[i], p2);
                if( !new_status ) {
                  return false;
                }
              }
            }
          }
          return true;
        }
        return false;
      } else {
        return o1 === o2;
      }
    };
    return equals_aux(o1, o2);
  };

  var extend = function(from, to) {
    var result = {};
    var p;
    for(p in from) {
      if( from.hasOwnProperty(p) ) {
        result[p] = from[p];
      }
    }
    for(p in to) {
      if( to.hasOwnProperty(p) ) {
        result[p] = to[p];
      }
    }
    return result;
  };

  var merge = function() {
    var objs = Array.prototype.slice.call(arguments);

    return objs.reduce(Objects.extend, {});
  };

  return {
    to_string: to_string,
    equals: equals,
    extend: extend,
    merge: merge
  };
})();
