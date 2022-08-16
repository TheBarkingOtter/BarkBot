const filesystem = require("fs");
const jsonUtility = require("./json_utility.js");

/////////////////////////////////////////////////////////////////////
// Parses a config file.
/////////////////////////////////////////////////////////////////////
function Parse(filePath)
{
	if(filesystem.existsSync(filePath))
	{
		const configString = filesystem.readFileSync(filePath);
        const configMap = jsonUtility.RemoveCommentsAndParse(configString);
        
		return configMap;
    }
    console.log("file did not exist");
    return null;
}

module.exports = { Parse }; 