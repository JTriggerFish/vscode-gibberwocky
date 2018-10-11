const __Identifier = function( Marker ) {

  const mark = function( node, state, patternType, seqNumber ) {
    const [ className, start, end ] = Marker._getNamesAndPosition( node, state, patternType, seqNumber )
    const cssName = className + '_' + seqNumber
    const commentStart = end

    // we define the comment range as being one character, this
    // only defines the range of characters that will be replaced
    // by the eventual longer comment string.
    const commentEnd = Object.assign( {}, commentStart )
    commentEnd.ch += 1

    const line = end.line
    const lineTxt = state.cm.getLine( line )
    let ch = end.ch

    // for whatever reason, sometimes the ch value leads to
    // an undefined final character in the string. In that case,
    // work back until we find the actual final character.
    let lastChar = lineTxt[ ch ]
    while( lastChar === undefined ) {
      ch--
      lastChar = lineTxt[ ch ]
    }
    
    // different replacements are used for use in sequencers, when a callexpression
    // creating a wavepattern is often followed by a comma, vs when a wavepattern is
    // assigned to a variable, when no comma is present
    if( lastChar === ',' ) {
      state.cm.replaceRange( ' ,', { line, ch:ch }, { line, ch:ch + 1 } ) 
    }else if( lastChar === ')' ){
      state.cm.replaceRange( ') ', { line, ch:ch }, { line, ch:ch + 1 } )
    }else{
      state.cm.replaceRange( lastChar + ' ', { line, ch:ch }, { line, ch:ch + 1 } )
    }
    
    const marker = state.cm.markText( commentStart, commentEnd, { className })

    return [ marker, className ]
  }

  // Typically this is used with named functions. For example, if you store an
  // Arp in the variable 'a' and pass 'a' into a sequence, 'a' is the Identifier
  // and this function will be called to mark up the associated pattern.
  const Identifier = function( patternNode, state, seq, patternType, containerNode, seqNumber ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ marker, className ] = mark( patternNode, state, patternType, seqNumber )

    // WavePatterns can also be passed as named functions; make sure we forward
    // these to the appropriate markup functions
    if( patternObject.type === 'WavePattern' || patternObject.isGen ) { //|| patternObject.type === 'Lookup' ) {

      if( patternObject.widget === undefined ) { // if wavepattern is inlined to .seq 
        Marker.processGen( containerNode, cm, track, patternObject, seq )
      }else{
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track )
      }
    }else{
      let updateName = typeof patternNode.callee !== 'undefined' ? patternNode.callee.name : patternNode.name
      
      // this doesn't work for variables storing lookups, as there's no array to highlight
      // if( patternObject.type === 'Lookup' ) updateName = 'Lookup' 

      if( Marker.patternUpdates[ updateName ] ) {
        if( updateName !== 'Lookup' ) {
          patternObject.update =  Marker.patternUpdates[ updateName ]( patternObject, marker, className, cm, track, patternNode )
        }else{
          Marker.patternUpdates[ updateName ]( patternObject, marker, className, cm, track, patternNode, patternType, seqNumber )
        }
      } else {
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track )
      }
      
      patternObject.patternName = className

      // store value changes in array and then pop them every time the annotation is updated
      patternObject.update.value = []

      if( updateName !== 'Lookup' )
        Marker._addPatternFilter( patternObject )
    }

    patternObject.marker = marker
  }


  return Identifier
}

module.exports = __Identifier
