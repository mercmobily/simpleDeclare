"use strict";
/*
Copyright (C) 2013 Tony Mobily

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var declare = require('./declare.js');


// Define basic classes to play with


var BaseClass = declare( null, {

  // Define the constructor, will initialise `a`
  constructor: function( p ){
    this.a = p;
  },


  assignA: function( a ){
    this.a = a;
    return 1000;
  },

  asyncMethod: function( p1, p2, done ){
    done( null, p1 + p2 );
  },

});

BaseClass.classMethod = function( p ){
  return p * p;
}



// Make sure uncaught errors are displayed
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});


function l( v ){
  console.log( require( 'util' ).inspect( v, { depth: 10 } ) );
}


var tests = {

  "straight class": function( test ){
    var self = this;

    var baseObject = new BaseClass( 10 );
    test.equal( baseObject.a, 10 );
    var r = baseObject.assignA( 20 );
		test.equal( baseObject.a, 20 );
    test.equal( r, 1000 );

    baseObject.asyncMethod( 7, 8, function( err, res ){
      test.ifError( err );
      test.equal( res, 15 );
      test.done();
    });

  },


  "derived class": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {

      // Define the constructor, will initialise `a`
      constructor: function( p ){
        this.b = p + 1;
      },
    });

    var derivedObject = new DerivedClass( 10 );
    test.equal( derivedObject.a, 10 );
    test.equal( derivedObject.b, 11 );

    test.done();
  },

  "derived class redefining a method": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {
      assignA: function( a ){
        this.a = a + 10;
        return 2000;
      },
    });

    var derivedObject = new DerivedClass( 10 );
    test.equal( derivedObject.a, 10 );
    var r = derivedObject.assignA( 20 );
		test.equal( derivedObject.a, 30 );
    test.equal( r, 2000 );

    test.done();
  },


  "derived class inheriting class method": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {
      assignA: function( a ){
        this.a = a + 10;
        return 2000;
      },
    });

    var r = DerivedClass.classMethod( 7 );
    test.equal( r, 49 );

    test.done();
  },



  "sync inherited method": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {
      assignA: function( a ){
        var r = this.inherited( 'assignA', arguments );
        this.a ++;
        return ++r;
      },
    });

    var derivedObject = new DerivedClass( 10 );
    test.equal( derivedObject.a, 10 );
    var r = derivedObject.assignA( 20 );
    test.equal( derivedObject.a, 21 );
    test.equal( r, 1001 );

    test.done();
  },

  "derived class, isInherited": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {

      assignA: function(){
        this.inherited( arguments );
      },

      newOne: function(){
      },

      inheritedTest1: function( a ){
        this.inherited( 'assignA', arguments );
        return this.isInherited( 'assignA' );
      },
      inheritedTest2: function( a ){
        return this.isInherited( 'newone' );
      },
      inheritedTest3: function( a ){
        return this.inherited( 'newOne' );
      },
    });

    var derivedObject = new DerivedClass( 10 );
    test.equal( derivedObject.inheritedTest1(), true ); 
    test.equal( derivedObject.inheritedTest2(), false ); 
    test.throws( function(){ derivedObject.inheritedTest3() }  ); 

    test.done();
  },

  "derived class, broken chain": function( test ){
    var self = this;

    var DerivedClass1 = declare( BaseClass, {

      assignZ: function( z ){
        this.z = z;
      },
    });

    var DerivedClass2 = declare( DerivedClass1, {

      assignA: function( a ){
        this.inherited( 'assignA', [ a + 1 ] );
      },
    });

    var derivedObject2 = new DerivedClass2( 10 );
    derivedObject2.assignA( 1000 );
    test.equal( derivedObject2.a, 1001 );

    test.done();
  },


  "async inherited method": function( test ){
    var self = this;

    var DerivedClass = declare( BaseClass, {

      asyncMethod: function( p1, p2, done ){
        this.inheritedAsync( 'asyncMethod', arguments, function( err, res ){
          done( null, res + 1 );
        });
      },

    });

    var derivedObject = new DerivedClass( 10 );

    derivedObject.asyncMethod( 7, 8, function( err, res ){
      test.ifError( err );
      test.equal( res, 16 );
      test.done();
    });

  },

  "mixins": function( test ){
    var self = this;

    var Mixin = declare( null, {

      // Define the constructor, will initialise `a`
      constructor: function( p ){
        this.b = p * 2;
      },

      assignA: function( p ){
        var r = this.inherited( 'assignA', arguments );
        this.a = this.a + 2;
        return r + 2;
      },

      assignB: function( p ){
        this.b = p;
        return 2000;
      },

    });

    var MixedClass = declare( [ BaseClass, Mixin ] );
    var mixedObject = new MixedClass( 10 ); 
    
    test.equal( mixedObject.a, 10 );
    test.equal( mixedObject.b, 20 );

    var r = mixedObject.assignA( 30 );
		test.equal( mixedObject.a, 32 );
    test.equal( r, 1002 );
    
    var r = mixedObject.assignB( 50 );
    test.equal( mixedObject.b, 50 );
    test.equal( r, 2000 );

    test.done();
  },

  "inherit from  straight JS classes": function( test ){
    var self = this;

    var JsClass = function( p ){
      this.a = p;
    }

    JsClass.prototype.assignA = function( p ){
      this.a = p;
    };

    var DerivedClass = declare( JsClass, {

      // Define the constructor, will initialise `a`
      constructor: function( p ){
        this.b = p + 1;
      },
    });

    var derivedObject = new DerivedClass( 10 );
    test.equal( derivedObject.a, 10 );
    test.equal( derivedObject.b, 11 );
    derivedObject.assignA( 300 );
    test.equal( derivedObject.a, 300 );

    test.done();
  },

};
  
// Copy tests over to exports
for( var i in tests ){
  exports[ i ] = tests[ i ];
}



