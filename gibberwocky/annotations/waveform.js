const COLORS = {
  FILL:'rgba(46,50,53,1)',
  STROKE:'#aaa',
  DOT:'rgba(89, 151, 198, 1)'//'rgba(0,0,255,1)'
}

let Gibber = null

const Waveform = {
  widgets: { dirty:false },
  
  createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track, isSeq=true ) {

    let widget = document.createElement( 'canvas' )
    widget.padding = 40
    widget.waveWidth = 60
    widget.ctx = widget.getContext('2d')
    widget.style.display = 'inline-block'
    widget.style.verticalAlign = 'middle'
    widget.style.height = '1.1em'
    widget.style.width = ((widget.padding * 2 + widget.waveWidth) * window.devicePixelRation ) + 'px'
    widget.style.backgroundColor = 'transparent'
    widget.style.margin = '0 1em'
    //widget.style.borderLeft = '1px solid #666'
    //widget.style.borderRight = '1px solid #666'
    widget.setAttribute( 'width', widget.padding * 2 + widget.waveWidth )
    widget.setAttribute( 'height', 13 )
    widget.ctx.fillStyle = COLORS.FILL 
    widget.ctx.strokeStyle = COLORS.STROKE
    widget.ctx.font = '10px monospace'
    widget.ctx.lineWidth = 1
    widget.gen = patternObject !== null ? patternObject : Gibber.__gen.gen.lastConnected.shift()
    widget.values = []
    widget.storage = []
    widget.min = 10000
    widget.max = -10000

    if( widget.gen === null || widget.gen === undefined ) {
      if( node.expression !== undefined && node.expression.type === 'AssignmentExpression' ) {
        isAssignment = true
        
        widget.gen = window[ node.expression.left.name ]

        if( widget.gen.widget !== undefined ) {
          widget.gen.widget.parentNode.removeChild( widget.gen.widget )
        }
        widget.gen.widget = widget
      }else if( node.type === 'CallExpression' ) {
        const state = cm.__state
        
        if( node.callee.name !== 'Lookup' ) {
          const track  = window[ state[0] ][ state[1] ]

          const seq = track[ node.callee.object.property.value][ node.arguments[2].value ] 

          if( seq !== undefined && seq.values.type === 'WavePattern' ) {
            widget.gen = seq.values
            widget.gen.paramID += '_' + node.arguments[2].value
            //widget.gen.widget = widget
          }
          isAssignment = true
        }else{
          widget.gen = patternObject
        }
        //if( seq !== undefined && seq.timings.type === 'WavePattern' ) {
          
        //}
      } 
    }else{
      if( widget.gen.widget !== undefined && widget.gen.widget !== widget ) {
        isAssignment = true
        //widget.gen = window[ node.expression.left.name ]
      }
    }

    //Gibber.__gen.gen.lastConnected = null

    //for( let i = 0; i < 120; i++ ) widget.values[ i ] = 0

    let replaced = false
    //if( isAssignment === false ) {
    //  if( widget.gen !== null ) {
    //    let oldWidget = Waveform.widgets[ widget.gen.paramID ] 

    //    if( oldWidget !== undefined ) {
    //      //oldWidget.parentNode.removeChild( oldWidget )
    //      widget = oldWidget
    //      replaced = true
    //    } 
    //  }
    //}

    if( replaced === false ) {
      widget.mark = cm.markText({ line, ch:ch }, { line, ch:ch+1 }, { replacedWith:widget })
      widget.mark.__clear = widget.mark.clear

      widget.mark.clear = function() { 
        const pos = widget.mark.find()
        if( pos === undefined ) return
        widget.mark.__clear()

        if( isSeq === true ) { // only replace for waveforms inside of a .seq() call
          cm.replaceRange( '', { line:pos.from.line, ch:pos.from.ch }, { line:pos.from.line, ch:pos.to.ch } ) 
        }
      }
    }

    widget.clear = ()=> widget.mark.clear() 

    if( widget.gen !== null ) {
      //console.log( 'paramID = ', widget.gen.paramID ) 
      Waveform.widgets[ widget.gen.paramID ] = widget
      widget.gen.widget = widget
    }
    
    if( patternObject !== null ) {
      patternObject.mark = widget.mark
      if( patternObject === Gibber.Gen.lastConnected[0] ) Gibber.Gen.lastConnected.shift()
    }

    widget.onclick = ()=> {
      widget.min = Infinity
      widget.max = -Infinity
      widget.storage.length = 0
    }

  },

  clear() {
    for( let key in Waveform.widgets ) {
      let widget = Waveform.widgets[ key ]
      if( typeof widget === 'object' ) {
        widget.mark.clear()
        //widget.parentNode.removeChild( widget )
      }
    }

    Waveform.widgets = { dirty:false }
  },

  // currently called when a network snapshot message is received providing ugen state..
  // needs to also be called for wavepatterns.
  updateWidget( id, __value, isFromMax = true ) {
    const widget = typeof id !== 'object' ? Waveform.widgets[ id ] : id
    if( widget === undefined ) return 

    let value = parseFloat( __value )

    // XXX why does beats generate a downward ramp?
    if( isFromMax ) value = 1 - value

    if( typeof widget.values[76] !== 'object' ) {
      widget.values[ 76 ] = value
      widget.storage.push( value )
    }

    if( widget.storage.length > 120 ) {
      widget.max = Math.max.apply( null, widget.storage )
      widget.min = Math.min.apply( null, widget.storage )
      widget.storage.length = 0
    } else if( value > widget.max ) {
      widget.max = value
    }else if( value < widget.min ) {
      widget.min = value
    } 

    widget.values.shift()

    Waveform.widgets.dirty = true
  },

  // called by animation scheduler if Waveform.widgets.dirty === true
  drawWidgets() {
    Waveform.widgets.dirty = false

    const drawn = []

    for( let key in Waveform.widgets ) {
      const widget = Waveform.widgets[ key ]

      // ensure that a widget does not get drawn more
      // than once per frame
      if( drawn.indexOf( widget ) !== -1 ) continue

      if( typeof widget === 'object' && widget.ctx !== undefined ) {

        widget.ctx.fillStyle = COLORS.FILL
        widget.ctx.fillRect( 0,0, widget.width, widget.height )

        // draw left border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + .5, 0.5 )
        widget.ctx.lineTo( widget.padding + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw right border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + widget.waveWidth + .5, .5 )
        widget.ctx.lineTo( widget.padding + widget.waveWidth + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw waveform
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding,  widget.height / 2 + 1 )

        const range = widget.max - widget.min
        const wHeight = widget.height * .85 + .45

        for( let i = 0, len = widget.waveWidth; i < len; i++ ) {
          const data = widget.values[ i ]
          const shouldDrawDot = typeof data === 'object'
          const value = shouldDrawDot ? data.value : data
          const scaledValue = ( value - widget.min ) / range

          const yValue = scaledValue * (wHeight) - .5 
          
          if( shouldDrawDot === true ) {
            widget.ctx.fillStyle = COLORS.DOT
            widget.ctx.fillRect( i + widget.padding -1, wHeight - yValue - 1.5, 3, 3)
            widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue - 1.5 )
          }else{
            widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue )
          }
        }
        widget.ctx.stroke()

        // draw min/max
        widget.ctx.fillStyle = COLORS.STROKE
        widget.ctx.textAlign = 'right'
        widget.ctx.fillText( widget.min.toFixed(2), widget.padding - 2, widget.height )
        widget.ctx.textAlign = 'left'
        widget.ctx.fillText( widget.max.toFixed(2), widget.waveWidth + widget.padding + 2, widget.height / 2 )

        // draw corners
        widget.ctx.beginPath()
        widget.ctx.moveTo( .5, 3.5 )
        widget.ctx.lineTo( .5, .5 )
        widget.ctx.lineTo( 3.5, .5)

        widget.ctx.moveTo( .5, widget.height - 3.5 )
        widget.ctx.lineTo( .5, widget.height - .5 )
        widget.ctx.lineTo( 3.5, widget.height - .5 )

        const right = widget.padding * 2 + widget.waveWidth - .5
        widget.ctx.moveTo( right, 3.5 )
        widget.ctx.lineTo( right, .5 ) 
        widget.ctx.lineTo( right - 3, .5 )

        widget.ctx.moveTo( right, widget.height - 3.5 )
        widget.ctx.lineTo( right, widget.height - .5 ) 
        widget.ctx.lineTo( right - 3, widget.height - .5 )

        widget.ctx.stroke()

        drawn.push( widget )
      }
    }
  }
}

module.exports = function( __Gibber ) {
  Gibber = __Gibber
  return Waveform
}
