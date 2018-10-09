/*******************************************************************************
 * This shared library contains functions that can be used to parse
 * a structured email payload based on parameters.
 *
 * To use this function in another script, include the following statements.
 *
 *  var eParser = require('Email Parser');
 *  var parsedProperty = eParser.propParser(emailTextBody, propParserInfo);
 *
 *  The `propParserInfo` argument is an object that contains metadata that the
 *  parser uses to find and extract various types of values.
 *
 *  An occurance/instance of the propInfo object should contain the following
 *  fields
 *     propName: 
 *         Name of property to search for in the source
 *     propValueTerminator: 
 *         If value is a specific length, then use that number here
 *         If value is variable length, then use the next string in the payload
 *             as a value terminator.
 *             This terminator can be something like "\n", or another next value
 *             like "Business Criticality".
 *     isSingleton:
 *         If true, return the first occurance
 *         If false, use the optional field "delim" to define separator
 *     delim: (Optional)
 *         If isSingleton is true, then put this string between the found values
 *     targetPropName:
 *         The name of the property to populate in the target object
 * 
 *  You may create an array of Property Parser Info objects, and run through
 *  them iteratively.
 * 
 *  Here is an example of defining a propInfo array and iterating over it:
    var propsToParse = [
        {"propName": "Priority: ", "propValueTerminator": 1, 
         "isSingleton": true, "targetPropName": "Priority"},
        {"propName": "Application Impacted: ", "propValueTerminator": " ",
         "isSingleton": false, "delim": ",",
         "targetPropName": "Impacted Application List"}
    ];
    // Parse the incoming email body
    var emailBody =  payload.eventProperties[constants.EMAIL_BODY_PROPERTY];
    var properties = {};
    for (var ptp in propsToParse) {
        var prop = propsToParse[ptp];
        console.log("Looking for incoming property [" + prop.propName + "]");
        properties[prop.targetPropName] = propParser(emailBody, prop);
        console.log("properties[" + prop.targetPropName + "] = [" +
            properties[prop.targetPropName] + "]");
    }
 * 
 * History:
 *  2018-10-08 - v1.0 - Initial release
 * 
 ******************************************************************************/


/**
 * Parses the data property based on the descriptor contained in propInfo
 *
 * @param {string} Text version of incoming email body
 * @param {object} An instance of a propInfo object
 * The propInfo object should contain the folllowing fields
 *     propName: 
 *         Name of property to search for in the source
 *     propValueTerminator: 
 *         If value is a specific length, then use that number here
 *         If value is variable length, then use the next string in the payload
 *             as a value terminator.
 *             This terminator can be something like "\n", or another next value
 *             like "Business Criticality".
 *     isSingleton:
 *         If true, return the first occurance
 *         If false, use the optional field "delim" to define separator
 *     delim: (Optional)
 *         If isSingleton is true, then put this string between the found values
 *     targetPropName:
 *         The name of the property to populate in the target object
 * 
 * @returns {string} containing the data value that was found.
 * 
 */
function propParser(data, propInfo) {

    // If we are looking for a single value
    if (propInfo.isSingleton) {
        var result = extractValue(data, 0, propInfo.propName, 
        	propInfo.propValueTerminator);
        return (null === result) ? "" : result.value;
        
    // Iterate through data, collecting multiple values
    } else {
        var iterResults = [];
        var iterResult = null;
        var startPos = 0;
        do {
            iterResult = extractValue(data, startPos, propInfo.propName,
            	propInfo.propValueTerminator);
            if (null !== iterResult) {
                iterResults.push(iterResult.value);
                startPos = iterResult.nextStart;
            }
        } while (null !== iterResult);
        return iterResults.join(propInfo.delim);
    }

}
exports.propParser = propParser;

/**
 * Extracts the value from data based on startPos, startStr and endStrOrLen
 * 
 * Returns null, or if found, an object as follows:
 *     "value": The data item extracted
 *     "nextStart": Position in data to start a subsequent search
 */
function extractValue(data, startPos, startStr, endStrOrLen) {
    console.log("exractValue - startPos = [" + startPos + "], startStr = [" +
    	startStr + "], endStrOrLen = [" + endStrOrLen + "]");

    var value = null;
    var nextStart = 0;
    
    // Find the start position of the properties value
    subStrStart = data.indexOf(startStr, startPos);
    
    // If the startStr is not found, just return null
    if (subStrStart === -1) return null;

    /* if the type of data in endStrOrLen is a String, then look for
     * that value to delimit the data.
     * Otherwise, the numeric value represents the length of the data
     * value to return.
     */
    subStrStart += startStr.length;
    if (typeof endStrOrLen === "string") {
        // Use substrubg(startPos, endPosNonInclusive)
        nextStart = subStrStart + 
        	data.substring(subStrStart).indexOf(endStrOrLen);
        value = data.substring(subStrStart, nextStart).trim();
        
    } else {
        // Use substr(startPos, Length)
        nextStart = subStrStart + endStrOrLen;
        value = data.substr(subStrStart, endStrOrLen);
    }
    
    console.log("exractValue - value = [" + value + "], nextStart = [" +
    	nextStart + "]");
    return {"value":value, "nextStart":nextStart};
}


/**
 * Form properties are included in the payload when they are marked as
 * 'Include in Outbound Integrations' on the form layout.
 *
 * Transform the eventProperties object so that
 * you can access form properties using dot notation.
 */
function fixPayload(payload) {
    if (payload.eventProperties && Array.isArray(payload.eventProperties)) {
        var eventProperties = payload.eventProperties;
        payload.eventProperties = {};
    
        for (var i = 0; i < eventProperties.length; i++) {
            var eventProperty = eventProperties[i];
            var key = Object.keys(eventProperty)[0];
            payload.eventProperties[key] = eventProperty[key];
          }
    }
}
exports.fixPayload = fixPayload;