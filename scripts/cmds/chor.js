const { GoatWrapper } = require("fca-liane-utils");
const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

// Function to make the image circular
const circleImage = async (imageBuffer) => {
    const image = await jimp.read(imageBuffer);
    image.circle();
    return await image.getBufferAsync(jimp.MIME_PNG);
};

module.exports = {
    config: {
        name: "chor",
        version: "1.0",
        author: "Jubayer",
        countDown: 5,
        role: 0,
        shortDescription: "Creates a funny image with profile picture",
        longDescription: "This command fetches a tagged user's Facebook profile picture and places it on a funny toilet-themed background.",
        category: "fun",
        guide: {
            vi: "{pn}chor [@tag]",
            en: "{pn}chor [@tag]"
        }
    },

    onStart: async function ({ event, api, args }) {
        try {
            const pathToImage = __dirname + '/cache/toilet_output.png';

            // Get the user ID (tagged user or sender)
            const userId = Object.keys(event.mentions).length > 0 ? Object.keys(event.mentions)[0] : event.senderID;
            return message.reply("আপনি কোন Author চেঞ্জার কে চোর বানাতে চান @ট্যাগ দিন ");

            // Fetch the background image
            const backgroundResponse = await axios({
                url: 'https://i.imgur.com/ES28alv.png', // Original background image URL
                responseType: 'arraybuffer'
            });
            const backgroundBuffer = Buffer.from(backgroundResponse.data, 'binary');

            // Fetch the user's profile picture from Facebook
            const avatarResponse = await axios({
                url: `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
                responseType: 'arraybuffer'
            });
            const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');

            // Make the profile picture circular
            const circularAvatar = await circleImage(avatarBuffer);

            // Load the background and avatar images using jimp
            const background = await jimp.read(backgroundBuffer);
            const avatar = await jimp.read(circularAvatar);

            // Resize the background to match the original canvas size (500x670)
            background.resize(500, 670);

            // Resize the avatar to match the original size (111x111)
            const avatarSize = 111; // Original size from the script
            avatar.resize(avatarSize, avatarSize);

            // Composite the avatar onto the background at the original position
            const xPosition = 48; // Original X position
            const yPosition = 410; // Original Y position
            background.composite(avatar, xPosition, yPosition);

            // Save the final image
            await background.writeAsync(pathToImage);

            // Send the image to the chat
            api.sendMessage({
                body: "╭──────•◈•───────╮\n         Funny      \n\nHere’s your funny image! 😂\n\nCreated by Jubayer\n╰──────•◈•───────╯",
                attachment: fs.createReadStream(pathToImage)
            }, event.threadID, () => fs.unlinkSync(pathToImage), event.messageID);

        } catch (error) {
            api.sendMessage(`Error: ${error.message}`, event.threadID);
        }
    }
};


const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
