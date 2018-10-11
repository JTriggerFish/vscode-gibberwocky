const acorn = require( 'acorn' )
const walk  = require( 'acorn/dist/walk' )
const Utility = require( './utility.js' )
const $ = Utility.create

module.exports = function( Gibber ) {

const Marker = {
  waveform: require( './annotations/waveform.js' )( Gibber ),
  _patternTypes: [ 'values', 'timings', 'index' ],
  globalIdentifiers:{},

  acorn, walk,

  // need ecmaVersion 7 for arrow functions to work correctly
  parsingOptions: { locations:true, ecmaVersion:7 },

  __visitors:require( './annotations/visitors.js' ),

  // pass Marker object to patternMarkupFunctions as a closure
  init() { 
    for( let key in this.patternMarkupFunctions ) {
      if( key.includes( '_' ) === true ) {
        this.patternMarkupFunctions[ key.slice(2) ] = this.patternMarkupFunctions[ key ]( this )
      }
    }
    this.visitors = this.__visitors( this )
  },

  clear() { Marker.waveform.clear() },
  
  prepareObject( obj ) {
    obj.markup = {
      textMarkers: {},
      cssClasses:  {} 
    }  
  },

  getObj( path, findSeq = false, seqNumber = 0 ) {
    let obj = window[ path[0] ]

    for( let i = 1; i < path.length; i++ ) {
      const key = path[ i ]
      if( key !== undefined ) {
        obj = obj[ key ]
      }else{
        break;
      }
    }

    if( findSeq === true ) {
      if( obj.type !== 'sequence' ) {
        obj = obj[ seqNumber ]
      } 
    }

    return obj
  },
  

  process( code, position, codemirror, track ) {
    // store position offset from top of code editor
    // to use when marking patterns, since acorn will produce
    // relative offsets 
    Marker.offset = {
      vertical:   position.start.line,
      horizontal: position.horizontalOffset === undefined ? 0 : position.horizontalOffset
    }

    const state = []
    state.cm = codemirror
    state.cm.__state = state

    const parsed = acorn.parse( code, Marker.parsingOptions )
      
    parsed.body.forEach( node => {
      state.length = 0
      walk.recursive( node, state, Marker.visitors )
    })
  },
  
  markPatternsForSeq( seq, nodes, state, cb, container, seqNumber = 0 ) {
    const valuesNode = nodes[0]
    valuesNode.offset = Marker.offset
    
    // XXX We have to markup the timings node first, as there is the potential for 
    // markup on the value node to insert text that will alter the range of the timings node.
    // If the timings node is already marked up, the mark will simply move with the text addition.
    // However, if the timing mode is marked up after, the position information provided by the parser
    // will be off and not valid.
    
    if( nodes[1] !== undefined ) {
      const timingsNode = nodes[1] 
      timingsNode.offset = Marker.offset
      Marker.patternMarkupFunctions[ timingsNode.type ]( timingsNode, state, seq, 'timings', container, seqNumber )
    }

    Marker.patternMarkupFunctions[ valuesNode.type ]( valuesNode, state, seq, 'values', container, seqNumber )
  },

  
  processGen( node, cm, track, patternObject=null, seq=null, lineMod=0 ) {
    let ch = node.end, 
        line = Marker.offset.vertical + node.loc.start.line, 
        closeParenStart = ch - 1, 
        end = node.end,
        isAssignment = true 

    // check to see if a given object is a proxy that already has
    // a widget created; if so, don't make another one!
    if( node.type === 'AssignmentExpression' ) {
      const __obj = window[ node.left.name ]

      if( __obj !== undefined ) {
        if( __obj.widget !== undefined ) {
          return
        }

        Marker.waveform.createWaveformWidget( line - 1, closeParenStart, ch-1, isAssignment, node, cm, __obj, track, false )
      }
    }else if( node.type === 'CallExpression' ) {
      const seqExpression = node

      seqExpression.arguments.forEach( function( seqArgument ) {
        if( seqArgument.type === 'CallExpression' ) {
          const idx = Gibber.__gen.ugenNames.indexOf( seqArgument.callee.name )
          
          // not a gen, markup will happen elsewhere
          if( idx === -1 ) return

          
          ch = seqArgument.loc.end.ch || seqArgument.loc.end.column
          // XXX why don't I need the Marker offset here?
          line = seqArgument.loc.end.line + lineMod

          // for some reason arguments to .seq() include the offset,
          // so we only want to add the offset in if we this is a gen~
          // assignment via function call. lineMod will !== 0 if this
          // is the case.
          if( lineMod !== 0 ) line += Marker.offset.vertical

          closeParenStart = ch - 1
          isAssignment = false
          node.processed = true
          //debugger
          Marker.waveform.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track, lineMod === 0 )
        } else if( seqArgument.type === 'ArrayExpression' ) {
          //console.log( 'WavePattern array' )
        }else if( seqArgument.type === 'Identifier' ) {
          // handles 'Identifier' when pre-declared variables are passed to methods
          ch = seqArgument.loc.end.ch || seqArgument.loc.end.column
          line = seqArgument.loc.end.line + lineMod
          isAssignment = false
          node.processsed = true

          if( lineMod !== 0 ) line += Marker.offset.vertical
          Marker.waveform.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track, lineMod === 0 )
          
        }
      })

    }
    
  },

  _createBorderCycleFunction: require( './annotations/update/createBorderCycle.js' ),

  finalizePatternAnnotation( patternObject, className, seqTarget ) {
    patternObject.update =  Marker._createBorderCycleFunction( className, patternObject )
    //Marker._addPatternUpdates( patternObject, className )
    Marker._addPatternFilter( patternObject )

    patternObject.patternName = className
    patternObject._onchange = () => { Marker._updatePatternContents( patternObject, className, seqTarget ) }

    patternObject.clear = () => {
      patternObject.marker.clear()
    }
  },

  // Patterns can have *filters* which are functions
  // that can modify the final output of a pattern and carry out
  // other miscellaneous tasks. Here we add a filter that schedules
  // updates for annotations everytime the target pattern outputs
  // a value.
  _addPatternFilter( patternObject ) {
    patternObject.filters.push( args => {
      const wait = Utility.beatsToMs( patternObject.nextTime + .5,  Gibber.Scheduler.bpm ),
            idx = args[ 2 ],
            shouldUpdate = patternObject.update.shouldUpdate

      // delay is used to ensure that timings pattern is processed after values pattern,
      // because changing the mark of the values pattern messes up the mark of the timings
      // pattern; reversing their order of execution fixes this.  
      if( patternObject.__delayAnnotations === true ) {
        Gibber.Environment.animationScheduler.add( () => {
          if( patternObject.type !== 'Lookup' ) {
            patternObject.update.currentIndex = idx
          }else{
            patternObject.update.currentIndex = patternObject.update.__currentIndex.shift()
          }

          patternObject.update()
        }, wait + 1 )
      }else{
        Gibber.Environment.animationScheduler.add( () => {
          if( patternObject.type !== 'Lookup' ) {
            patternObject.update.currentIndex = idx
          }else{
            patternObject.update.currentIndex = patternObject.update.__currentIndex.shift()
          }


         patternObject.update()
        }, wait ) 
      }

      return args
    }) 
  },

  // FunctionExpression and ArrowFunctionExpression are small enough to
  // include here, as they're simply wrappers for Identifier. All other
  // pattern markup functions are in their own files.
  patternMarkupFunctions: {

    __Literal:          require( './annotations/markup/literal.js' ),
    __Identifier:       require( './annotations/markup/identifier.js'   ),
    __UnaryExpression:  require( './annotations/markup/unaryExpression.js'  ),
    __BinaryExpression: require( './annotations/markup/binaryExpression.js' ),
    __ArrayExpression:  require( './annotations/markup/arrayExpression.js'  ),
    __CallExpression:   require( './annotations/markup/callExpression.js'   ),

    // args[ 0 ] is the pattern node
    FunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    },

    ArrowFunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    }
  },

  patternUpdates: {
    Euclid:   require( './annotations/update/euclidAnnotation.js' ),
    Automata: require( './annotations/update/euclidAnnotation.js' ),
    Hex:      require( './annotations/update/euclidAnnotation.js' ),
    Lookup:   require( './annotations/update/lookupAnnotation.js' ),
    anonymousFunction: require( './annotations/update/anonymousAnnotation.js' ),
  },

  standalone: {
    Score: require( './annotations/standalone/scoreAnnotation.js' ),
    Steps: require( './annotations/standalone/stepsAnnotation.js' ),
    //HexSteps: require( './annotations/standalone/hexStepsAnnotation.js' )
  },


  _updatePatternContents( pattern, patternClassName, track ) {
    let marker, pos, newMarker

    if( pattern.values.length > 1 ) {
      // array of values
      for( let i = 0; i < pattern.values.length; i++) {
        marker = track.markup.textMarkers[ patternClassName ][ i ]
        pos = marker.find()

        marker.doc.replaceRange( '' + pattern.values[ i ], pos.from, pos.to )
      }
    }else{
      // single literal
      marker = track.markup.textMarkers[ patternClassName ]
      pos = marker.find()

      marker.doc.replaceRange( '' + pattern.values[ 0 ], pos.from, pos.to )
      // newMarker = marker.doc.markText( pos.from, pos.to, { className: patternClassName + ' annotation-border' } )
      // track.markup.textMarkers[ patternClassName ] = newMarker
    }
  },

  _getNamesAndPosition( patternNode, state, patternType, index = 0 ) {
    let start   = patternNode.loc.start,
        end     = patternNode.loc.end,
        className = state.slice( 0 ), 
        cssName   = null,
        marker

     className.push( patternType )
     className.push( index )
     className = className.join( '_' )

     let expr = /\[\]/gi
     className = className.replace( expr, '' )

     expr = /\-/gi
     className = className.replace( expr, '_' )

     expr = /\ /gi
     className = className.replace( expr, '_' )

     start.line += patternNode.offset.vertical - 1
     end.line   += patternNode.offset.vertical - 1
     start.ch   = start.column + patternNode.offset.horizontal 
     end.ch     = end.column + patternNode.offset.horizontal 

     return [ className, start, end ]
  },

  _getCallExpressionHierarchy( expr ) {
    let callee = expr.callee,
        obj = callee.object,
        components = [],
        index = 0,
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property && obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property && obj.property.type === 'Literal' ){ // array index
        pushValue = obj.property.value

        // don't fall for tracks[0] etc.
        if( depth > 1 ) index = obj.property.value
      }else if( obj.type === 'Identifier' ) {
        pushValue = obj.name
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    
    if( callee.property )
      components.push( callee.property.name )

    return [ components, depth, index ]
  },

}

return Marker

}
