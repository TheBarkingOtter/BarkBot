const filesystem = require("fs");

var logPathMap = { };

///////////////////////////////////////////////////////////
// Initializes chatter tracking.
// Log files will be written to logDirectory.
///////////////////////////////////////////////////////////
function Initialize(bot, logDirectory)
{
	if(bot == null || bot.GetClient() == null)
	{
		console.log("unable to initialize log_file: twitch_bot client is null");
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
		var channelName = botOptions.channels[index];
		console.log("Initializing log_file for ", channelName);
		var logPath = logDirectory + "/logs_" + channelName + '_' + year + month + day + ".txt";
		logPathMap[channelName] = logPath;
	}
}

///////////////////////////////////////////////////////////
// Writes a log entry.
///////////////////////////////////////////////////////////
function Log(channel, message)
{
	if(!logPathMap.hasOwnProperty(channel))
		return;

	try
	{
		if(channel[0] != '#')
			channel = '#' + channel;
		var now = new Date();
		filesystem.appendFile(logPathMap[channel], now.toTimeString() + ":" + message + "\n", OnWriteFile);
	}
	catch(e)
	{
		console.log(e);
	}
	
}

///////////////////////////////////////////////////////////
// Reports file writing success or failure.
///////////////////////////////////////////////////////////
function OnWriteFile(error)
{
	if(error)
		throw error;
}

module.exports = { Initialize, Log };