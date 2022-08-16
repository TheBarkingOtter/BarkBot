const htmlInteract = require("./html_interact.js")
const logFile = require("./../log_file.js");
const twitchBot = require("./../twitch_bot.js");

const VIEWER_CHECK_INTERVAL = 300;
var viewerCount = 0;

var bot = null;

async function InitializeViewerLogging(_bot)
{
    bot = _bot;

    var botIsRunning = true;

    bot.GetClient().on("disconnected", (reason)=>
    {
        botIsRunning = false;
    });

    while(true)
    {
        LogViewers();
        if(botIsRunning)
        {
            await new Promise(resolve => setTimeout(resolve, VIEWER_CHECK_INTERVAL));
        }
        else
        {
            break;
        }
    }
}

function LogViewers()
{
    SendViewerHTTP("thebarkingotter", (response)=>
    {
        if(response != null && response.data != null && response.data.data != null && response.data.data.length > 0)
        {
            if(response.data.data[0].viewer_count != viewerCount)
            {
                viewerCount = response.data.data[0].viewer_count;
                logFile.Log(twitchBot.channels[0], "Viewer count changed to " + viewerCount);
                //console.log("Viewer count is now: " + viewerCount);
            }
        }
       
    }, false);
}

function SendViewerHTTP(channel, callback, logUponError = true)
{
    htmlInteract.SendHTTP(
		"get",
		"https://api.twitch.tv/helix/streams",

		[
			{
				key:'user_login',
				value:channel
		 	}
		],

		{
			'Authorization':'Bearer jhjg1cn0irx7d0ksmsjshcfnd4jrmo',
			'Client-Id':'rat7tckwdp2962ahwqlorv2qg4lzcr'
		},
		
		(response)=>
        {
            if(callback != null)
                callback(response);
        },

        logUponError
	);
}

function ViewerCommand(command)
{
	var channel = "thebarkingotter";
	if(command.arguments != null && command.arguments.length > 0)
		channel = command.arguments[0];

	SendViewerHTTP(channel, (response)=>
    {
        var dataArray = response.data.data;
        if(dataArray.length == 0)
        {
            twitchBot.Say(twitchBot.channels[0], "The requested channel is not live.");
        }
        else
        {
            var channelData = dataArray[0];
            twitchBot.Say(twitchBot.channels[0], channelData.user_name + " currently has " + channelData.viewer_count + " viewers");
        }
    });
}

module.exports =
{
	commands:
	{
		"!viewers" : ViewerCommand
	},

    InitializeViewerLogging
}
