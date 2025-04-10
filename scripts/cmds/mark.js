const { GoatWrapper } = require("fca-liane-utils");
const axios = require("axios");
const jimp = require("jimp");
const fs = require("fs");

const wrapText = (ctx, text, maxWidth) => {
    return new Promise(resolve => {
        if (ctx.measureText(text).width < maxWidth) return resolve([text]);
        if (ctx.measureText('W').width > maxWidth) return resolve(null);
        const words = text.split(' ');
        const lines = [];
        let line = '';
        while (words.length > 0) {
            let split = false;
            while (ctx.measureText(words[0]).width >= maxWidth) {
                const temp = words[0];
                words[0] = temp.slice(0, -1);
                if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
                else {
                    split = true;
                    words.splice(1, 0, temp.slice(-1));
                }
            }
            if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
            else {
                lines.push(line.trim());
                line = '';
            }
            if (words.length === 0) lines.push(line.trim());
        }
        return resolve(lines);
    });
};

module.exports = {
    config: {
        name: "mark",
        version: "1.0",
        author: "Jubayer",
        countDown: 5,
        role: 0,
        shortDescription: "Add text to a marker board image", 
        longDescription: "This command overlays user-provided text onto a marker board image.", 
        category: "image",
        guide: {
            vi: "{pn} [văn bản]",
            en: "{pn} [text]"
        }
    },

    onStart: async function ({ api, event, args }) {
        const { senderID, threadID, messageID } = event;
        const { loadImage, createCanvas } = require("canvas");

        const pathImg = __dirname + '/cache/markngu.png';
        const text = args.join(" ");

        if (!text) {
            return api.sendMessage("Enter the content to write on the board!", threadID, messageID);
        }

        try {
            const getPorn = (await axios.get(`https://i.imgur.com/3j4GPdy.jpg`, { responseType: 'arraybuffer' })).data;
            fs.writeFileSync(pathImg, Buffer.from(getPorn, 'utf-8'));

            const baseImage = await loadImage(pathImg);
            const canvas = createCanvas(baseImage.width, baseImage.height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

            ctx.font = "400 45px Arial";
            ctx.fillStyle = "#000000";
            ctx.textAlign = "start";

            let fontSize = 45;
            while (ctx.measureText(text).width > 2250) {
                fontSize--;
                ctx.font = `400 ${fontSize}px Arial, sans-serif`;
            }

            const lines = await wrapText(ctx, text, 440);
            ctx.fillText(lines.join('\n'), 95, 420);

            const imageBuffer = canvas.toBuffer();
            fs.writeFileSync(pathImg, imageBuffer);
            return api.sendMessage(
                { attachment: fs.createReadStream(pathImg) },
                threadID,
                () => fs.unlinkSync(pathImg),
                messageID
            );
        } catch (error) {
            console.error(error);
            return api.sendMessage("An error occurred while processing the image ‼️", threadID, messageID);
        }
    }
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
