'use strict';

module.exports = function( Gibber ) {
  const makeDevice = require( './max_device.js' )( Gibber ) 

  let Max = {
    signals:[],
    params:{},
    devices:{},
    namespaces:{},
    receives:{},

    init() {
      Gibber.Communication.callbacks.schemas.max = Max.handleScene
      Gibber.Communication.send( 'get_scene', 'max' )     
    },

    handleScene( msg ) {
      Max.id = Communication.querystring.track

      if( msg.namespaces !== undefined ) {
        Max.MOM = msg

        Max.processMOM()
      }
    },

    clear() {
      for( let i = 0; i < Max.signals.length; i++ ) {
        Gibber.Communication.send( `sig ${i} clear`, 'max' )
      }
    },

    addIdToUgen( id, ugen ) {
      if( typeof ugen === 'number' || ugen === 'in1' || ugen === undefined ) return
      ugen.id = id
      let count = 0
      //debugger
      while( typeof ugen[ count ] !== 'undefined' ) {
        let _ugen = typeof ugen[count] === 'function' ? ugen[count]() : ugen[count]
        Max.addIdToUgen( id, _ugen )
        count++
      }
    },

    processMOM() {
      for( let signalNumber of Max.MOM.signals ) {
        Max.signals[ signalNumber ] = function( genGraph ) {
          console.log( 'setting signal' )
          // getter
          if( genGraph === undefined ) return Max.signals[ signalNumber ].genGraph

          //if( typeof genGraph === 'number' ) {
          //  genGraph = Gibber.Gen.functions.param( genGraph )
          //}
          
          //Max.addIdToUgen( signalNumber, genGraph )

          //if( Gibber.Gen.connected.find( e => e.id === signalNumber ) === undefined ) {
          //  Gibber.Gen.connected.push( genGraph )
          //}

          const rendered = genGraph.render('gen')
          Gibber.Gen.lastConnected.unshift( rendered )

          //if( '__widget__' in genGraph ) {
          //  genGraph.__widget__.place()
          //}

          Gibber.Communication.send( `sig ${signalNumber} expr "${rendered.out()}"`, 'max' )
          if( genGraph.isGen ) {
            Gibber.CodeMarkup.TEST = genGraph
          }

          Max.signals[ signalNumber ].genGraph = rendered
          Max.signals[ signalNumber ].genGraph.__client = 'max'
        }
        Max.signals[ signalNumber ].id = signalNumber
        Max.signals[ signalNumber ].__client = 'max'

        Gibber.addMethod( Max.signals, signalNumber, { quantized: 0, id:signalNumber }, null, 'max' )
        //Gibber.addSequencingToMethod( Max.signals, signalNumber, 0, null, 'max' )
      }

      Max.params.path = 'set'
      for( let param of Max.MOM.root.params ) {
        Gibber.addMethod( Max.params, param.varname, null, null, 'max' )
        Max.params[ param.varname ].__client = 'max'
      }

      for( let receive in Max.MOM.receives ) {
        Max.receives[ receive ] = function( v ) {
          Gibber.Communication.send( `${receive} ${v}`, 'max' )
        }

        Max.receives[ receive ].__client = 'max'
        Gibber.addSequencingToMethod( Max.receives, receive, 0, 'max' )
      }

      for( let device of Max.MOM.root.devices ) {
        Max.devices[ device.path ] = makeDevice( device )
        Max.devices[ device.path ].__client = 'max'
      }

      Gibber.MomView.init( Gibber )
    },

    namespace( str, target ) {
      const addr = target === undefined ? str : target.address + ' ' + str

      const ns = function( ...args ) { 
        Gibber.Communication.send( addr + ' ' + args.join(' '), 'max' )
      }
      ns.address = ns.path = str
      
      if( target === undefined ) target = Max.namespaces

      if( target[ str ] ) return target[ str ] 
      
      const proxy = new Proxy( ns, {
        // whenever a property on the namespace is accessed
        get( target, prop, receiver ) {
          // if the property is undefined...
          if( target[ prop ] === undefined && prop !== 'markup' && prop !== 'seq' && prop !== 'sequences' && prop !== '__client' ) {
            target[ prop ] = Max.namespace( prop, target )
            target[ prop ].address = addr + ' ' + prop 
          }

          return target[ prop ]
        }
      })

      target[ str ] = proxy 
      target.__client = 'max'

      Gibber.addSequencingToMethod( target, str, 0, addr, 'max' )           

      Gibber.Seq.proto.externalMessages[ addr ] = ( value, beat ) => {
        let msg = `add ${beat} ${addr} ${value}`  
        return msg
      }

      Gibber.CodeMarkup.prepareObject( ns )

      return proxy
    },

  }

  return Max
}
