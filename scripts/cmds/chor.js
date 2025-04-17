const { GoatWrapper } = require("fca-liane-utils"); // Verify if this should be priyanshu-fca
const Canvas = require("canvas");
const jimp = require("jimp");
const fs = require("fs-extra");

const circleImage = async (image) => {
    image = await jimp.read(image);
    image.resize(128, 128); // Optimize size for consistency
    image.circle();
    return await image.getBufferAsync("image/png");
};

module.exports = {
    config: {
        name: "chor",
        version: "1.0",
        author: "Jubayer",
        countDown: 5,
        role: 0,
        shortDescription: "Creates a funny meme with a user's avatar",
        longDescription: "Overlays a user's Facebook profile picture onto a meme background and sends it to the chat with a humorous message.",
        category: "fun",
        guide: {
            vi: "Sử dụng: {pn}chor [tag người dùng] để tạo meme hài hước với ảnh đại diện của họ.",
            en: "Use: {pn}chor [tag a user] to create a funny meme with their profile picture."
        }
    },

    onStart: async ({ event, api, args }) => {
        let path_toilet = null;
        try {
            // Ensure cache directory exists
            const cacheDir = __dirname + '/cache';
            fs.ensureDirSync(cacheDir);
            path_toilet = cacheDir + '/chor.png';

            // Check for FB_ACCESS_TOKEN
            if (!process.env.FB_ACCESS_TOKEN) {
                throw new Error("FB_ACCESS_TOKEN is not set in environment variables");
            }

            const id = Object.keys(event.mentions)[0] || event.senderID;

            // Set up canvas
            const canvas = Canvas.createCanvas(500, 670);
            const ctx = canvas.getContext('2d');
            const background = await Canvas.loadImage('https://i.imgur.com/ES28alv.png').catch(() => {
                throw new Error("Failed to load background image");
            });

            // Fetch and process avatar
            const avatarUrl = `https://graph.facebook.com/${id}/picture?width=128&height=128&access_token=${process.env.FB_ACCESS_TOKEN}`;
            const avatarResponse = await Canvas.loadImage(avatarUrl).catch(() => {
                throw new Error("Failed to load avatar");
            });
            const avatar = await circleImage(avatarResponse);

            // Draw images
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(await Canvas.loadImage(avatar), 48, 410, 111, 111);

            // Save image
            const imageBuffer = canvas.toBuffer();
            fs.writeFileSync(path_toilet, imageBuffer);

            // Send message
            await api.sendMessage({
                attachment: fs.createReadStream(path_toilet, { highWaterMark: 128 * 1024 }),
                body: "বলদ মেয়েদের চিপায় ধরা খাইছে😁😁"
            }, event.threadID, event.messageID);
        } catch (e) {
            console.error(e);
            api.sendMessage(`Sorry, something went wrong while creating the meme: ${e.message}`, event.threadID);
        } finally {
            // Ensure temporary file is deleted
            if (path_toilet && fs.existsSync(path_toilet)) {
                try {
                    fs.unlinkSync(path_toilet);
                } catch (e) {
                    console.error("Failed to delete temporary file:", e);
                }
            }
        }
    }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
