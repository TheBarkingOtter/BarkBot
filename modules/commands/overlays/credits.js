const filesystem = require("fs");
const jsonUtility = require("./../../json_utility.js")

function ConvertTimeZonesInUserFiles(folderPath)
{
    let fileNames = filesystem.readdirSync(folderPath);
    for(let index in fileNames)
    {
        let fileName = fileNames[index];
        let path = folderPath + '/' + fileName;
        let json = jsonUtility.JsonFromFile(path);
        
        for(let username in json)
        {
            let user = json[username];
            user.joinTime = ConvertTimeZoneString(fileName, user.joinTime);
            user.departTime = ConvertTimeZoneString(fileName, user.departTime);
            json[username] = user;
        }

        jsonUtility.WriteJsonToFile(json, path, function()
        {
            console.log("finished converting", fileName);
        });
        
    }
}

function ConvertTimeZoneString(filename, timeString)
{
    // we need to check if the time string needs converting at all
    let test = Date.parse(timeString);
    if(Number.isNaN(test) == false)
    {
        return;
    }

    // parse the file name for the date
    let filenameWords = filename.split('_');
    //[0] = "users"
    //[1] = #channelname
    //[2] = date
    let dateString = filenameWords[2];
    let year = dateString.substring(0, 4);
    let month = dateString.substring(4, 6);
    let day = dateString.substring(6, 8);

    let timeWords = timeString.split(' ');
    // words[0] = time
    // words[1] = timezone in format "GMT-NNNN"
    let time = timeWords[0];

    //let timezone = timeWords[1];
    //let timezoneNumber = parseInt(timezone.substring(4));

    let finalString = year + '-' + month + '-' + day + 'T' + time + 'Z';
    return new Date(finalString);
}

function Test(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    ConvertTimeZonesInUserFiles("E:/Twitch/Userlists");
}

module.exports =
{
    commands:
    {
       "!test" : Test
    }
};