const filesystem = require("fs");
const jsonUtility = require("./json_utility");
const logConsole = require("./log_console.js");
const logFile = require("./log_file.js");
const twitchApi = require("./commands/overlays/twitchAPI.js");
const twitchBot = require("./twitch_bot.js");
const overlay = require("./commands/overlays/overlay.js");
//const { channel } = require("diagnostics_channel");

// format: channelString : pathString
var logPathMap = { };
let guestbookPathMap = { };
let firstTimeChatCallbacks = new Set();

///////////////////////////////////////////////////////////
// Encapsulates the start and end of a chatter's activity.
///////////////////////////////////////////////////////////
class Chatter
{
	constructor(joinTime)
	{
		this.joinTime = joinTime;
		this.isPresent = true;
		this.departTime = (new Date());
		this.isLurking = true;
	}
	
	static Depart(chatterInstance)
	{
		chatterInstance.isPresent = false;
		chatterInstance.departTime = (new Date());
	}
}

// A map of users currently logged into chat. This includes lurkers.
let userMap = {};

// An array of all users who've sent at least one message on this date.
let nonlurkers = [];

// An array of all users that have ever spoken in chat. Gets written to a file.
let guestbook = [];

///////////////////////////////////////////////////////////
// Initializes chatter tracking.
// Log files will be written to logDirectory.
///////////////////////////////////////////////////////////
function Initialize(bot, logDirectory)
{
	if(bot == null || bot.GetClient() == null)
	{
		console.log("unable to initialize chatter_list: twitch_bot client is null");
		return;
	}
	
	// Assign file name.
	var startDate = new Date();
	var year = startDate.getFullYear();
	var month = startDate.getMonth() + 1;
	if(month < 10)
		month = "0" + month;
	var day = startDate.getDate();
	if(day < 10)
		day = "0" + day;
		
	// For each channel the bot is attached to, read if a log file for today 
	// already exists, and if so parse it.
	var botOptions = bot.GetClient().getOptions();
	for(var index in botOptions.channels)
	{
		let channelName = botOptions.channels[index];

		// If there's already a guestbook, get recent stream data for
		// everyone in there. This gets sent to the overlays for shoutouts.
		guestbookPathMap[channelName] = logDirectory + "/guestbook_" + channelName + ".txt";
		if(filesystem.existsSync(guestbookPathMap[channelName]))
		{
			filesystem.readFile(guestbookPathMap[channelName], options, async(error, fileContents)=>
			{
				if(error)
					throw error;

				try
				{
					let json = JSON.parse(fileContents);
					let str = '["' + json[0];
					for(let i = 1; i < json.length; ++i)
					{
						//TODO: we can do extra processing or culling here
						str += '","' + json[i];
					}
					str += '"]';
					json = await twitchApi.UpdateRecentStreamData(str);
					for(let property in json)
					{
						guestbook.push(property);
					}
				}
				catch(e)
				{
					var message = e.message;
					var lastSpace = message.lastIndexOf(' ');
					var lineNumberString = message.substring(lastSpace + 1);
					var lineNumber = parseInt(lineNumberString);
					var substring = fileContents.substring(lineNumber - 10);
					console.log(message);
					console.log(substring);
				}

				console.log("successfully parsed guestbook for channel", channelName);
			});
		}



		console.log("Initializing chatter list for ", channelName);
		var logPath = logDirectory + "/users_" + channelName + '_' + year + month + day + ".txt";
		
		logPathMap[channelName] = logPath;

		var options = {
			encoding: "ascii"
		};
		
		if(filesystem.existsSync(logPath))
		{
			// read the file into memory
			filesystem.readFile(logPath, options, (error, fileContents)=>
			{
				if(error)
					throw error;

				var jsonFix = jsonUtility.FixBracePairingProblems(fileContents);
				if(jsonFix.didChange)
				{
					fileContents = jsonFix.string;
				}


				try
				{
					// for this channel, pull the contents into the userMap
					userMap[channelName] = JSON.parse(fileContents);
					for(let prop in userMap[channelName])
					{
						if(userMap[channelName].isLurking == false)
							UpdateNonlurkers(channelName, prop);
					}
				}
				catch(e)
				{
					var message = e.message;
					var lastSpace = message.lastIndexOf(' ');
					var lineNumberString = message.substring(lastSpace + 1);
					var lineNumber = parseInt(lineNumberString);
					var substring = fileContents.substring(lineNumber - 10);
					console.log(message);
					console.log(substring);
				}
				
				if(jsonFix.didChange)
				{
					WriteChannelLog(channelName);
				}
				
				
				console.log("successfully parsed log file for channel", channelName);
			});
		}
		else
		{
			overlay.UpdateChatterList([]);
		}
	}
	
	bot.GetClient().on("join", OnJoin);
	bot.GetClient().on("part", OnDepart);
	bot.GetClient().on("disconnected", OnDisconnect);
	
	//bot.GetClient().on("giftpaidupgrade", OnContinueGiftSub);
	bot.GetClient().on("message", OnChat);
}

///////////////////////////////////////////////////////////
// When a user joins chat, even before they send a message.
///////////////////////////////////////////////////////////
function OnJoin(channel, username, isSelf)
{
	if(isSelf)
	{
		return;
	}
	
	//console.log("a user just joined", channel);
	EnsureChatterIsInList(channel, username);
	WriteChannelLog(channel);
	logFile.Log(channel, username + " joined");
}

///////////////////////////////////////////////////////////
// When a user exits chat.
///////////////////////////////////////////////////////////
function OnDepart(channel, username, isSelf)
{
	if(isSelf)
	{
		return;
	}
	
	//console.log(username, "just departed", channel);
	EnsureChatterIsInList(channel, username);
	Chatter.Depart(userMap[channel][username]);
	WriteChannelLog(channel);
	logFile.Log(channel, username + " departed");
}

///////////////////////////////////////////////////////////
// When the bot is disconnected.
///////////////////////////////////////////////////////////
function OnDisconnect(reason)
{
	console.log("disconnecting chatter_list");
	
	var now = new Date();
	
	for(var channel in userMap)
	{
		for(var username in userMap[channel])
		{
			if(userMap[channel][username].isPresent == true)
			{
				Chatter.Depart(userMap[channel][username]);
			}
		}
		
		WriteChannelLog(channel);
	}
}

/*
///////////////////////////////////////////////////////////
// When a user continues a gift sub.
///////////////////////////////////////////////////////////
function OnContinueGiftSub(channel, subscriberName, senderName, userData)
{
	ProcessActivity(channel, subscriberName);
}
*/

///////////////////////////////////////////////////////////
// When a user chats, /me's, or whispers the bot.
///////////////////////////////////////////////////////////
function OnChat(channel, user, message, isSelf)
{
	ProcessActivity(channel, user.username, isSelf);

}

///////////////////////////////////////////////////////////
// All activity is funneled here. Updates the user's
// activity time and updates the log file.
///////////////////////////////////////////////////////////
function ProcessActivity(channel, username, isSelf)
{
	if(isSelf)
	{
		return;
	}
	
	EnsureChatterIsInList(channel, username);
	WriteChannelLog(channel);
	UpdateNonlurkers(channel, username);
}

///////////////////////////////////////////////////////////
// Ensures chatter is in the list, and updates their
// lastActivityTime.
///////////////////////////////////////////////////////////
function EnsureChatterIsInList(channel, username)
{
	// if this is the first user for this channel, create the channel map entry
	if(!userMap.hasOwnProperty(channel))
	{
		userMap[channel] = {};
		userMap[channel][username] = new Chatter(new Date());
	}
	// if the channel has a map, but the user isn't in it yet
	else if(!userMap[channel].hasOwnProperty(username))
	{
		userMap[channel][username] = new Chatter(new Date());
	}
	//HACK: if the user is already in the map, we mark them present here.
	else
	{
		userMap[channel][username].isPresent = true;
	}
}

///////////////////////////////////////////////////////////
// Overwrites the log for the given channel.
// Writes all current logged data.
///////////////////////////////////////////////////////////
function WriteChannelLog(channel)
{
	try
	{
		var json = JSON.stringify(userMap[channel], null, ' ');

		json = jsonUtility.FixBracePairingProblems(json).string;

		filesystem.writeFile(logPathMap[channel], json, OnWriteFile);
		//console.log("log file was updated");
	}
	catch(e)
	{
		console.log(e);
	}
}

///////////////////////////////////////////////////////////
// Checks if the guestbook needs updating, and does it.
///////////////////////////////////////////////////////////
function UpdateGuestbook(path, user)
{
	let index = guestbook.indexOf(user);
	if(index == -1)
	{
		guestbook.push(user);
		let json = JSON.stringify(guestbook);
		json = jsonUtility.FixBracePairingProblems(json).string;
		filesystem.writeFileSync(path, json);
	}
}

///////////////////////////////////////////////////////////
// Reports file writing success or failure.
///////////////////////////////////////////////////////////
function OnWriteFile(error)
{
	if(error)
		throw error;
	
	//console.log("chatter log updated");
}


//////////////////////////////////////////////////////////////////////////////////////////
// Called when someone speaks. If they were previously lurking, they're not
// any more. This is used for a variety of purposes.
//////////////////////////////////////////////////////////////////////////////////////////
function UpdateNonlurkers(channel, activeUsername)
{
	let user = userMap[channel][activeUsername];
	if(user.isLurking == true)
	{
		user.isLurking = false;
		nonlurkers.push(activeUsername);
		overlay.UpdateChatterList(nonlurkers);
		logConsole.LogInRandomColor(activeUsername + " is chatting for the first time!");
		
		if(channel != '#' + activeUsername)
			UpdateGuestbook(guestbookPathMap[channel], activeUsername);
			
		//overlay.PlaySound("enter");
	}
}

///////////////////////////////////////////////////////////
// Registers to receive a callback when someone chats for
// the first time. Callback must be (username)=>void
///////////////////////////////////////////////////////////
function RegisterFirstTimeChatCallback(callback)
{
	firstTimeChatCallbacks.add(callback);
}

///////////////////////////////////////////////////////////
// Unregisters a previously registered first chat callback.
///////////////////////////////////////////////////////////
function UnRegisterFirstTimeChatCallback(callback)
{
	firstTimeChatCallbacks.delete(callback);
}

///////////////////////////////////////////////////////////
// Notifies all listeners of a user's first chat today.
///////////////////////////////////////////////////////////
function NotifyFirstChat(username)
{
	for(let callback of firstTimeChatCallbacks.values())
	{
		callback(username);
	}
}

module.exports = { Initialize, RegisterFirstTimeChatCallback,
	UnRegisterFirstTimeChatCallback };