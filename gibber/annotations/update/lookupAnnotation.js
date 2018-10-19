module.exports = ( patternObject, marker, className, cm, track, patternNode, patternType, seqNumber ) => {
  Gibber.CodeMarkup.processGen( patternNode, cm, null, patternObject, null, -1 )

  patternNode.arguments[1].offset = patternNode.offset 

  Gibber.CodeMarkup.patternMarkupFunctions.ArrayExpression(
    patternNode.arguments[1], 
    cm.__state,
    { object:patternObject, [ patternType ]: patternObject },
    patternType,
    null,
    seqNumber,
    true 
  )
}

