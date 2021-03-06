const Theory = require('./theory.js')


module.exports = function( Gibber ) {

const create = function( spec ) {

		// unfortunately, we have to give each object unique
		// methods rather than using a single prototype, as
		// most methods will have a .seq() methods added to them
		// that need to differ for each object.

		const d = Object.assign({}, spec, {
			__velocity: 127,
			__duration: 500,
      __octave:0,
      __client:'max',

      octave( v ) {
        if( v===undefined ) return this.__octave

        this.__octave = v
        return this
      },
      
      duration( value ) {
        if( value === undefined ) return this.__duration
        this.__duration = value
      },
      
      velocity( value ) {
        if( value === undefined ) return this.__velocity
        this.__velocity = value
      },
			midinote( note, velocity, duration ) {
				if( typeof velocity !== 'number' || velocity === 0) velocity = d.__velocity
				if( typeof duration !== 'number' ) duration = this.__duration

				Gibber.Communication.send( `midinote ${d.path} ${note} ${velocity} ${duration}`, 'max' )
			},

			note( num, offset=null, doNotConvert=false ){
				const notenum = doNotConvert === true ? num : Gibber.Theory.Note.convertToMIDI( num )

				Gibber.Communication.send( `midinote ${d.path} ${notenum} ${d.__velocity} ${d.__duration}`, 'max' )
			},

			chord( chord, offset=null, doNotConvert=false ) {
				if( doNotConvert === true ) { // from sequencer
					chord.forEach( v => d.midinote( v, offset ) )
				}else{
					if( typeof chord  === 'string' ){
						chord = Theory.Chord.create( chord ).notes
						chord.forEach( v => d.midinote( v ) )
					}else{
						chord.forEach( v => d.note( v ) )
					}
				}
			},

			midichord( chord, velocity='', duration='' ) {
				chord.forEach( v => d.midinote( v ) )
			},
		})

		//Gibber.Max.devices[ d.path ] = d

		// add annotation dictionaries
		Gibber.CodeMarkup.prepareObject( d )

		// create functions to set the value of all exposed device parameters
		for( let value of d.values ) {
			//d[ value.name ] = function( v ) {
			//  Gibber.Communication.send( `set ${d.path} ${value.name} ${v}`, 'max' )           
			//} 
      //Gibber.addSequencingToMethod( d, value.name, 0, null, 'max' )
      Gibber.addMethod( d, value.name, d.path, null, 'max' )
		}

    // create MIDI sequencing functions
    // pass d.path + method name to force sequencer to use external sequencing methods defined
    // start ~ line 82. velocity and duration are only used internally.
		Gibber.addSequencingToMethod( d, 'midinote',  0, d.path+'midinote', 'max' ) 
		Gibber.addSequencingToMethod( d, 'note',      0, d.path+'note', 'max' ) 
		Gibber.addSequencingToMethod( d, 'midichord', 0, d.path+'midichord', 'max' ) 
		Gibber.addSequencingToMethod( d, 'chord',     0, d.path+'chord', 'max' ) 
		Gibber.addSequencingToMethod( d, 'velocity', 1, null, 'max' ) 
		Gibber.addSequencingToMethod( d, 'duration', 1, null, 'max' ) 

    d.stop = ()=> {
      for( let key in d.sequences ) {
        let sequencesForKey = d.sequences[ key ]

        sequencesForKey.forEach( s => s.stop() )
        //s.stop()
      }
    }
    
		// create external sequencing messages
		// these are not needed for velocity and duration, which are
		// only used internally to the client
		const external = {
		  [	d.path + 'note' ]  : ( value, beat, id, seq ) => {
        const velocity = seq.velocity()
        const duration = seq.duration()

			  let msg = `add ${beat} midinote ${d.path} ${value} ${velocity} ${duration}` 

			  return msg
		  },

		  [ d.path + 'midinote' ] : ( value, beat, id, seq ) => {
			  let msg = `add ${beat} midinote ${d.path} ${value} ${d.__velocity} ${d.__duration}` 
			  return msg
			},

      [ d.path + 'midichord' ] : ( chord, beat, trackID ) => {
        let msg = []

        for( let i = 0; i < chord.length; i++ ) {
          msg.push( `add ${beat} midinote ${d.path} ${chord[i]} ${d.__velocity} ${d.__duration}`  )
        }

        return msg
			},

      [ d.path + 'chord' ] : ( chord, beat, trackID ) => {
        //console.log( chord )
        let msg = []

				for( let i = 0; i < chord.length; i++ ) {
          msg.push( `add ${beat} midinote ${d.path} ${chord[i]} ${d.__velocity} ${d.__duration}`  )
        }

        return msg
      },
		}

		Object.assign( Gibber.Seq.proto.externalMessages, external )

		return d
}

return create


}
