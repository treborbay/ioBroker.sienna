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
const SerialPort = require("serialport");
const ByteLength = SerialPort.parsers.ByteLength;
var restartPort=true;
//const Ready = SerialPort.parsers.Ready;

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
//explizit messages
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
var responseTimeoutID = 0;
var syncTimeoutID = 0;
var msgK1 = Buffer.from([0x2a, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x98/* crc */, 0x00 ]);
var msgTimestampK1 = 0;

//is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        if (port)
        {
            restartPort = false;
            // close connection
            port.close(function (error)
                    {
                if(error){adapter.log.info('OnStop closed ERROR')}
                    });
            adapter.log.info("SerialPort closed!");
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
    adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack)
    {
        adapter.log.debug('ack is not set!');
        adapter.log.debug(g_SystemState);
        if(id === "sienna.0.learnNewDevices" && state.val === true ){
            if(g_SystemState === 'STANDBY')
            {
                g_SystemState = 'LEARNING';
                adapter.log.debug(g_SystemState);
                devicesDict = {};
                sendMsg(FIND_DEVICES , [0x0, 0x0], 0x0 );
            }
            else
            {
                adapter.log.info(g_SystemState +' allready running!');
            }
        }
        else if(/^sienna.0.group\.\d+\.\d+\.switch$/.test(id))
        {
            //adapter.get
            adapter.getObject(id,
                function(err,obj)
                {
                    //adapter.log.info(JSON.stringify(obj.state.val));
                    // adapter.log.info(JSON.stringify(obj));
                    adapter.log.info("Group: " + obj.native.group + "; Element: "+ obj.native.element + "; Switch: " + state.val);
                    if(state.val === true)
                    if(state.val === true)
                    {
                        sendMsg(ON , [obj.native.group, obj.native.element], 0x00 );
                        adapter.log.debug('on gesendet ');
                    }
                if(state.val === 1)
                    {
                        sendMsg(GO_DOWN , [obj.native.group, obj.native.element], 0x00 );
                    }

                if(state.val === 2)
                    {
                        sendMsg(GO_UP , [obj.native.group, obj.native.element], 0x00 );
                    }

                if (state.val === false || state.val === 0)
                    {
                        sendMsg(OFF , [obj.native.group, obj.native.element], 0x00 );
                        adapter.log.debug('off gesendet');
                    }
                }
            );
        }
        else if(/^sienna.0.group\.\d+\.\d+\.dimmer$/.test(id))
        {
          adapter.getObject(id,
                  function(err,obj)
                  {
                      adapter.log.info("Group: " + obj.native.group + "; Element: "+ obj.native.element + "; Dimmer: " + state.val);
                      sendMsg(SET_DIM_VALUE , [obj.native.group, obj.native.element], state.val * 2 );
                  }
          );
        }
    }
});

//Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            adapter.log.info('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

//is called when databases are connected and adapter received configuration. start here!
adapter.on('ready', function () {
    main();
});


//******************************************************************************
//functions
function main() {

    // The adapters config (in the instance object everything under the attribute "native") is accessible via adapter.config:
    adapter.log.info('config LearnNewDevices: ' + adapter.config.LearnNewDevices);
    adapter.config.instancename = 'system.adapter.' + adapter.namespace;
    adapter.log.info("Et: " +adapter.config.instancename);
    //adapter.setForeignObject(adapter.config.instancename + ".native", {'LearnNewDevices':true});
    //ToDo create state  
    //      JSON.stringify(obj)
    //                if (!obj || !obj.common) {
    //                    callback && callback('Unknown ID: ' + data.id);
    //            } else {
    //adapter.config.LearnNewDevices = false;

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


//  // examples for the checkPassword/checkGroup functions
//  adapter.checkPassword('admin', 'iobroker', function (res) {
//      adapter.log.info('check user admin pw ioboker: ' + res);
//  });
//
//  adapter.checkGroup('admin', 'admin', function (res) {
//      adapter.log.info('check group user admin group admin: ' + res);
//  });


    SerialPort.list().then (portsList =>
            {
//        if(err)
//        {
//            adapter.log.info("Error Open Port");
//            stopScript();
//        }
        portsList.forEach(function(portInfo)
        {
//            adapter.log.info(portInfo.comName);
//            adapter.log.info(portInfo.pnpId);
//            adapter.log.info(portInfo.manufacturer);
//            adapter.log.info(portInfo.serialNumber);
//            // adapter.log.info(portInfo.locationId);
//            adapter.log.info(portInfo.vendorId);
//            adapter.log.info(portInfo.productId);
            if((portInfo.vendorId === '0403' && portInfo.productId === '6001') || (portInfo.vendorId === '0x0403' && portInfo.productId === '0x6001'))
            {
                adapter.log.info(portInfo.path);
                adapter.log.info(portInfo.pnpId);
                adapter.log.info(portInfo.manufacturer);
                adapter.log.info(portInfo.serialNumber);
                // adapter.log.info(portInfo.locationId);
                adapter.log.info(portInfo.vendorId);
                adapter.log.info(portInfo.productId);
                port = new SerialPort(portInfo.path, { baudRate: 9600, // parser: SerialPort.parsers.byteLength(13),
                    dataBits: 8, stopBits: 1, parity: 'none',
                    rtscts: true, xon: true, xoff:true, lock: true },
                    function (error)
                    {
                        if(error)
                        {
                            adapter.log.info("Error Open Port");
                            stopScript();
                        }
                        port.flush();
                        var byteLengthParser = new ByteLength({length: 13})
                        const parser = port.pipe(byteLengthParser);
                        //const parser = port.pipe(new Ready({data: 13}));
                        adapter.log.info("SerialPort open!");

                        // initial all states with the actual actuator state
                        startSyncstate();

                        // serial port events
                        port.on('open',
                            function() 
                                {
                                    // port.set({brk:false, cts:true, dsr:true,
                                    // dtr:true, rts:true});
                                    adapter.log.info('Open');
                                });

                        port.on('error',
                            function(err)
                            {
                                adapter.log.info('Error: ', err.name);
                                port.close();
//                                  function (error)
//                                  {
//                                      if(error)
//                                      {
//                                          adapter.log.info('Closed ERROR');
//                                      }
//                                  });
                            });
                        port.on('close',
                                  function(err)
                                  {
                                    if(err)
                                    {
                                        process.exit(-100);
                                        return;
                                    }
                                    if (restartPort)
                                    {
                                      clearTimeout(responseTimeoutID);
                                      clearTimeout(syncTimeoutID);
                                      g_SystemState = 'STANDBY'
                                      byteLengthParser = new ByteLength({length: 13})
                                      port.open(startSyncstate())
                                    }
                                  });
                        parser.on('data', analyzeSerialData);
                    });
            }
                });
            });
};

function startSyncstate()
{
    if(g_SystemState === 'STANDBY')
    {
        g_SystemState = 'SYNCSTATE';
        adapter.log.info(g_SystemState);
        g_syncList = [];
        g_syncListIndex=0;
        adapter.getStates('group.*',
            function (err, states)
            {
                for(var id in states)
                {
                    g_syncList.push(id);
                }
                if(g_syncList.length>0)
                {
                    sendRequest(g_syncList[0]);
                    adapter.log.info(g_SystemState + ' syncTimeout watchdog started');
                    syncTimeoutID = setTimeout(function () {port.close;}, 9000);
                }
                else
                {
                    adapter.log.info('No Sienna Devices known! Please learn new devices!');
                    adapter.log.info(g_SystemState + ' finished');
                    g_SystemState = 'STANDBY';
                }
            });
    }
    else
    {
        adapter.log.info(g_SystemState + ' allready running!');
    }
};

function sendRequest(id)
{
   adapter.getObject(id,
       function(err,obj)
       {
           if(err)
           {
               adapter.log.info("ERROR <sendRequest>: invalid id");
           }
           adapter.log.debug(JSON.stringify(obj));
           //g_syncListIndex++;
           sendMsg(REQUEST_STATE , [obj.native.group, obj.native.element], 0x0 );
       });
};

function responseTimeout(data)
{
    writeAndDrain (data, 
    function()
    {
       adapter.log.info( 'Repeat send msg: ' + msg.toString('hex'));
    });
};

function analyzeSerialData(data)
{
    if(responseTimeoutID != 0)
    {
        adapter.log.info( 'Clear Timeout');
        clearTimeout(responseTimeoutID);            
    }

    if(data[0] === 0x2a && data[12]===0x00)
    {
        adapter.log.info('Recv Data: ' + data.toString('hex'));
        if(data[1]==STATUS_ON)
        {
            // adapter.setState (id, state, ack, callback);
            adapter.setState("group."+data[2]+"."+data[3]+".switch", true, true);
        }
        else if(data[1]==STATUS_OFF)
        {
            // adapter.setState (id, state, ack, callback);
            adapter.setState("group."+data[2]+"."+data[3]+".switch", false, true);
        }
        else if(data[1]==SWITCH)
        {
            adapter.log.debug("SWITCH Toggle")
            // do nothing ;-)
        }
        else if(data[1]==GO)
        {
            adapter.log.debug("GO Push button released")
            // do nothing ;-)
        }
        else if(data[1]==STOP_GO)
        {
            adapter.log.debug("STOP_GO Push button released")
            // do nothing ;-)
        }
        else if(data[1]==REPORT_DIM_VALUE)
        {
            // adapter.setState (id, state, ack, callback);
            adapter.setState("group."+data[2]+"."+data[3]+".dimmer", data[4]/2, true);
            if(data[4] > 0)
            {
                adapter.setState("group."+data[2]+"."+data[3]+".switch", true, true);
            }
            else
            {
                adapter.setState("group."+data[2]+"."+data[3]+".switch", false, true);
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
        else if(data[1]==COMM_ERROR_SERIAL)
        {
            adapter.log.info('COMM_ERROR_SERIAL');
            g_SystemState = 'STANDBY';
        }
        else
        {
            adapter.log.info('Data unknown: ' + data.toString('hex'));
        }
        if(g_SystemState === 'SYNCSTATE')
        {   
            //adapter.log.info(g_syncListIndex + '<' + g_syncList.length);
            g_syncListIndex++;
            if(g_syncListIndex < g_syncList.length )
            {
                sendRequest(g_syncList[g_syncListIndex]);
            }
            else
            {
                //ToDo: asynchron only after receive message valid adapter.log.info(g_SystemState + ' finished');
                g_SystemState = 'STANDBY';
                adapter.log.info('SYNCSTATE finished');
                clearTimeout(syncTimeoutID);
                adapter.log.info(g_SystemState);
            }
        }
    }
    else
    {
        adapter.log.info('Data Error: ' + data.toString('hex'));
        g_SystemState = 'STANDBY'
        //port.pause();
        //byteLengthParser = new ByteLength({length: 13})
        //port.resume();
        port.close();
//      setTimeout(function () {
//            process.exit(-100); // simulate scheduled restart
//        }, 500);
        
//      port.pause();
//        port.flush();
//        while(port.read() != null)
//        {
//            adapter.log.info("SerialPort empty buffer!");
//        }
//      parser = port.pipe(new ByteLength({length: 13}));
//      port.resume();
//      adapter.log.info('Parser Reset finish!');
//      //setTimeout(function () {
//        //    process.exit(-100); // simulate scheduled restart
//        //}, 5000);
//        g_SystemState = 'STANDBY';
//        startSyncstate();
        // port.flush();
        // port.flush(function(error){ adapter.log.info('Data Error: ' +
        // port.read().toString('hex'));});
    }
};

function writeAndDrain (data, callback)
{
    port.write(data);
    port.drain(callback);
};

function sendMsg( command, address, payload )
{
    var msg = Buffer.from([0x2a, command, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x98/* crc */, 0x00 ]);
    var msgTimestamp = Date.now();
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
    
    //Entprellung für 200 ms z.B für mobileUI state change 
    if( msgK1.equals(msg) && (msgTimestamp - msgTimestampK1)< 200)
    {
        adapter.log.info( 'Double send msg. Second msg ignored!');
        return;
    }
    
    msgK1 = msg;
    msgTimestampK1 = msgTimestamp;
    writeAndDrain(msg, 
    function()
    {
       adapter.log.info( 'Send msg: ' + msg.toString('hex'));
    });
    responseTimeoutID = setTimeout(writeAndDrain, 2000, msg, output);
};

function output()
{
    adapter.log.info( 'Timeout send msg! Repeat');
}

function createStateForDevice( siennaDevice )
{
   if(siennaDevice.typ === 70 && siennaDevice.SWtyp === 1) // 70 = AM1C
        // (tested)
    {
        adapter.log.info('AM1C found: Create state, if not found!')
//      createState("group."+siennaDevice.group+"."+siennaDevice.element+ ".dimmer",
//      0, 0,
//      {type: "number", name: "Dimmer"+siennaDevice.group+"."+siennaDevice.element,
//      read: true, write: true, min: 0, max: 100},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ,
//      group:siennaDevice.group, element:siennaDevice.element});

//      adapter.createState(siennaDevice.group, siennaDevice.element, "dimmer",
//      {type: "number", name: "Dimmer"+siennaDevice.group+"."+siennaDevice.element, role: "indicator", read: true, write: true, min: 0, max: 100},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
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

//      createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch",
//      false, 0,
//      {type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element,
//      write: true},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ,
//      group:siennaDevice.group, element:siennaDevice.element});
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




  if(siennaDevice.typ === 99 && siennaDevice.SWtyp === 2) // 99 = SAM2
        // (tested)
    {
        adapter.log.info('SAM2 found: Create state, if not found!')
//      createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", false, 0,
//      {type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element, write: true},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
        adapter.setObjectNotExists("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", {
            type: 'state',
            common: {
                name: "Rollo"+siennaDevice.group+"."+siennaDevice.element,
                type: 'number',
                role: 'state',
                read: true,
                write: true,
                states: {       "0": "STOP",
                                "1": "DOWN",
                                "2": "UP"
                           }
            },
            native: {
                neuronId: siennaDevice.address.toString('hex'),
                deviceTyp: siennaDevice.typ,
                group:siennaDevice.group,
                element:siennaDevice.element
            }
        });

    }


    if(siennaDevice.typ === 65 && siennaDevice.SWtyp === 1) // 65 = AM1
        // (tested)
    {
        adapter.log.info('AM1 found: Create state, if not found!')
//      createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", false, 0,
//      {type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element, write: true},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
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
        // caution setObject asyncron => so obj.native could be not valid. Only valid in the second run
        adapter.log.info("group."+siennaDevice.group+"."+siennaDevice.element + ".switch")
        adapter.getObject("group."+siennaDevice.group+"."+siennaDevice.element + ".switch",
                function (err, obj)
                {
                    if(obj)
                    {
                        //adapter.log.info(err)
                        //adapter.log.info(JSON.stringify(obj.native))
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
                }
        )
    }

    if(siennaDevice.typ === 97 && siennaDevice.SWtyp === 1) // 97 = SAM1L
        // (tested)
    {
        adapter.log.info('SAM1L found: Create state, if not found!')
//      createState("group."+siennaDevice.group+"."+siennaDevice.element + ".switch", false, 0,
//      {type: "boolean", name: "Switch"+siennaDevice.group+"."+siennaDevice.element, write: true},
//      {neuronId: siennaDevice.address.toString('hex'), deviceTyp: siennaDevice.typ, group:siennaDevice.group, element:siennaDevice.element});
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
        // caution setObject asyncron => so obj.native could be not valid. Only valid in the second run
        adapter.log.info("group."+siennaDevice.group+"."+siennaDevice.element + ".switch")
        adapter.getObject("group."+siennaDevice.group+"."+siennaDevice.element + ".switch",
                function (err, obj)
                {
                    if(obj)
                    {
                        //adapter.log.info(err)
                        //adapter.log.info(JSON.stringify(obj.native))
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
                }
        )
    }
};

