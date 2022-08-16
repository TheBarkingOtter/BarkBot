const secure = require("./secure.js");

const barkConsole = require("./twitch_bot_console.js");
const filesystem = require("fs");
const jsonUtility = require("./json_utility.js");
const logFile = require("./log_file.js");
const tmi = require(secure.ModulePath + "tmi.js");

// Global variables
var client = null;
function GetClient() { return client; }

var commandMap = [];
var greetingMap = [];
var commandCallbacks = [];
let channels = null;

var options =
{
	greetingDelay : 2000,
	useSlashMe : true
}

var functionMap =
{
	Say: Say,
	Disconnect: Disconnect,
	ParseCommand : ParseCommand,
	GetClient: GetClient
};

/*
tmi UserState schema example:
{
  'badge-info': { subscriber: '7' },
  badges: { moderator: '1', subscriber: '6', bits: '1000' },
  'client-nonce': '78566cceffeddba0e4186cf1e6b310f1',
  color: '#52B319',
  'display-name': 'TheBarkingOtter',
  emotes: null,
  flags: null,
  id: '64d85a74-5321-4ff3-840d-071df8e0dc7e',
  mod: true,
  'room-id': '152394564',
  subscriber: true,
  'tmi-sent-ts': '1611692767097',
  turbo: false,
  'user-id': '178277905',
  'user-type': 'mod',
  'emotes-raw': null,
  'badge-info-raw': 'subscriber/7',
  'badges-raw': 'moderator/1,subscriber/6,bits/1000',
  username: 'thebarkingotter',
  'message-type': 'chat'
}

*/

/////////////////////////////////////////////////////
// tmi client option schema
/////////////////////////////////////////////////////
class ClientOptions
{
	constructor(identity, channels)
	{
		this.identity = identity;
		this.channels = channels;
	}
}

/////////////////////////////////////////////////////
// Stores a greeting message and tracks whether it
// has yet triggered.
/////////////////////////////////////////////////////
class GreetingState
{
	constructor(message)
	{
		this.hasTriggered = false;
		this.message = message;
	}
}

/////////////////////////////////////////////////////
// Generic command object.
/////////////////////////////////////////////////////
class Command
{
	constructor(client, channel, name, args)
	{
		this.client = client;
		this.channel = channel;
		this.name = name;
		this.arguments = args;
		this.senderState = null;
	}
	
	static Parse(client, channel, commandAndArgs, senderState = null)
	{
		var cmd = new Command(client, channel, commandAndArgs.shift(), commandAndArgs);
		cmd.senderState = senderState;
		return cmd;
	}

	SenderIsBroadcaster = function()
	{
		return this.senderState.badges.broadcaster == '1';
	}

	SenderIsMod = function()
	{
		return this.senderState.badges.moderator == '1';
	}

	SenderIsBroadcasterOrMod()
	{
		return this.SenderIsBroadcaster() || this.SenderIsMod();
	}
}

/////////////////////////////////////////////////////////////////////
// Parses a config file. See template_config.txt for expected format.
/////////////////////////////////////////////////////////////////////
function ParseConfig(filePath)
{
	if(filesystem.existsSync(filePath))
	{
		const configString = filesystem.readFileSync(filePath, {encoding:'utf8', "flag": 'rs'});
		const configMap = jsonUtility.RemoveCommentsAndParse(configString);
		
		//TODO: Need to remember greetings in a log file
		AddGreetings(configMap.greetings);
		options.greetingDelay = configMap.greetingDelay;
		options.useSlashMe = configMap.useSlashMe;

		return configMap;
	}
}

/////////////////////////////////////////////////////////////////
// Adds all greetings from a greeting map into the global one here.
// Used to append new greetings to the map that will be used.
// Maps should be in the form 'userName' : 'message' .
/////////////////////////////////////////////////////////////////
function AddGreetings(greetingMapToAdd)
{
	for(greeting in greetingMapToAdd)
	{
		greetingMap[greeting] = new GreetingState(greetingMapToAdd[greeting]);
	}
}

/////////////////////////////////////////////////////////////////
// Adds all commands from a command map into the global one here.
// Used to append new commands to the map that will be used.
// Maps should be in the form 'commandName' : function() .
/////////////////////////////////////////////////////////////////
function AddCommands(commandMapToAdd)
{
	for(command in commandMapToAdd)
	{
		commandMap[command] = commandMapToAdd[command];
	}
}

/////////////////////////////////////////////////////
// Creates a client object and returns it.
/////////////////////////////////////////////////////
function CreateClient(identity, _channels)
{
	channels = _channels;

	// Create a client with our options
	const opts = new ClientOptions(identity, channels);
	client = new tmi.client(opts);
	return client;
}

/////////////////////////////////////////////////////
// Connects the client and runs in interactive mode.
/////////////////////////////////////////////////////
function ConnectAndRun()
{	
	// Register our event handlers (defined below)
	client.on('message', OnChatMessage);
	client.on('connected', OnConnected);


	// Connect to Twitch:
	client.connect();
}

/////////////////////////////////////////////////////
// Called every time the bot connects to Twitch chat
/////////////////////////////////////////////////////
function OnConnected (addr, port)
{
	console.log(`* Connected to ${addr}:${port}`);

	barkConsole.Run(functionMap);
}

/////////////////////////////////////////////////////
// Called every time a message comes in
/////////////////////////////////////////////////////
function OnChatMessage (channel, user, message, sentBySelf)
{
	// Ignore whispers which will also be caught.
	if (user["message-type"] == "whisper")
	  return;

	logFile.Log(channel, user.username + ":" + message);

	// Ignore messages from the bot
	if (sentBySelf || user["message-type"] == "whisper")
	  return;
	
	// Determine if any greetings are needed
	for(let name in greetingMap)
	{
		if(user.username == name)
		{
			var greeting = greetingMap[name];
			if(greeting.hasTriggered == false)
			{
				setTimeout(function(){ Say(channel, greeting.message); }, options.greetingDelay);
				greeting.hasTriggered = true;
			}
			break;
		}
	}

	ParseCommand(channel, message, user);
}

/////////////////////////////////////////////////////
// Parses a command. Can be used to issue a command
// without chatting.
/////////////////////////////////////////////////////
function ParseCommand(channel, message, senderState)
{
	// Parse the command
	const words = message.split(' ');
	var command = Command.Parse(client, channel, words, senderState);
	
	// Determine if any commands were used
	for(commandName in commandMap)
	{
		if(command.name.toLowerCase() == commandName)
		{
			commandMap[commandName](command);
			for(let prop in commandCallbacks)
			{
				commandCallbacks[prop](command);
			}
			break;
		}
	}
}

/////////////////////////////////////////////////////
// Registers a callback when a command fires.
// Callbacks should have the form void(Callback)
/////////////////////////////////////////////////////
function RegisterCommandCallback(callback)
{
	commandCallbacks.push(callback);
}

/////////////////////////////////////////////////////
// Says the message in chat, adding /me if that option
// is enabled.
/////////////////////////////////////////////////////
function Say(channel, message)
{
	if(options.useMe)
	{
		client.say(channel, "/me" + message);
	}
	else
	{
		client.say(channel, message);
	}
}

function IsRunning()
{
	return client.readyState() != "CLOSED";
}

function Disconnect()
{
	client.disconnect();
}

// Expose public methods here
module.exports =
{
	channels,
	options,
	GetClient,
	ParseConfig,
	AddGreetings,
	AddCommands,
	CreateClient,
	ConnectAndRun,
	ParseCommand,
	RegisterCommandCallback,
	Say,
	IsRunning,
	Disconnect
};
