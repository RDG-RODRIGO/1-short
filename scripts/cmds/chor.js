const circleImage = async (image) => {
    const jimp = global.nodemodule['jimp'];
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
};

module.exports.config = {
    name: "chor",
    version: "1.0",
    hasPermission: 0,
    credits: "Jubayet", 
    description: "মজার ইমেজ তৈরি করে",
    commandCategory: "fun",
    usages: "!chor [@tag]",
    cooldowns: 5
};

module.exports.run = async ({ event, api, args, Users }) => {
    try {
        const Canvas = global.nodemodule['canvas'];
        const request = global.nodemodule["node-superfetch"];
        const fs = global.nodemodule["fs-extra"];
        const path_toilet = __dirname + '/cache/damma.jpg';
        const id = Object.keys(event.mentions)[0] || event.senderID;
        const canvas = Canvas.createCanvas(500, 670);
        const ctx = canvas.getContext('2d');
        const background = await Canvas.loadImage('https://i.imgur.com/ES28alv.png');

        // অ্যাভাটার লোড এবং সার্কুলার করা
        let avatar = await request.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        avatar = await circleImage(avatar.body);

        // ব্যাকগ্রাউন্ড এবং অ্যাভাটার যোগ করা
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(await Canvas.loadImage(avatar), 48, 410, 111, 111); // এখানে X=48, Y=410 পরিবর্তন করতে পারেন

        // ইমেজ সেভ এবং পাঠানো
        const imageBuffer = canvas.toBuffer();
        fs.writeFileSync(path_toilet, imageBuffer);
        api.sendMessage({
            attachment: fs.createReadStream(path_toilet, { 'highWaterMark': 128 * 1024 }),
            body: "🤣 মুরগী'র ডিম চুরি করতে গিয়ে ধরা খাই'ছে_🫣🎀"
        }, event.threadID, () => fs.unlinkSync(path_toilet), event.messageID);
    } catch (e) {
        api.sendMessage(e.stack, event.threadID);
    }
};
