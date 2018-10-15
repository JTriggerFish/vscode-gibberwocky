
var global = require('./global.js')
require( 'babel-polyfill' )

let Gibber = require( './gibber.js' ),
    useAudioContext = false,
    count = 0
   
Gibber.init()
global.shared.Gibber = Gibber
