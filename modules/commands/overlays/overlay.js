const console = require("console");
const filesystem = require("fs");
const htmlColors = require("html-colors");

const jsonUtility = require("./../../json_utility.js");
const twitchBot = require("../../twitch_bot.js");
const wheel = require("./../wheel.js");

const dataSections = ["bot", "event", "overlay"];

//TODO: change this to a folder, not a file
let dataPath = null;
let data = {};

// html files:
// fullscreen overlay
// barkbot (speech bubble)
// event info

//TODO: Copy html files if they don't exist at path

function Initialize(_dataPath)
{
    dataPath = _dataPath;
    ReadData();
}

function GetData()
{
    return data;
}

//////////////////////////////////////////////////////////////////////
// Reads the current state of the overlay.
//////////////////////////////////////////////////////////////////////
function ReadData()
{    
    if(filesystem.existsSync(dataPath))
    {
        // read from data path
        let fileContents = filesystem.readFileSync(dataPath, null);
        if(fileContents == null)
            throw error;
            
        // parse into json
        data = JSON.parse(fileContents);

        VerifyDataSections();
    }
    else
    {
        console.log("Overlay data not found on initialization.");
        VerifyDataSections();
    }
}

//////////////////////////////////////////////////////////////////////
// Verifies that the sub-objects of the data map exist.
//////////////////////////////////////////////////////////////////////
function VerifyDataSections()
{
    // ensure that data sections have been created
    for(let i = 0; i < dataSections.length; ++i)
    {
        if(data.hasOwnProperty(dataSections[i]) == false)
        {
            data[dataSections[i]] = {};
        }
    }
}

//////////////////////////////////////////////////////////////////////
// Creates an object in the json file if it doesn't already exist
//////////////////////////////////////////////////////////////////////
function CreateJsonPath(path)
{
    let elements = path.split('.');
    let obj = data;
    for(let i = 0; i < elements.length; ++i)
    {
        let prop = elements[i];
        console.log(prop);
        if(!obj.hasOwnProperty(prop))
        {
            obj[prop] = {};
        }

        obj = obj[prop];
    }

    
}

//////////////////////////////////////////////////////////////////////
// Writes the current state of the data to file for overlay to read.
//////////////////////////////////////////////////////////////////////
function WriteData()
{
    let json = JSON.stringify(data, null, ' ');
	filesystem.writeFileSync(dataPath, json);
}

//////////////////////////////////////////////////////////////////////
// Reports file writing success or failure.
//////////////////////////////////////////////////////////////////////
function OnWriteFile(error)
{
	if(error)
		throw error;
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function BarkBotSays(command)
{
    ReadData();
    let message = "";
    for(let i = 0; i < command.arguments.length; ++i)
    {
        message += command.arguments[i] + " ";
    }

    data.bot.text = message;
    data.bot.time = Date.now();

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function Stamp(command)
{
	ReadData();
    let $i = 0;
    let $argCount = command.arguments.length;
    let $args = command.arguments;
    let $stateMap = data;
	for($i = 0; $i < $argCount; ++$i)
	{
		$stateMap["overlay"]["image" + $i] = "stamp_" + $args[$i] + ".png";
	}

	$stateMap["overlay"]["fallback"] = "randomStamp";
	$stateMap["overlay"]["imageCount"] = $argCount;
	$stateMap["overlay"]["imageDuration"] = 5000;
	$stateMap["overlay"]["sound"] = "stamp.ogg";
	$stateMap["overlay"]["time"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function StampNames(command)
{
    ReadData();
    let $stateMap = data;

	$stateMap["bot"]["textFileName"] = "stamps.txt";
	$stateMap["bot"]["textFileTime"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function StampBomb(command)
{
    ReadData();

    let $stateMap = data;
    let $args = command.arguments;

	$stateMap["overlay"]["bombType"] = $args[0];
	$stateMap["overlay"]["bombTime"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function PrideFlag(command)
{
    ReadData();
    let $stateMap = data;
    let $argCount = command.arguments.length;
    let $args = command.arguments;

	for($i = 0; $i < $argCount; ++$i)
	{
		$stateMap["overlay"]["image" + $i] = "flag_" + $args[$i] + ".gif";
	}
	
	$stateMap["overlay"]["fallback"] = "unityFlag";
	$stateMap["overlay"]["imageCount"] = $argCount;
	$stateMap["overlay"]["imageDuration"] = 5000;
	$stateMap["overlay"]["sound"] = "stamp.ogg";
	$stateMap["overlay"]["time"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function FlagNames(command)
{
    ReadData();
    let $stateMap = data;

	$stateMap["bot"]["textFileName"] = "flags.txt";
	$stateMap["bot"]["textFileTime"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function FlagBomb(command)
{
    ReadData();

    let $stateMap = data;
    let $args = command.arguments;

	$stateMap["overlay"]["bombType"] = "flags";
	$stateMap["overlay"]["bombTime"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function UpdateEventText(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    ReadData();

    let $stateMap = data;
    let $args = command.arguments;
    let $argCount = $args.length;

	let $text = "";
	for($i = 0; $i < $argCount; ++$i)
	{
		$text += $args[$i] + " ";
	}

	$stateMap["event"]["text"] = $text;
	$stateMap["event"]["time"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function AddGiveawayEntry(command)
{
    let user = jsonUtility.SanitizeUsername(command.senderState.username);

    /*
    if(!command.SenderIsBroadcasterOrMod())
        return;
    */

    ReadData();

    let entries = data.event.entries;

    /*
    for(let i = 0; i < command.arguments.length; ++i)
    {
        let arg = jsonUtility.SanitizeUsername(command.arguments[i]);
        entries.push(arg);
    }
    */

    let index = entries.indexOf(user);
    if(index == -1)
        entries.push(user);

	data["event"]["entries"] = entries;
	data["event"]["time"] = Date.now();

	WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function RemoveGiveawayEntry(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    ReadData();

    let entries = data.event.entries;
    for(let i = 0; i < command.arguments.length; ++i)
    {
        let arg = jsonUtility.SanitizeUsername(command.arguments[i]);
        let index = entries.indexOf(arg);
        if(index != -1)
        {
            entries.splice(index, 1);
        }
    }

	data["event"]["entries"] = entries;
	data["event"]["time"] = Date.now();

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function ClearEntries(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    ReadData();

	data["event"]["entries"] = [];
	data["event"]["time"] = Date.now();

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
async function PickWinner(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    twitchBot.Say(command.channel, "And the winner is...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    ReadData();
    let entries = data.event.entries;
    let winner = wheel.GetRandomElement(entries);
    twitchBot.Say(command.channel, winner + "!!!!");
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function SendWheelCommand(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    let args = command.arguments;
    if(args == null)
        return;

    let argCount = args.length;
    if(argCount <= 0)
        return;

    ReadData();

    if(data.overlay.hasOwnProperty("wheel") == false)
        data.overlay.wheel = {};

    data.overlay.wheel.command = args[0];
    for(let i = 1; i < args.length; ++i)
    {
        data.overlay.wheel["arg" + i] = args[i];
    }

    data.overlay.wheel.time = Date.now();

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function UpdateOverlayText(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    let args = command.arguments;
    if(args == null)
        return;
    
    let argCount = args.length;
    if(argCount < 4)
        return;

    ReadData();

    let fieldId = args[0];
    let timelineId = args[1];
    let letiableId = args[2];
    let letiableValue = args[3];

    data.time = Date.now();

    if(data.hasOwnProperty(fieldId) == false)
        data[fieldId] = {};

    if(data[fieldId].hasOwnProperty(timelineId) == false)
        data[fieldId][timelineId] = {};

    data[fieldId][timelineId][letiableId] = letiableValue;

    WriteData();
}

function IncrementOverlay(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    let args = command.arguments;
    if(args == null)
        return;
    
    let argCount = args.length;
    if(argCount < 3)
        return;

    ReadData();

    let fieldId = args[0];
    let timelineId = args[1];
    let letiableId = args[2];

    data.time = Date.now();

    if(data.hasOwnProperty(fieldId) == false)
        data[fieldId] = {};

    if(data[fieldId].hasOwnProperty(timelineId) == false)
        data[fieldId][timelineId] = {};

    let letiableValue = parseInt(data[fieldId][timelineId][letiableId]);
    ++letiableValue;
    data[fieldId][timelineId][letiableId] = letiableValue;

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function Shake(command)
{
    ReadData();

    data.overlay.wheel.shakeTime = Date.now();

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function SetOverlayValue(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    ReadData();

    let args = command.arguments;
    if(args == null)
        return;

    // first argument is in form property.property.property
    let path = args[0].split('.');
    let obj = data[path[0]];
    for(let i = 1; i < path.length - 1; ++i)
    {
        obj = obj[path[i]];
    }

    let leafProperty = path[path.length - 1];

    // second argument is value or value,value
    let values = args[1];
    if(values.indexOf(',') != -1)
        values = values.split(',');

    data.time = Date.now();

    obj[leafProperty] = values;

    WriteData();
}

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function SetGlowColor(command)
{

    if(command.arguments == null || command.arguments.length == 0)
    {
        twitchBot.Say(command.channel,
            "!color changes the background glow! Use it like this: !color colorName (e.g. !color green) or !color color1,color2 (e.g. !color green,aqua). You can enter as many colors as you like.")
        return;
    }

    let colorsArg = command.arguments[0];
    
    const SPECIAL_COLORS = {
        "rainbow":"red,orange,yellow,green,blue,indigo,violet"
    };

    if(Array.isArray(colorsArg) == false)
    {
        for(let property in SPECIAL_COLORS)
        {
            if(colorsArg == property)
            {
                colorsArg = SPECIAL_COLORS[property];
                break;
            }
        }
    }

    
    let colors = colorsArg.split(',');
    for(let property in colors)
    {
        let color = colors[property];
        if(color[0] == "#")
            continue;

        let index = htmlColors.names().indexOf(colors[property]);
        if(index != -1)
            continue;

        twitchBot.Say(command.channel, color + " is not a valid color. Don't be FUNKY! Use real color names or #rrggbb!");
        return;
    }

    command.arguments = ["border.colors", colorsArg];

    command.senderState.badges.moderator = '1';
    SetOverlayValue(command);
}

function UpdateChatterList(nonlurkers)
{
    ReadData();
    data.chatters = nonlurkers;
    WriteData();
}

function PlaySound(name)
{
    ReadData();
    data.sound = {
        name : name,
        time : Date.now()
    };
    WriteData();
}

function DaddyLurk(command)
{
    PlaySound("bahbahbow");
}

// Expose public functions
module.exports =
{
	commands:
	{
		"!barkbotsays" : BarkBotSays,
		"!stamp" : Stamp,
		"!stampnames" : StampNames,
		"!stampbomb" : StampBomb,
		"!flyyourflags" : PrideFlag,
        "!pride" : PrideFlag,
		"!flagnames" : FlagNames,
		"!flagbomb" : FlagBomb,
		"!updateeventtext" : UpdateEventText,
		"!enter" : AddGiveawayEntry,
        "!remove" : RemoveGiveawayEntry,
        "!clearentries" : ClearEntries,
        "!winner" : PickWinner,
        "!wheel" : SendWheelCommand,
        "!updateoverlaytext" : UpdateOverlayText,
        "!incrementoverlay" : IncrementOverlay,
        "!setoverlayvalue" : SetOverlayValue,
        "!color" : SetGlowColor,
        "shake" : Shake,
        "!daddylurk" : DaddyLurk
	},

    Initialize, GetData, ReadData, WriteData, CreateJsonPath, UpdateChatterList, PlaySound
};