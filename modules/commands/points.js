const filesystem = require("fs");
const jsonUtility = require("./../json_utility.js");
const twitchBot = require("./../../modules/twitch_bot.js");

const pointName = "cookie";

var logPathMap = {};
var userPointMap = {};

///////////////////////////////////////////////////////////
// Initializes chatter point tracking.
// Log files will be written to logDirectory.
///////////////////////////////////////////////////////////
function Initialize(bot, logDirectory)
{
	if(bot == null || bot.GetClient() == null)
	{
		console.log("unable to initialize points: twitch_bot client is null");
		return;
	}

	// For each channel the bot is attached to, read if a log file for today 
	// already exists, and if so parse it.
	var botOptions = bot.GetClient().getOptions();
	for(var index in botOptions.channels)
	{
		var channelName = botOptions.channels[index];
        console.log("Initializing user points for channel", channelName);

        // Generate point log path
		var logPath = logDirectory + "/points_" + channelName + ".txt";
		logPathMap[channelName] = logPath;
		if(filesystem.existsSync(logPath))
		{
			// read the file into memory
			filesystem.readFile(logPath, null, (error, fileContents)=>
			{
				if(error)
					throw error;
					
				// for this channel, pull the contents into the userMap
				userPointMap[channelName] = JSON.parse(fileContents);
				
				//console.log("successfully parsed points file for channel", channelName);
			});
		}
        else
        {
            userPointMap[channelName] = {};
        }
	}
}

///////////////////////////////////////////////////////////
// Gives a point to a user.
///////////////////////////////////////////////////////////
function GivePoint(command)
{
    if(!command.SenderIsBroadcasterOrMod() || command.arguments == null)
    {
        console.log("Unable to complete command");
		return;
    }
    
	var channel = command.channel;
    var receiver = jsonUtility.SanitizeUsername(command.arguments[0]);
    console.log("Giving a", pointName, "to", receiver, "in channel", channel);

	if(userPointMap[channel].hasOwnProperty(receiver))
	{
		++userPointMap[channel][receiver];
	}
	else
	{
		userPointMap[channel][receiver] = 1;
	}

	WritePointsToFile(channel);
	twitchBot.Say(channel, '@' + receiver + " just got a " + pointName
		+ " and now has " + userPointMap[channel][receiver]);
	twitchBot.ParseCommand(channel, "!stampBomb yay", null);
	
}

///////////////////////////////////////////////////////////
// Checks a user's points.
///////////////////////////////////////////////////////////
function CheckPoints(command)
{    
	var target = jsonUtility.SanitizeUsername(command.senderState.username);
	if(command.arguments != null && command.arguments.length > 0)
		target = jsonUtility.SanitizeUsername(command.arguments[0]);

	var channel = command.channel;
    console.log("Checking", pointName, "(s) for", target);

	if(userPointMap[channel].hasOwnProperty(target))
	{
		
	}
	else
	{
		userPointMap[channel][target] = 0;
	}

	twitchBot.Say(channel, '@' + target + ' has '
			+ userPointMap[channel][target] + ' ' + pointName + '(s).'
			+ ' Earn them by doing nice things for others and spend them with'
			+ ' the new channel point redemption!');
}

///////////////////////////////////////////////////////////
// Deducts a point from a user.
///////////////////////////////////////////////////////////
function DeductPoint(command)
{
	if(!command.SenderIsBroadcasterOrMod() || command.arguments == null)
    {
        console.log("Unable to complete command");
		return;
    }

	var channel = command.channel;
	var receiver = jsonUtility.SanitizeUsername(command.arguments[0]);
	console.log("Deducting a", pointName, "from", receiver);

	if(userPointMap[channel].hasOwnProperty(receiver)
		&& userPointMap[channel][receiver] > 0)
	{
		--userPointMap[channel][receiver];
		twitchBot.Say(channel, '@' + receiver + " just spent a " + pointName
			+ " and now has " + userPointMap[channel][receiver]);
	}
	else
	{
		console.log(receiver, "had no", pointName, "(s) to deduct.");
	}

	WritePointsToFile(channel);
}



///////////////////////////////////////////////////////////
// Overwrites the log for the given channel.
// Writes all current logged data.
///////////////////////////////////////////////////////////
function WritePointsToFile(channel)
{
	var json = JSON.stringify(userPointMap[channel], null, ' ');
	filesystem.writeFile(logPathMap[channel], json, OnWriteFile);
}

///////////////////////////////////////////////////////////
// Reports file writing success or failure.
///////////////////////////////////////////////////////////
function OnWriteFile(error)
{
	if(error)
		throw error;
}

module.exports =
{
	Initialize,
	commands:
	{
		'!givecookie' : GivePoint,
		'!checkcookies' : CheckPoints,
		'!spendcookie' : DeductPoint
	}
};