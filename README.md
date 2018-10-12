# EMail Parser
This repository contains a Shared Library and a template/example Communications Plan for parsing inbound emails that can be used to chain and trigger a subsequent Form or Integration.
The setup is fairly simple, and the Shared Library may be used in any number of Communication Plans.

<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Pre-Requisites
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files
* [EmailParserTemplate.zip](EmailParserTemplate.zip) - This example Communication Plan has a simple form for initiating via Email, and another form that is initiated after parsing the received email to trigger the first Form.<br>The Communication Plan also includes the Shared Library ("Email Parser"), an Inbound Integration to trigger the chained/follow-on Form, and one Outbound Integration that is triggered when the Inbound Form is activated and calls the Email Parser.
* [Email_Parser.js](Email_Parser.js) - This is the JavaScript source file for the Shared Library.<br>You can copy and paste that as a Shared Library into any existing or new Communication Plan.
* [Outbound\_Integration-Parse\_Inbound\_Email.js](Outbound_Integration-Parse_Inbound_Email.js) - An example Outbound Integration triggered by `Event Status Updates` and should be associated with whatever Form you have created to recieve inbound emails to start the Notification Events.  In the example Communication Plan, this is associated with the Form called "Inbound Email Form".<br>You may use this as an example of how to use the Shared Library.<br>The actual code is specific to this Template Communication Plan, so you will need to adjust it if you paste it into your own existing Communication Plan.

# How it works
Conceptually, the parser, `propParser(body, propInfo)`, operates on two inputs:<br>
1. `body` - The text version of the body from the inbound email, and<br>
2. `propInfo` - An object that defines the parsing parameters as follows:<br>
<pre>propName:
	Name of property to search for in the source
propValueTerminator: 
	If value is a specific length, then use that number here
	If value is variable length, then use the next string in 
		the payload as a value terminator.
		This terminator can be something like "\n", or another next
		value like "Business Criticality"
isSingleton:
	If true, return the first occurance
	If false, use the optional field "delim" to define separator
delim: (Optional)
	If isSingleton is true, then put this string between the 
		parsed / found values
targetPropName:
	The name of the property to populate in the target object
</pre>
The process is based on two Forms:
1. A Form [configured for Email Initiation](https://help.xmatters.com/ondemand/xmodwelcome/communicationplanbuilder/formconfigureemailinitiation.htm).  You should at a minimum configure the mappings for the From, Subject, and text representation of the Email body.  This is the Form named "Inbond Email Form" in the sample Communication Plan.
2. Another Form configured to be sent out with the values that are parsed out from the first Form.  This Form is called "Outbound Email Form" in the sample Communication Plan.  It has discrete properties that map to the values that will be parsed.

The process flow is started when the "Inbound Email Form" is [initiated by Email](https://help.xmatters.com/ondemand/xmodwelcome/communicationplanbuilder/initiatingaformbyemail.htm) .  That is, xMatters receiving an email targeted to the Forms pre-defined email address.<br>
At that point an Event is created in xMatters for that "Inbound Email Form", which in turn triggers the Outbound Integration that is associated with that Form's `Status Update Trigger`.  (See the example in the sample Communication Plan.).<br>
The code in the trigger will call the parser and fill in the properties for the target form.<br>
Then the code will trigger a new Event targeting the "Outbound Email Form" in our example. 

# Installation
Installation is simple.<br>
You can either [import the Sample Communication Plan](https://help.xmatters.com/ondemand/xmodwelcome/communicationplanbuilder/exportcommplan.htm) ,
or you can add a [Shared Library](https://help.xmatters.com/ondemand/xmodwelcome/integrationbuilder/shared-libraries.htm) to an existing Communication Plan using the [Email_Parser.js](Email_Parser.js),<br>
and create your own [Outbound Integration](https://help.xmatters.com/ondemand/xmodwelcome/integrationbuilder/example-outbound-updates.htm) using the [Outbound\_Integration-Parse\_Inbound\_Email.js](Outbound_Integration-Parse_Inbound_Email.js)<br>
If you are going to try using the Sample Communication Plan, you will need to set the [Constant](https://help.xmatters.com/ondemand/xmodwelcome/integrationbuilder/constants.htm) called `EMAIL_FORM_TO_INITIATE_URL`.<br>
This should point to the Inbound Integration address for the "Outbound Email Form" using URL Authentication.<br>
Note you will only need the URL from the `/api` forward (e.g. `/api/integration/1/functions/f024ae5a-41a5-4fb0-b6b6-0a6e1002588c/triggers?apiKey=4f6cab6d-8542-4e2e-b83a-b7e0f028f663`) .


# Testing
To test the integration, send a formatted email to yoru Form's email address... you can target "nobody" as the Recipient, or specify a Group Name, or User ID.<br>
For example, `mailto:nobodoy@inboundemail.your.xmatters.com`<br>
Then, if you're using the Sample Communication Plan, try with an email body formatted like this:<br>
<pre>
Prop1: [This is Prop1's value, and is enclosed with square brackets]<br>
Prop2: ListValue1,ListValue2,ListValue3
</pre>  

# Troubleshooting
If you're having problems, check the Activity Stream of the Outbound Integration.<br>
Also make sure that the Inbound Email Form was initiated.  You should have a new Event in the Reports tab if the Email was received and accepted by xMatters.<br>
You will need to make sure that the email Sender's From address is associated with an xMatters User account, and that this User has an Email device with the Sender's From address.
