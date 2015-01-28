"use NOstrict";
/*
Copyright (C) 2013 Tony Mobily

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var declare = require('./declare.js');


// Define basic classes to play with


// Make sure uncaught errors are displayed
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

function l( v ){
  console.log( require( 'util' ).inspect( v, { depth: 10 } ) );
}

function getProtoChain( p ){
  var list = [];
  while( p = p.__proto__){
    if( p.constructor === Object ){
      list.push( "BASE" );
    } else {
      list.push( p.name );
    }
  }
  return list.reverse();
}

function compareProtoChain( o, list ){

  var p = getProtoChain( o );
  for( var i = 0, l = p.length; i < l; i ++ ){
    if( p[ i ] !== list[ i ] ) return false;
  }
  return true;
}

var tests = {

  "straight class declarations": function( test ){

    var toCheck = {
      A1: declare( Object, {
        method1: function( parameter ){
          return( "A1::method1() called, parameter: " + parameter );
        }
      }),
      A2: declare( Object, {
        method1: function( parameter ){
          return( "A2::method1() called, parameter: " + parameter );
        }
      })
    }

    for( var k in toCheck ){
      var C = toCheck[ k ];

      var o = new C();

      test.equal( typeof o.method1, 'function' );
      test.equal( typeof o.inherited, 'function' );
      test.equal( typeof o.inheritedAsync, 'function' );
      test.equal( typeof o.getInherited, 'function' );
      test.equal( typeof o.instanceOf, 'function' );
      test.equal( typeof C.extend, 'function' );
      //test.notEqual( typeof C.ActualConstructor, 'function' );

      test.ok( o instanceof C );
      test.equal( o.__proto__.__proto__.constructor, Object );
      test.equal( o.method1( 10 ),  k + "::method1() called, parameter: 10" );
      debugger;
    }
    test.done();

  },


  "straight class declaration with constructor": function( test ){

    var sentinel = '';
    var toCheck = {
      A1: declare( Object, {
        constructor: function( parameter ){
          sentinel = parameter;
        }
      }),
      A2: declare( Object, {
        constructor: function( parameter ){
          sentinel = parameter;
        }
      })
    }

    for( var k in toCheck ){
      var C = toCheck[ k ];

      var o = new C( k );

      test.equal( sentinel, k );
      //test.equal( typeof C.ActualConstructor, 'function' )

    }
    test.done();
  },

  "simple inheritance": function( test ){

    var sentinel1;
    var sentinel2;

    var A = declare( Object, {
      name: 'A',
      constructor: function( p ){
        sentinel1 += "1";
        sentinel2 += '' + p;
      },
      method1: function( parameter ){
        return "A::method1() called, parameter: " + parameter;
      },
      method2: function( parameter ){
        return "A::method2() called, parameter: " + parameter;
      },
    })

    var B = declare( A, {
      name: 'B',
      constructor: function( p ){
        sentinel1 += "2";
        sentinel2 += '' + p;
      },
      method1: function( parameter ){
        return "B::method1() called, parameter: " + parameter;
      }
    })

    var C = declare( B, { name: 'C' } );
    var D = declare( C, { name: 'D' } );
    var E = declare( D, { name: 'E' } );
    
    sentinel1 = '';
    sentinel2 = '';
    var a = new A( 'M' );
    test.ok( a instanceof A );

    test.equal( sentinel1, '1' );
    test.equal( sentinel2, 'M' );
    test.equal( a.method1( 10 ), "A::method1() called, parameter: 10" );
    test.equal( a.method2( 11 ), "A::method2() called, parameter: 11" );

    sentinel1 = '';
    sentinel2 = '';
    var b = new B( 'N' );
    test.ok( b instanceof A );
    test.ok( b instanceof B );
    test.equals( sentinel1, '12' );
    test.equals( sentinel2, 'NN' );
    test.ok( compareProtoChain( b, [ 'BASE', 'A', 'B' ] ) );
    test.equal( b.method1( 12 ), "B::method1() called, parameter: 12" );
    test.equal( b.method2( 13 ), "A::method2() called, parameter: 13" );

    sentinel1 = '';
    sentinel2 = '';
    var e = new E( 10 );
    test.ok( compareProtoChain( e, [ 'BASE', 'A', 'B', 'C', 'D', 'E' ] ) );
    test.ok( e instanceof A );
    test.ok( e instanceof B );
    test.ok( e instanceof C );
    test.ok( e instanceof D );
    test.ok( e instanceof E );

    test.done();
  },

  "straight inherited": function( test ){

    
    var A = declare( Object, {
      name: 'A',
      method1: function( parameter ){
        return "A::method1() called, parameter: " + parameter;
      },
      method2: function( parameter ){
        return "A::method2() called, parameter: " + parameter;
      },
    })

    var B = declare( A, {
      name: 'B',
      method1: function f( parameter ){
        return this.inherited( f, arguments ) + " " + "B::method1() called, parameter: " + parameter;
      }
    })
    var C = declare( B, {
      name: 'C',
      method1: function f( parameter ){
        return this.inherited( f, arguments ) + " " + "C::method1() called, parameter: " + parameter;
      }
    })

    var a = new A();
    var b = new B();
    var c = new C();

    test.equal( a.method2( 10 ), "A::method2() called, parameter: 10" ) ;
    test.equal( b.method2( 11 ), "A::method2() called, parameter: 11" ) ;
    test.equal( c.method2( 12 ), "A::method2() called, parameter: 12" ) ;

    test.equal( a.method1( 13 ), "A::method1() called, parameter: 13" ) ;
    test.equal( b.method1( 14 ), "A::method1() called, parameter: 14 B::method1() called, parameter: 14" ) ;
    test.equal( c.method1( 15 ), "A::method1() called, parameter: 15 B::method1() called, parameter: 15 C::method1() called, parameter: 15" ) ;

    test.done();
  },

  "async inherited": function( test ){

    var A = declare( Object, {
      name: 'A',
      method1: function( parameter, cb ){
        cb( null, "A::method1() called, parameter: " + parameter );
      },
      method2: function( parameter, cb ){

        cb( null, "A::method2() called, parameter: " + parameter );
      },
    });

    var B = declare( A, {
      name: 'B',
      method1: function f( parameter, cb ){
        this.inheritedAsync( f, arguments, function( err, result ){
          test.ifError( err );

          cb( null, result + " " + "B::method1() called, parameter: " + parameter )
        })
      }
    });
    var C = declare( B, {
      name: 'C',
      method1: function f( parameter, cb ){
        this.inheritedAsync( f, arguments, function( err, result ){
          test.ifError( err );

          cb( null, result + " " + "C::method1() called, parameter: " + parameter )          
        });
      }
    });

    var a = new A();
    var b = new B();
    var c = new C();

    a.method2( 10, function( err, result ){
      test.ifError( err );
      test.equal( result, "A::method2() called, parameter: 10" ) ;

      b.method2( 11, function( err, result ){
        test.ifError( err );
        test.equal( result, "A::method2() called, parameter: 11" ) ;

        c.method2( 12, function( err, result ){
          test.ifError( err );
          test.equal( result, "A::method2() called, parameter: 12" ) ;

          a.method1( 13, function( err, result ){
            test.ifError( err );
            test.equal( result, "A::method1() called, parameter: 13" ) ;

            b.method1( 14, function( err, result ){
              test.ifError( err );
              test.equal( result, "A::method1() called, parameter: 14 B::method1() called, parameter: 14" ) ;

              c.method1( 15, function( err, result ){
                test.ifError( err );
                test.equal( result, "A::method1() called, parameter: 15 B::method1() called, parameter: 15 C::method1() called, parameter: 15" ) ;

                test.done();
              });
            });
          });
        });
      });
    });

  },

  "inheriting from pure javascript constructors": function( test ){

   var sentinel1 = 0, sentinel2 = 0, sentinel3 = 0;

   var A = declare( Object, {

      name: 'A',
      
      method1: function( parameter ){
        return "A::method1() called, parameter: " + parameter;
      },
      method2: function( parameter ){
        return "A::method2() called, parameter: " + parameter;
      },  
      constructor: function( parameter ){
        sentinel1 ++;
      }
    });
    A.classMethod = function(){
      return "This is A's method";
    }

    var B = function(){
      sentinel1 ++;
    }
    B.prototype = Object.create( A.prototype, {
      constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    B.prototype.name = "B";

    // Nice SimpleDeclare class
    var C = declare( B, {

      name: 'C',

      constructor: function( parameter ){
        sentinel1 ++;
      },
      method1: function f( parameter ){
        return this.inherited( f, arguments ) + " " + "C::method1() called, parameter: " + parameter;
      },

    })

    var sentinel1 = 0;
    var a = new A();
    test.equal( sentinel1, 1 );
    
    var sentinel1 = 0;
    var c = new C();
    test.equal( sentinel1, 3 );

    test.equal( c.method1( 10 ), "A::method1() called, parameter: 10 C::method1() called, parameter: 10" ) ;
    
    test.done();
  },

  "extend -- single inheritance": function( test ){

    var sentinel1;
    var sentinel2;

    var A = declare( Object, {
      name: 'A',
      method1: function( parameter ){
        return "A::method1() called, parameter: " + parameter;
      },
      method2: function( parameter ){
        return "A::method2() called, parameter: " + parameter;
      },
    })

    var B = A.extend( {
      name: 'B',
      method1: function( parameter ){
        return "B::method1() called, parameter: " + parameter;
      }
    })

    var C = B.extend( { name: 'C' } );
    var D = C.extend( { name: 'D' } );
    var E = D.extend( { name: 'E' } );
    
    var a = new A();
    test.ok( a instanceof A );

    test.equal( a.method1( 10 ), "A::method1() called, parameter: 10" );
    test.equal( a.method2( 11 ), "A::method2() called, parameter: 11" );

    var b = new B();
    test.ok( b instanceof A );
    test.ok( b instanceof B );
    test.ok( compareProtoChain( b, [ 'BASE', 'A', 'B' ] ) );
    test.equal( b.method1( 12 ), "B::method1() called, parameter: 12" );
    test.equal( b.method2( 13 ), "A::method2() called, parameter: 13" );

    var e = new E( 10 );
    test.ok( compareProtoChain( e, [ 'BASE', 'A', 'B', 'C', 'D', 'E' ] ) );
    test.ok( e instanceof A );
    test.ok( e instanceof B );
    test.ok( e instanceof C );
    test.ok( e instanceof D );
    test.ok( e instanceof E );

    test.done();
  },

  "mutiple inheritance": function( test ){

    var A1 = declare( Object, {
      name: 'A1',
        method1: function( parameter ){
          return " A1 " + parameter;
        },
      });

    var A2 = declare( Object, {
      name: 'A2',
      method1: function f( parameter ){
        return ( this.inherited( f, arguments ) || '' ) + ' ' + "A2 " + parameter;
      },
    });

    var A3 = declare( Object, {
      name: 'A3',
      method1: function f( parameter ){
        return ( this.inherited( f, arguments ) || '' ) + ' ' + "A3 " + parameter;
      },
    });

    var AA = declare( [ A1, A2, A3 ], {
      name: 'AA',
      method1: function f( parameter ){
        return ( this.inherited( f, arguments ) || '' ) + ' ' + "AA " + parameter;
      },
         
    })

    var a1 = new A1();
    test.equal( a1.method1( 10 ), ' A1 10')

    var a2 = new A2();
    test.equal( a2.method1( 11 ), ' A2 11')

    var a3 = new A3();
    test.equal( a3.method1( 12 ), ' A3 12')

    var aa = new AA();
    test.equal( aa.method1( 13 ), ' A1 13 A2 13 A3 13 AA 13' );

    test.equal( a1 instanceof A1, true );
    test.equal( a2 instanceof A2, true );
    test.equal( a3 instanceof A3, true );

    test.equal( aa instanceof A1, false );
    test.equal( aa instanceof A2, false );
    test.equal( aa instanceof A3, false );
    test.equal( aa instanceof AA, true );

    test.equal( aa.instanceOf( A1 ), true );
    test.equal( aa.instanceOf( A2 ), true );
    test.equal( aa.instanceOf( A3 ), true );
    test.equal( aa.instanceOf( AA ), true );
    
    test.ok( compareProtoChain( aa, [ 'BASE', 'A1', 'A2', 'A3', 'AA' ] ) );

    test.done();
  },

  "multiple inheritance -- repeated constructors": function( test ){

    var A1 = declare( Object, { name: 'A1' } );
    var A2 = declare( Object, { name: 'A2' } );
    var A3 = declare( Object, { name: 'A3' } );
    var A4 = declare( Object, { name: 'A4' } );
    var A5 = declare( Object, { name: 'A5' } );
    
    var A = declare( [ A1, A2, A2, A3, A4, A5, A5, A1, A2 ], { name: 'A' } );
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A3', 'A4', 'A5', 'A' ] ) );
    
    var A = declare( [ A1, A1, A1 ], { name: 'A' } );
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A' ] ) );
    
    var A = declare( [ A1, A1, A1, A2, A1 ], { name: 'A' } );
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A' ] ) );
    
    var A12 = declare( [ A1, A2 ], { name: 'A12' } );
    test.ok( compareProtoChain( new A12(), [ 'BASE', 'A1', 'A2', 'A12' ] ) );
    
    var A234 = declare( [ A2, A3, A4 ], { name: 'A234' } );
    test.ok( compareProtoChain( new A234(), [ 'BASE', 'A2', 'A3', 'A4', 'A234' ] ) );

    // A2 gets deleted from A234 as it was already added by A12
    var A = declare( [ A12, A234 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A12', 'A3', 'A4', 'A234', 'A' ] ) );

    // instanceOf works with multiple inheritance    
    test.ok( (new A()).instanceOf( A1 ) );
    test.ok( (new A()).instanceOf( A2 ) );
    test.ok( (new A()).instanceOf( A12 ) );
        
    // A12 doesn't add A2 because it was already added
    var A = declare( [ A2, A12, A234 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A2', 'A1', 'A12', 'A3', 'A4', 'A234', 'A' ] ) );
    
    // A12 doesn't add A2, A234 doesn't add A4, as they were defined beforehand
    var A = declare( [ A2, A4, A12, A234 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A2', 'A4', 'A1', 'A12', 'A3', 'A234', 'A' ] ) );
    
    // Trailing constructors ignored as already added
    var A = declare( [ A12, A234, A1, A4 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A12', 'A3', 'A4', 'A234', 'A' ] ) );
    
    // Trailing constructors ignored as already added, plus a new trailing one
    var A = declare( [ A12, A234, A1, A4, A5 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A12', 'A3', 'A4', 'A234', 'A5', 'A' ] ) );
    
    test.done();
  },

  "extend -- multiple inheritance": function( test ){

    var A1 = declare( Object, { name: 'A1' } );
    var A2 = declare( Object, { name: 'A2' } );
    var A3 = declare( Object, { name: 'A3' } );
    var A4 = declare( Object, { name: 'A4' } );
    
    var A = A1.extend( [ A2, A3 ], { name: 'A' });
    test.ok( compareProtoChain( new A(), [ 'BASE', 'A1', 'A2', 'A3', 'A' ] ) );
    
    test.done();
  },

};
  
// Copy tests over to exports
for( var i in tests ){
  exports[ i ] = tests[ i ];
}



