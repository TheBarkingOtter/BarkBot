const filesystem = require("fs");
const { runInNewContext } = require("vm");

//////////////////////////////////////////
// Parses json after removing // comments
//////////////////////////////////////////
function RemoveCommentsAndParse(jsonString)
{
	while(true)
	{
		var start = jsonString.indexOf("//");
		if(start != -1)
		{
			var end = jsonString.indexOf('\n', start);
			if(end != -1)
			{
				jsonString = jsonString.slice(0, start) + jsonString.slice(end, jsonString.length);
			}
		}
		else
		{
			break;
		}
	}
	
	return JSON.parse(jsonString);
}

///////////////////////////////////////////////////////////////////////////////
// Reads a file's entire contents, parses it as json, and returns the object.
///////////////////////////////////////////////////////////////////////////////
function JsonFromFile(filePath, supportComments = true)
{
	var jsonString = filesystem.readFileSync(filePath, {
		encoding: "ascii"
	}); 
	jsonString = FixBracePairingProblems(jsonString).string;
	return RemoveCommentsAndParse(jsonString);
}

///////////////////////////////////////////////////////////////////////////////
// Removes braces from the end of the file, until only expected number remain.
// TODO
///////////////////////////////////////////////////////////////////////////////
function FixBracePairingProblems(json)
{
	var didChange = false;

	// for every right brace }
	var braceIndex = json.indexOf('}');
	while(braceIndex != -1)
	{
		// check next character:
		var nextChar = json[braceIndex + 1];

		// if not a comma
		if(nextChar != ',')
		{
			// if there's another string coming up, the file is not done
			var nextQuote = json.indexOf('"', braceIndex + 2);
			if(nextQuote != -1)
			{
				// find another curly brace
				braceIndex = json.indexOf('}', braceIndex + 1);
				if(braceIndex == -1)
				{
					break;
				}

				// if second curly brace is at end, fine
				if(braceIndex < json.length - 2)
				{
					// otherwise remove it and add comma 
					var before = json.substring(0, braceIndex - 1);
					var after = json.substring(braceIndex + 1);
					json = before + "," + after;
					didChange = true;
				}
			}
			// if there are no more strings we change to brace trimming mode
			else
			{
				// find last space
				var lastSpace = json.lastIndexOf(' ');

				// starting from last space, remove all but two }
				var curlyBraceCount = 0;
				for(var i = lastSpace + 1; i < json.length; ++i)
				{
					if(json[i] == '}')
					{
						++curlyBraceCount;
						if(curlyBraceCount > 2)
						{
							// this should slice off everything starting with the 3rd brace
							json = json.substring(0, i);
							var didChange = true;
							break;
						}
					}
				}

				break;
			}
			
			
		}
		
		braceIndex = json.indexOf('}', braceIndex + 1);
	}
	
	return { string: json, didChange: didChange };
}

///////////////////////////////////////////////////////////
// Removes leading @ and converts to lowercase
///////////////////////////////////////////////////////////
function SanitizeUsername(name)
{
	if(name == null)
		return null;

	if(name[0] == '@')
	{
		name = name.substring(1);	
	}

	return name.toLowerCase();
}

///////////////////////////////////////////////////////////
// Removes leading # and converts to lowercase
///////////////////////////////////////////////////////////
function SanitizeChannelName(name)
{
	if(name == null)
		return null;

	if(name[0] == '#')
	{
		name = name.substring(1);	
	}

	return name.toLowerCase();
}

///////////////////////////////////////////////////////////
// Writes a json object to a file
///////////////////////////////////////////////////////////
function WriteJsonToFile(json, path, callback)
{
	try
	{
		let jsonString = JSON.stringify(json, null, ' ');

		jsonString = FixBracePairingProblems(jsonString).string;

		filesystem.writeFile(path, jsonString, callback);
	}
	catch(e)
	{
		console.log(e);
	}
}

///////////////////////////////////////////////////////////
// Generates a file path based on the date and channel.
///////////////////////////////////////////////////////////
function GeneratePaths(pathRoot, channels)
{
	let pathMap = {};

	// Assign file name.
	var startDate = new Date();
	var year = startDate.getFullYear();
	var month = startDate.getMonth() + 1;
	if(month < 10)
		month = "0" + month;
	var day = startDate.getDate();
	if(day < 10)
		day = "0" + day;

	for(var index in channels)
	{
		var channelName = channels[index];
		var path = pathRoot + channelName + '_' + year + month + day + ".txt";
		
		pathMap[channelName] = path;
	}

	return pathMap;
}

///////////////////////////////////////////////////////////
// Takes in an object in the format { channel: path } and
// returns a new object containing the contants
///////////////////////////////////////////////////////////
function ReadFiles(pathMap)
{
	let map = {};

	for(let channelName in pathMap)
	{
		let path = pathMap[channelName];

		var options = {
			encoding: "ascii"
		};
		
		if(filesystem.existsSync(path))
		{
			// read the file into memory
			filesystem.readFile(path, options, (error, fileContents)=>
			{
				if(error)
					throw error;

				var jsonFix = FixBracePairingProblems(fileContents);
				if(jsonFix.didChange)
				{
					fileContents = jsonFix.string;
				}


				try
				{
					// for this channel, pull the contents into the userMap
					map[channelName] = JSON.parse(fileContents);
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
			});
		}
		else
		{
			map[channelName] = {};
		}
	}

	return map;
}

function EnsureExists(object, propertyString, defaultValue)
{
	if(object == null)
		object = {};

	if(!object.hasOwnProperty(propertyString))
		object[propertyString] = defaultValue;

	return object[propertyString];
}

// Expose public functions
module.exports = {
	JsonFromFile,
	RemoveCommentsAndParse,
	FixBracePairingProblems,
	SanitizeUsername,
	SanitizeChannelName,
	WriteJsonToFile, 
	GeneratePaths,
	ReadFiles,
	EnsureExists
};