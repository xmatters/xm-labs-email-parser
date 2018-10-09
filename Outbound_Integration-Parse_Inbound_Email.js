/******************************************************************************
 * Outbound integrations
 *
 * Outbound integrations are triggered when an xMatters system action occurs,
 * such as when an event status changes, a notification is delivered, or a
 * recipient responds to a message. These system actions are called 'triggers'.
 *
 * Outbound integrations can perform tasks such as initiating a follow-up 
 * xMatters event when the status of an event changes or updating another 
 * system in your toolchain when a user responds to a notification.
 *
 * xMatters passes information about the trigger to the outbound integration
 * as a JSON object in the body of the built-in request object. Your outbound
 * integration can process this data and use it in the script. (To include form
 * properties in the request data, select 'Include in Outbound Integrations'
 * from the property's settings on the form layout.)
 *
 * The following code shows how to parse in incoming email and trigger another
 * notification based on those parsed value.
 * 
 * You can use it as a template and then customize it to work with your
 * integration.
 * 
 * Required Shared Libraries:
 *   Email Parser
 * 
 * Required Constants (to be populated with values appropriate to your needs.)
 *   EMAIL_FORM_TO_INITIATE_URL
 *       Relative URI of Form to initiate (API-KEY secured)
 *   EMAIL_PROPERTY_BODY
 *       Name of property in event that contains the email message body
 *       (e.g. eBodyText)
 *   EMAIL_PROPERTY_FROM - Name of property in event that contains the email
 *       message From (e.g. eFrom)
 *   EMAIL_PROPERTY_SUBJECT - Name of property in event that contains the email
 *       message subject (e.g. eSubject)
 *   PROPINFO_ARRAY = JSON Array that describes incoming property (type and
 *       style), and target property.
 *   DEFAULT_RECIPIENT_ID - Optional targetName of the default recipient 
 *       (e.g. Group Name, User ID)
 *   DEFAULT_RECIPIENT_TYPE - Optional recipient type to use with 
 *       DEFAULT_RECIPIENT_ID (e.g. GROUP, PERSON or DEVICE)
 * 
 * payload.eventProperties:
 *  For this example to work you need to make sure that you have the following
 *  properties marked as "Include in Outbound Integrations". (click the little
 *  gear next to the Property name in the Form's Layout.)
 *  In this template, we have already done this for these Properties:
 *   eFrom
 *   eSubject
 *   eBodyText
 *   eBodyHTML (Not used in this example)
 * 
 ******************************************************************************/

// Load the shared library
var eParser = require('Email Parser');
    
// Parse and fixup the payload data
var payload = JSON.parse(request.body);
eParser.fixPayload(payload);

// Only run this when the form has an ACTIVE status (i.e. start)
if ("active".equalsIgnoreCase(payload.status)) {

    // Trigger object to use when initiating the chained form
    var trigger = {};

    /*
     * Array that describes incoming property (type and style), 
     *     and target property.
     * Array elements are objects as follows
     *     propName: 
     *         Name of property to search for in the source
     *     propValueTerminator: 
     *         If value is a specific length, then use that number here
     *         If value is variable length, then use the next string in the
     *             payload as a value terminator.
     *             This terminator can be something like "\n", or another next
     *             value like "Business Criticality"
     *     isSingleton:
     *         If true, return the first occurance
     *         If false, use the optional field "delim" to define separator
     *     delim: (Optional)
     *         If isSingleton is true, then put this string between the 
     *         parsed / found values
     *     targetPropName:
     *         The name of the property to populate in the target object
     */
    var propsToParse = JSON.parse(constants.PROPINFO_ARRAY);

    // Parse the incoming email body
    var emailBody =  payload.eventProperties[constants.EMAIL_PROPERTY_BODY];
    var properties = {};
    for (var ptp in propsToParse) {
        var prop = propsToParse[ptp];
        console.log("Looking for incoming property [" + prop.propName + "]");
        properties[prop.targetPropName] = eParser.propParser(emailBody, prop);
        console.log("properties[" + prop.targetPropName + "] = [" + 
            properties[prop.targetPropName] + "]");
    }
    
    // Add the parsed properties to the Trigger object
    trigger.properties = properties;

    // Add in the Subject from the inbound email
    trigger.properties[constants.EMAIL_PROPERTY_SUBJECT] = 
    	payload.eventProperties[constants.EMAIL_PROPERTY_SUBJECT];

    // Add in the From information from the inbound email
    trigger.properties[constants.EMAIL_PROPERTY_FROM] = 
    	payload.eventProperties[constants.EMAIL_PROPERTY_FROM];

    // Add in recipients (if specififed), otherwise only target Subscribers
    if ((typeof constants.DEFAULT_RECIPIENT_TYPE !== "undefined") && 
        (constants.DEFAULT_RECIPIENT_TYPE.length > 0) &&
        (typeof constants.DEFAULT_RECIPIENT_ID !== "undefined") && 
        (constants.DEFAULT_RECIPIENT_ID.length > 0)) {
        var recipients = [];
        recipients.push(
        	{
        		"recipientType": constants.DEFAULT_RECIPIENT_TYPE, 
        		"id": constants.DEFAULT_RECIPIENT_ID
        	});
        trigger.recipients = recipients;
    }

    // Prepare for and trigger the new event
    var triggerEventRequest = http.request({
        'endpoint': 'xMatters',
        'method': 'POST',
        'path': constants.EMAIL_FORM_TO_INITIATE_URL,
        'headers': {
            'Content-Type': 'application/json'
        }
        
    });
    
    // Trigger the Notification form
    var triggerEventResponse = triggerEventRequest.write(trigger);

    // Check out the result (202 == success/accepted)
    if (triggerEventResponse.statusCode != 202 ) {
        console.log('\nError triggering the secondary notification event.\n' +
        	JSON.stringify(triggerEventResponse,null,4));
        return;
    } 
    
}
