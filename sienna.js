/**
 * 
 * sienna adapter
 * 
 * 
 * file io-package.json comments: { "common": { "name": "sienna", // name has to
 * be set and has to be equal to adapters folder name and main file name
 * excluding extension "version": "0.0.0", // use "Semantic Versioning"! see
 * http://semver.org/ "title": "Node.js sienna Adapter", // Adapter title shown
 * in User Interfaces "authors": [ // Array of authord "name <mail@sienna.com>" ]
 * "desc": "sienna adapter", // Adapter description shown in User Interfaces.
 * Can be a language object {de:"...",ru:"..."} or a string "platform":
 * "Javascript/Node.js", // possible values "javascript", "javascript/Node.js" -
 * more coming "mode": "daemon", // possible values "daemon", "schedule",
 * "subscribe" "schedule": "0 0 * * *" // cron-style schedule. Only needed if
 * mode=schedule "loglevel": "info" // Adapters Log Level }, "native": { // the
 * native object is available via adapter.config in your adapters code - use it
 * for configuration "test1": true, "test2": 42 } }
 * 
 */

/* jshint -W097 */// jshint strict:false
/* jslint node: true */
"use strict";

//you have to require the utils module and call adapter function
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var SerialPort = require("serialport").SerialPort;

//you have to call the adapter function and pass a options object
//name has to be set and has to be equal to adapters folder name and main file
//name excluding extension
//adapter will be restarted automatically every time as the configuration
//changed, e.g system.adapter.sienna.0
var adapter = utils.adapter({name:'sienna', noNamespace: true});

//global variables
var FIND_DEVICES = 0x20; // FIND_DEVICES Find all devices in own domain or unconfigured devices.
var DEVICE_FOUND = 0x21; // DEVICE_FOUND Contains NeuronID of a found device.
var FIND_END = 0x22; // FIND_END No more devices found: Ends the FIND_DEVICES process. The number of devices found is returned.
var HELLO = 0x24; // HELLO
var HELLO_DOMAIN = 0x25; // HELLO_DOMAIN
var HELLO_DOMAIN_ACK = 0x26; // HELLO_DOMAIN_ACK
var HELLO_JOIN_ME = 0x27; // HELLO_JOIN_ME
var SOFT_RESET = 0x28; // SOFT_RESET Reset, where the semi-permanent data are not deleted.
var HARD_RESET = 0x29; // HARD_RESET Reset to factory settings. Same effect as the RESET button. Semi-permanent data are initialized..
var HELLO_DEVICE = 0x2C; // HELLO_DEVICE Request/Response to query data stored in the components.
var HELLO_EXTEND_RESPONSE = 0x2E; // HELLO_EXTEND_RESPONSE Extended Response, delivers data from the component.
var HELLO_DEVICE_RESPONSE = 0x2F; // HELLO_DEVICE_RESPONSE Response, delivers data from the component.
var CONFIGURE = 0x30; // CONFIGURE Triggers the Hello process of a sensor.
var SET_G_AND_E = 0x31; // SET_G_AND_E Overwrite addresses g and e.
var SET_SNET_AND_NODE = 0x32; // SET_SNET_AND_NODE Set Subnet and Node Id of a component: Required for transitioning to a LNS network.0x33 COMM_TEST_START Used for communication test / quality control duringmanufacturing (PC -> Module).
var SET_SW_POS = 0x34; // SET_SW_POS Overwrites the position of SW sliding switch.
var DEL_G_AND_E = 0x35; // DEL_G_AND_E Deletes a channel assignment (g and e) in RF or serial gateway.0x36 COMM_TEST Used for communication test / quality control duringmanufacturing (PC -> Module).
var COMM_ERROR_SERIAL = 0x37; // COMM_ERROR_SERIAL Received a corrupt message on SCI port
var COMM_ERROR_BUS = 0x38; // COMM_ERROR_BUS Communication partner lost, bus communication failed.
var MSG_complete = 0x39; // MSG_complete Message has been sent successfully over the PL/FT bus (ack received for messages)
var SET_LOCATION = 0x3A; // SET_LOCATION Set the location string0x3D REPORT_RF_STATE Reports the assigned RF channels of a RF gateway. (forFW version >=10)0x3F REPORT_PL_STATE Reports the assigned PL channels of a RF gateway. (forFW version >=10)0x41 2 3 4 5 6 7 8 NETWORK_VARIABLE Indicates that this message contains aSIENNA network variable update via neuron addressing. The lower 4 bitindicate the group address g of the addressed module.0x40 1 2 3 4 5 6 7 8 9 A B C D E Foreign frames for transparent messagetunnelling Used by tunneling interfacese.g. FLTP14 (PL) or PLTF14 (FT). Length of the transparent payload depends onthe msg. code 0x4X: Payload length = 1 + XThis allows for payload length up to 15 bytes (0x4E).
var SERVICE_Pin_Message = 0x7F; // SERVICE_Pin_Message Received a service PIN message
explizit messages
var OFF = 0x01|0x80; // OFF Switch Off
var ON = 0x02|0x80; // ON Switch On
var SWITCH = 0x03|0x80; // SWITCH Toggle
var GO = 0x04|0x80; // GO Single push button pressed
var GO_DOWN = 0x05|0x80; // GO_DOWN First of double push buttons pressed
var GO_UP = 0x06|0x80; // GO_UP Second of double push buttons pressed
var STOP = 0x07|0x80; // STOP
var STOP_GO = 0x08|0x80; // STOP_GO Push button released
var STATUS_OFF = 0x09|0x80; // STATUS_OFF Status report from an actuator
var STATUS_ON = 0x0A|0x80; // STATUS_ON Status report from an actuator
var STATUS_DOWN = 0x0B|0x80; // STATUS_DOWN Status report from an actuator
var STATUS_UP = 0x0C|0x80; // STATUS_UP Status report from an actuator
var STATUS_GO_DOWN = 0x0D|0x80; // STATUS_GO_DOWN Status report from an actuator
var STATUS_GO_UP = 0x0E|0x80; // STATUS_GO_UP Status report from an actuator
var STATUS_xx0 = 0x0F|0x80; // STATUS_xx0 Status report for future use
var STATUS_xx1 = 0x10|0x80; // STATUS_xx1 Status report for future use
var GO_DOWN_DEF = 0x11|0x80; // GO_DOWN_DEF Motor goes UP irrespective of current state (definite).
var GO_UP_DEF = 0x12|0x80; // GO_UP_DEF Motor goes DOWN irrespective of current state (definite).
var I_AM_DOMAIN_MASTER = 0x24|0x80; // I_AM_DOMAIN_MASTER Periodic message (group broadcast to all groups: g = 0) in order to define the domain master.
var TIMER_CONTROL = 0x25|0x80; // TIMER_CONTROL Leads to the ‘payload’ field being evaluated. The payload contains the timer setting of a time sensor.
var VALUE = 0x26|0x80; // VALUE Leads to the ‘payload’ field being evaluated.
var GO_TO_VALUE = 0x27|0x80; // GO_TO_VALUE Leads to the ‘payload’ field being evaluated.
var SOFT_RESET = 0x28|0x80; // SOFT_RESET Reset, semi-permanent data are not deleted.
var HARD_RESET = 0x29|0x80; // HARD_RESET Reset to factory setting. Semi-permanent data are initialized.
var PULSE = 0x2A|0x80; // PULSE Leads to a short ON and OFF pulse in a switch-actuator. Pulse length and direction are defined in the field ‘payload’.
var REPORT_THRESHOLD = 0x2C|0x80; // REPORT_THRESHOLD Reports a threshold setting
var SET_VALUE = 0x40|0x80; // SET_VALUE Sets a value.
var REPORT_VALUE = 0x41|0x80; // REPORT_VALUE Reports a value.
var REPORT_RF_STATE = 0x42|0x80; // REPORT_RF_STATE Reports the assigned channels of a RF gateway.
var REPORT_CURRENT = 0x43|0x80; // REPORT_CURRENT Reports the measured current in units of 5W.
var SET_DIM_VALUE = 0x44|0x80; // SET_DIM_VALUE Sets the dimmer brightness in a payload range 0 ... 200.
var REPORT_DIM_VALUE = 0x45|0x80; // REPORT_DIM_VALUE Reports the dimmer brightness in a payload range 0 ... 200.
var SET_MOTOR_POS = 0x46|0x80; // SET_MOTOR_POS Sets the motor position in a payload range 0 ... 200; 0 = fully down, 200 = fully up. "Up "refers to output 1 of the actuator.
var REPORT_MOTOR_POS = 0x47|0x80; // REPORT_MOTOR_POS Reports the motor position in a payload range 0 ... 200; 0 = fully down, 200 = fully up.
var SET_MOTOR_ANG = 0x48|0x80; // SET_MOTOR_ANG For future use: sets the tilting angle of the blinds via runtime in steps of 100 msec in the payload.
var REPORT_MOTOR_ANG = 0x49|0x80; // REPORT_MOTOR_ANG For future use: sets the tilting angle of the blinds via runtime in steps of 100 msec in the payload.
var SET_RUNTIME = 0x4A|0x80; // SET_RUNTIME Sets the runtime of a motor from fully down to fully up in seconds via the payload range 5 ... 255.
var REPORT_ACT_TEMP = 0x4B|0x80; // REPORT_ACT_TEMP Reports the actual temperature measured by a thermostat in units of 0,25 degree in a payload range 0x00 (zero degree) to 0xA0 (40 degree).
var SET_TEMP = 0x4C|0x80; // SET_TEMP Sets the desired temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0xA0 (40 degree).
var REPORT_SET_TEMP = 0x4D|0x80; // REPORT_SET_TEMP Reports the set temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0x78 (30 degree).
var SET_TEMP_3K = 0x4E|0x80; // SET_TEMP_3K Sets the desired temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0x78 (30 degree). Limits changes to +-3K via the push buttons of the thermostat. Limit is removed with a SET _TEMP command.
var REPORT_SET_TEMP_3K = 0x4F|0x80; // REPORT_SET_TEMP_3K Reports the set temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0x78 (30 degree).
var SET_TEMP_0K = 0x50|0x80; // SET_TEMP_0K Sets the desired temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0x78 (30 degree). No changes possible via the push buttons of the thermostat. Limit is removed with a SET _TEMP command.
var REPORT_SET_TEMP_0K = 0x51|0x80; // REPORT_SET_TEMP_0K Reports the set temperature in units of 0,25 degree in a payload range 0x14 (5 degree) to 0x78 (30 degree).
var SET_MOTOR_POS_BLOCK = 0x52|0x80; // SET_MOTOR_POS_BLOCK Sets a motor position and blocks the motor for manual operation. Blocking is removed with SET_MOTOR_POS.
var REPORT_MOTOR_POS_BLOCK = 0x53|0x80; // REPORT_MOTOR_POS_BLOCK Reports the motor position when the motor is blocked in a payload range 0 ... 200; 0 = fully down, 200 = fully up.
var REQUEST_STATE = 0x54|0x80; // REQUEST_STATE Triggers a module to send its
// state

var devicesDict = {};
var g_syncList = [];
var g_syncListIndex = 0;
var g_SystemState = 'STANDBY'; // ['STANDBY', 'LEARNING', 'SYNCSTATES'];
var neuronIdStringList=[];
var neuronIdStringListIndex = 0;
var port = 0;

//is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
	try {
		if (port)
		{
			// close connection
			port.close(function (error)
					{
				if(error){console.log('OnStop closed ERROR')}
					});
			console.log("SerialPort closed!");
		}
		adapter.log.info('cleaned everything up...');
		callback();
	} catch (e) {
		callback();
	}
});

//is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
	// Warning, obj can be null if it was deleted
	adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

//is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
	// Warning, state can be null if it was deleted
	adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

	// you can use the ack flag to detect if it is status (true) or command (false)
	if (state && !state.ack) {
		adapter.log.info('ack is not set!');
		adapter.log.info(g_SystemState);
		if(id === "learnNewDevices"){
			if(g_SystemState === 'STANDBY')
			{
				g_SystemState = 'LEARNING';
				adapter.log.info(g_SystemState);
				devicesDict = {};
				sendMsg(FIND_DEVICES , [0x0, 0x0], 0x0 );
			}
			else
			{
				adapter.log.info(g_SystemState +' allready running!');
			}
		}
		else if(/^group\.\d+\.\d+\.switch$/.test(id))
		{
			console.log("Group: " + obj.native.group + " Element: "+ obj.native.element + " Switch: " + obj.state.val);
			if(obj.state.val === true)
			{
				sendMsg(ON , [obj.native.group, obj.native.element], 0x00 );
			}
			else
			{
				sendMsg(OFF , [obj.native.group, obj.native.element], 0x00 );
			}
		}
		else if(/^group\.\d+\.\d+\.dimmer$/.test(id))
		{
			console.log("Group: " + obj.native.group + " Element: "+ obj.native.element + " Switch: " + obj.state.val);
			sendMsg(SET_DIM_VALUE , [obj.native.group, obj.native.element], obj.state.val * 2 );
		}
	}
});

//Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
	if (typeof obj == 'object' && obj.message) {
		if (obj.command == 'send') {
			// e.g. send email or pushover or whatever
			console.log('send command');

			// Send response in callback if required
			if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
		}
	}
});

//is called when databases are connected and adapter received configuration. start here!
adapter.on('ready', function () {
	main();
});

function main() {

	// The adapters config (in the instance object everything under the attribute "native") is accessible via adapter.config:
	adapter.log.info('config test1: ' + adapter.config.test1);
	adapter.log.info('config test1: ' + adapter.config.test2);


	/**
	 * 
	 * For every state in the system there has to be also an object of type
	 * state
	 * 
	 * Here a simple sienna for a boolean variable named "testVariable"
	 * 
	 * Because every adapter instance uses its own unique namespace variable
	 * names can't collide with other adapters variables
	 * 
	 */

	adapter.setObject('trigger', {
		type: 'state',
		common: {
			name: 'trigger',
			type: 'number',
			role: 'indicator'
		},
		native: {}
	});

	adapter.setObject('learnNewDevices', {
		type: 'state',
		common: {
			name: 'learnNewDevices',
			type: 'boolean',
			role: 'indicator'
		},
		native: {}
	});


	// in this sienna all states changes inside the adapters namespace are subscribed
	adapter.subscribeStates('*');


	// examples for the checkPassword/checkGroup functions
	adapter.checkPassword('admin', 'iobroker', function (res) {
		console.log('check user admin pw ioboker: ' + res);
	});

	adapter.checkGroup('admin', 'admin', function (res) {
		console.log('check group user admin group admin: ' + res);
	});


	SerialPort.list(function (err, portsList)
			{
		if(err)
		{
			console.log("Error Open Port");
			stopScript();
		}
		portsList.forEach(function(portInfo)
				{
			if(portInfo.vendorId === '0x0403' && portInfo.productId === '0x6001')
			{
				console.log(portInfo.comName);
				console.log(portInfo.pnpId);
				console.log(portInfo.manufacturer);
				console.log(portInfo.serialNumber);
				// console.log(portInfo.locationId);
				console.log(portInfo.vendorId);
				console.log(portInfo.productId);
				port = new SerialPort(portInfo.comName, { baudRate: 9600, parser: SerialPort.parsers.byteLength(13),
					dataBits: 8, stopBits: 1, parity: 'none',
					rtscts: true, xon: true, xoff:true, lock: true }, function (error)
					{
						if(error)
						{
							console.log("Error Open Port");
							stopScript();
						}
						console.log("SerialPort open!");

						// initial all states with the actual actuator state
						if(g_SystemState === 'STANDBY')
						{
							g_SystemState = 'SYNCSTATE';
							console.log(g_SystemState);
							g_syncList = [];
							g_syncListIndex=0;
							//ToDo
//							 $('*.Sienna.group*').each(function (id, i) {
//    							 console.log(id);
//    							 g_syncList.push({'group':getObject(id).native.group, 'element':getObject(id).native.element});
//							 });
							if(g_syncList.length > 0)
							{
								sendMsg(REQUEST_STATE , [g_syncList[0].group, g_syncList[0].element], 0x0 );
							}
							else
							{
								g_SystemState = 'STANDBY';
							}
						}
						else
						{
							console.log(g_SystemState + ' allready running!');
						}

						// serial port events
						port.on('open', function() 
								{
							// port.set({brk:false, cts:true, dsr:true,
							// dtr:true, rts:true});
							port.flush(function(error){});
							console.log('Open');
								});

						port.on('error', function(err)
								{
							console.log('Error: ', err.name);
							port.close(function (error) {
								if(error)
								{
									console.log('Closed ERROR');
								}
							});
								});

						port.on('data', analyzeSerialData);
					});
			}
				});
			});
}

//******************************************************************************
//functions
function analyzeSerialData(data)
{
	if(data[0] === 0x2a && data[12]===0x00)
	{
		adapter.log.info('Data: ' + data.toString('hex'));
		if(data[1]==STATUS_ON)
		{
			// setState (id, state, ack, callback);
			setState("group."+data[2]+"."+data[3]+".switch", true, true);
		}
		else if(data[1]==STATUS_OFF)
		{
			// setState (id, state, ack, callback);
			setState("group."+data[2]+"."+data[3]+".switch", false, true);
		}
		else if(data[1]==SWITCH)
		{
			// do nothing ;-)
			// setState (id, state, ack, callback);
		}
		else if(data[1]==REPORT_DIM_VALUE)
		{
			// setState (id, state, ack, callback);
			setState("group."+data[2]+"."+data[3]+".dimmer", data[4]/2, true);
			if(data[4] > 0)
			{
				setState("group."+data[2]+"."+data[3]+".switch", true, true);
			}
			else
			{
				setState("group."+data[2]+"."+data[3]+".switch", false, true);
			}
		}
		else if(data[1]==DEVICE_FOUND)
		{
			var neuronId = Buffer.from(data.slice(2,8));
			devicesDict[neuronId.toString('hex')] = {address:neuronId}; // neuronID
			// as
			// number
			adapter.log.info(neuronId.toString('hex'));
		}
		else if(data[1]==HELLO_EXTEND_RESPONSE)
		{
			adapter.log.info('HELLO_EXTEND_RESPONSE');
			devicesDict[neuronIdStringList[neuronIdStringListIndex]].group = data[8];
			devicesDict[neuronIdStringList[neuronIdStringListIndex]].element = data[9];
			devicesDict[neuronIdStringList[neuronIdStringListIndex]].typ = data[2];
			devicesDict[neuronIdStringList[neuronIdStringListIndex]].SWtyp = data[3];
			createStateForDevice(devicesDict[neuronIdStringList[neuronIdStringListIndex]]);
			if(g_SystemState === 'LEARNING')
			{   
				neuronIdStringListIndex++;
				if(neuronIdStringListIndex < neuronIdStringList.length )
				{
					sendMsg(HELLO_DEVICE , devicesDict[neuronIdStringList[neuronIdStringListIndex]].address, 0x0 );
				}
				else
				{
					adapter.log.info('learnNewDevices finished');
					g_SystemState = 'STANDBY';
				}
			}
		}
		else if(data[1]==FIND_END)
		{
			neuronIdStringList = Object.keys(devicesDict);
			neuronIdStringListIndex = 0;
			sendMsg(HELLO_DEVICE , devicesDict[neuronIdStringList[0]].address, 0x0 );
		}
		else
		{
			adapter.log.info('Data unknown: ' + data.toString('hex'));
		}

		if(g_SystemState === 'SYNCSTATE')
		{   
			g_syncListIndex++;
			if(g_syncListIndex < g_syncList.length )
			{
				sendMsg(REQUEST_STATE , [g_syncList[g_syncListIndex].group, g_syncList[g_syncListIndex].element], 0x0 );
			}
			else
			{
				adapter.log.info(g_SystemState + ' finished');
				g_SystemState = 'STANDBY';
			}
		}
	}
	else
	{
		adapter.log.info('Data Error: ' + data.toString('hex'));
		port.flush();
		// port.flush(function(error){ adapter.log.info('Data Error: ' +
		// port.read().toString('hex'));});
	}
}

function writeAndDrain (data, callback)
{
	port.write(data, function () {
		port.drain(callback);
	});
}

function sendMsg( command, address, payload )
{
	var msg = Buffer.from([0x2a, command, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x98/* crc */, 0x00 ]);
	if(command & 0x80 )
	{
		msg[2] = address[0];
		msg[3] = address[1];
		msg[4] = payload;
	}
	else
	{
		msg[2] = address[0];
		msg[3] = address[1];
		msg[4] = address[2];
		msg[5] = address[3];
		msg[6] = address[4];
		msg[7] = address[5];
		msg[8] = payload[0];
		msg[9] = payload[1];
		msg[10] = payload[2];
	}
	var crc=0;
	for(var index=1; index < 11; index++)
	{
		var inByte = msg[index];
		for( var bit=0; bit<8; bit++ )
		{
			var mix=(crc & 0x01)^(inByte & 0x01);
			crc>>=1;
			if(mix)
			{
				crc ^= 0x8c;
			}
			inByte >>= 1;
		}
	}
	msg[11] = crc;
	writeAndDrain(msg);
	// adapter.log.info( msg.toString('hex'));
}

function createStateForDevice( siennaDevice )
{
	// adapter.log.info(JSON.stringify(siennaDevice));
	if(siennaDevice.typ === 100 && siennaDevice.SWtyp === 3) // 100 = SAMDR
		// (tested)
	{
		adapter.log.info('SAMDR found: Create state, if not found!')
//		createState("group."+siennaDevice.group+"."+siennaDevice.element+ ".dimmer",
//		0, 0,
//		{type: "number", name: "Dimmer"+siennaDevice.group+"."+siennaDevice.element,
//		read: true, write: true, min: 0, max: 100},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ,
//		group:siennaDevice.group, element:siennaDevice.element});

//		adapter.createState(siennaDevice.group, siennaDevice.element, "dimmer",
//		{type: "number", name: "Dimmer"+siennaDevice.group+"."+siennaDevice.element, role: "indicator", read: true, write: true, min: 0, max: 100},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
		adapter.setObjectNotExists("group."+siennaDevice.group+"."+siennaDevice.element+ ".dimmer", {
			type: 'state',
			common: {
				name: "Dimmer"+siennaDevice.group+"."+siennaDevice.element,
				type: 'number',
				role: 'indicator',
				read: true,
				write: true,
				min: 0,
				max: 100
			},
			native: {
				neuronId: siennaDevice.address.toString('hex'),
				deviceTyp: siennaDevice.typ,
				group:siennaDevice.group,
				element:siennaDevice.element
			}
		});

//		createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch",
//		false, 0,
//		{type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element,
//		write: true},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ,
//		group:siennaDevice.group, element:siennaDevice.element});
		adapter.setObjectNotExists("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", {
			type: 'state',
			common: {
				name: "Switch"+siennaDevice.group+"."+siennaDevice.element,
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true
			},
			native: {
				neuronId: siennaDevice.address.toString('hex'),
				deviceTyp: siennaDevice.typ,
				group:siennaDevice.group,
				element:siennaDevice.element
			}
		});
	}
	if(siennaDevice.typ === 99 && siennaDevice.SWtyp === 3) // 99 = SAM2L
		// (tested)
	{
		adapter.log.info('SAM2L found: Create state, if not found!')
//		createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", false, 0,
//		{type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element, write: true},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
		adapter.setObjectNotExists("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", {
			type: 'state',
			common: {
				name: "Switch"+siennaDevice.group+"."+siennaDevice.element,
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true
			},
			native: {
				neuronId: siennaDevice.address.toString('hex'),
				deviceTyp: siennaDevice.typ,
				group:siennaDevice.group,
				element:siennaDevice.element
			}
		});

//		createState("group."+siennaDevice.group+"."+(siennaDevice.element+1) + ".switch", false, 0,
//		{type: "boolean", name: "Switch"+siennaDevice.group+"."+(siennaDevice.element+1), write: true},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:(siennaDevice.element+1)});
		adapter.setObjectNotExists("group."+siennaDevice.group+"."+(siennaDevice.element+1) + ".switch", {
			type: 'state',
			common: {
				name: "Switch"+siennaDevice.group+"."+(siennaDevice.element+1),
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true
			},
			native: {
				neuronId: siennaDevice.address.toString('hex'),
				deviceTyp: siennaDevice.typ,
				group:siennaDevice.group,
				element:(siennaDevice.element+1)
			}
		});
	}
	if(siennaDevice.typ === 97 && siennaDevice.SWtyp === 1) // 97 = SAM1L
		// (tested)
	{
		adapter.log.info('SAM1L found: Create state, if not found!')
//		createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", false, 0,
//		{type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element, write: true},
//		{neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
		adapter.setObjectNotExists("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", {
			type: 'state',
			common: {
				name: "Switch"+siennaDevice.group+"."+siennaDevice.element,
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true
			},
			native: {
				neuronId: siennaDevice.address.toString('hex'),
				deviceTyp: siennaDevice.typ,
				group:siennaDevice.group,
				element:siennaDevice.element
			}
		});

		// Set Switch-Typ to native switchTyp value, if defined
		adapter.getObject("group."+siennaDevice.group+"."+siennaDevice.element + ".switch",
				function (err, obj)
				{
			if (err) adapter.log.error('Cannot get object: ' + err)
			else if(obj.native.hasOwnProperty("switchTyp"))
			{
				adapter.log.info('SET_SW_POS to ' + obj.native.switchTyp)
				sendMsg(SET_SW_POS , siennaDevice.address, [obj.native.switchTyp, 0x00, 0x00] ); // set
			}
			else
			{
				adapter.log.info("switchTyp not defined. Leave actual setting.")
			}
				}
		)
	}
}

