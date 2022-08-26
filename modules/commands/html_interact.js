const { Console } = require("console");
const secure = require("../../modules/secure.js");

const axios = require("axios");
const twitchBot = require("../../modules/twitch_bot.js");

var options =
{
	verboseLogging : false
};

function SendHTTP(method, url, args, headers, callback, logUponError = true)
{
	Log("sending http");

	try
	{		
		// Get basic argument data here
		var argCount = (args == null) ? 0 : args.length;
		if(argCount > 0)
		{
			url += '?';

			// Loop through arguments and add them
			for(var i = 0; i < argCount; ++i)
			{
				var arg = args[i];
				url += arg.key + '=' + arg.value;

				if(i < argCount - 1)
				{
					url += '&';
				}
			}
		}
		
		var http = 
		{
			method: method,
			url: url,
			headers: headers
		};
		
		//var json = JSON.stringify(http);
		//Log(json);

		
		axios(http).catch((error)=>
		{
			if(logUponError)
				console.log(error);
		}).then((response)=>
		{
			if(callback != null)
				callback(response);
		});
	}
	catch(e)
	{
		console.log(e);
	}
}

function SendBarkBotUpdateHTTP(method, url, functionName, args, headers = null)
{
	try
	{
		Log("Running command function " + functionName);
		url += "?function=" + functionName;
		
		// Get basic argument data here
		var argCount = (args == null) ? 0 : args.length;
		url += "&argCount=" + argCount;
		
		/*
		// The following is not supported by GET.
		// Don't quite know what it does, so for now it's removed.
		var argumentsObject =
		{
			function : functionName,
			argCount : argCount
		};*/
		
		
		// Loop through arguments and add them
		for(var i = 0; i < argCount; ++i)
		{
			//data["args" + i] = args[i];
			url += "&arg" + i + "=" + args[i];
		}
		
		var http = 
		{
			method: method,
			url: url,
			headers: headers
		};
		
		Log(http);
		
		axios(http).then((response)=>
		{
			console.log(response.data);
		});
	}
	catch(e)
	{
		console.log(e);
	}
}

function SendBarkBotCommand(functionName, args)
{
	SendBarkBotUpdateHTTP("get", "http://thebarkingotter.com/sandbox/bot/updateContent.php", functionName, args);
}

function Log(message)
{
	if(options.verboseLogging)
		console.log(message);
}

function ToggleBox(command)
{
	Log(command);
	SendBarkBotCommand("ToggleBox", command.arguments);
}

function BarkBotSays(command)
{
	Log(command);
	if(command.arguments == null || command.arguments.length == 0)
	{
		twitchBot.Say(command.channel, "what do you want the barkbot to say??");
		return;
	}
	SendBarkBotCommand("BarkBotSays", command.arguments);
}

function Stamp(command)
{
	SendBarkBotCommand("Stamp", command.arguments);
}

function StampNames(command)
{
	SendBarkBotCommand("StampNames", command.arguments);
}

function StampBomb(command)
{
	SendBarkBotCommand("StampBomb", command.arguments);
}

function PrideFlag(command)
{
	SendBarkBotCommand("PrideFlag", command.arguments);
}

function FlagNames(command)
{
	SendBarkBotCommand("FlagNames", command.arguments);
}

function FlagBomb(command)
{
	SendBarkBotCommand("FlagBomb", command.arguments);
}

function UpdateEventText(command)
{
	if(command.SenderIsBroadcasterOrMod() == false)
		return;

	SendBarkBotCommand("UpdateEventText", command.arguments);
}

function AddGiveawayEntry(command)
{
	if(command.SenderIsBroadcasterOrMod() == false)
		return;

	SendBarkBotCommand("AddGiveawayEntry", command.arguments);
}

/*
headers:
{
	'Authorization':'Bearer 3kh5stntakwqu3mt9ge4xqosx77pui',
	'Client-Id':'rat7tckwdp2962ahwqlorv2qg4lzcr'
}
*/

// Expose public functions
module.exports =
{
	commands:
	{
		//"!togglebox" : ToggleBox,
		"!barkbotsays" : BarkBotSays,
		"!stamp" : Stamp,
		"!stampnames" : StampNames,
		"!stampbomb" : StampBomb,
		"!flyyourflags" : PrideFlag,
		"!flagnames" : FlagNames,
		"!flagbomb" : FlagBomb,
		"!updateeventtext" : UpdateEventText,
		"!addgiveawayentry" : AddGiveawayEntry
	},

	StampBomb, SendHTTP
};