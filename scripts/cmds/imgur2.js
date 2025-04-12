const axios = require('axios');

module.exports = {
  config: {
    name: 'imgur',
    aliases: ['imgurupload', 'uploadimgur'],
    role: 0,
    author: 'Jubayer',
    countDown: 5,
    longDescription: 'Upload an image or video to Imgur and retrieve the shareable link.',
    category: 'utility',
    guide: {
      en: '${pn}imgur [image/video URL or reply to an attachment]'
    }
  },

  onStart: async ({ api, event, args, Users, Threads }) => {
    const { threadID, messageID, senderID } = event;

    try {
      
      let linkanh = event.messageReply?.attachments[0]?.url || args.join(' ');
      if (!linkanh) {
        return api.sendMessage(
          '[⚠️]➜ Please provide an image/video link or reply to an attachment.',
          threadID,
          messageID
        );
      }

      
      linkanh = linkanh.replace(/\s/g, '');

      
      if (!/^https?:\/\//.test(linkanh)) {
        return api.sendMessage(
          '[⚠️]➜ Invalid URL: URL must start with http:// or https://',
          threadID,
          messageID
        );
      }

      
      const userData = await Users.getData(senderID);
      if (userData.banned) {
        return api.sendMessage(
          '[⚠️]➜ You are banned from using this bot.',
          threadID,
          messageID
        );
      }

      
      const threadData = await Threads.getData(threadID);
      if (threadData.settings?.adminOnly && !threadData.adminIDs.includes(senderID)) {
        return api.sendMessage(
          '[⚠️]➜ This command is restricted to thread admins only.',
          threadID,
          messageID
        );
      }

      
      const encodedUrl = encodeURIComponent(linkanh);

      
      const attachments = event.messageReply?.attachments || [{ url: linkanh }];

      // Create upload promises
      const allPromises = attachments.map(item => {
        const encodedItemUrl = encodeURIComponent(item.url);
        return axios.get(`http://65.109.80.126:20392/imgur?url=${encodedItemUrl}`);
      });

      
      const results = await Promise.all(allPromises);

      
      const imgurLinks = results.map(result =>
        result.data.success ? result.data.link : 'Upload failed'
      );

      
      console.log(
        `[Bot] Command: imgur | User: ${senderID} | Thread: ${threadID} | Links: ${imgurLinks.join(', ')}`
      );

      
      return api.sendMessage(
        `Uploaded Imgur Links:\n${imgurLinks.join('\n')}`,
        threadID,
        (error, info) => {
          if (!error) {
            
            global.GoatBot.onReply.set(info.messageID, {
              messageID: info.messageID,
              commandName: 'imgur',
              author: senderID
            });
          }
        },
        messageID
      );
    } catch (e) {
      console.error(
        `[Bot] Error in imgur command | User: ${senderID} | Thread: ${threadID} | Error: ${e.message}`
      );
      return api.sendMessage(
        '[⚠️]➜ An error occurred while uploading the image or video.',
        threadID,
        messageID
      );
    }
  },

  onReply: async ({ api, event, reply, Users }) => {
    const { threadID, messageID, senderID } = event;
    const { commandName, author } = reply;

    if (commandName !== 'imgur' || senderID !== author) return;

    try {
      
      const newLink = event.body.trim();
      if (!newLink || !/^https?:\/\//.test(newLink)) {
        return api.sendMessage(
          '[⚠️]➜ Please provide a valid image/video URL starting with http:// or https://',
          threadID,
          messageID
        );
      }

      
      const userData = await Users.getData(senderID);
      if (userData.banned) {
        return api.sendMessage(
          '[⚠️]➜ You are banned from using this bot.',
          threadID,
          messageID
        );
      }

      
      const encodedUrl = encodeURIComponent(newLink);
      const response = await axios.get(`http://65.109.80.126:20392/imgur?url=${encodedUrl}`);

      const imgurLink = response.data.success ? response.data.link : 'Upload failed';

      
      console.log(
        `[Bot] Reply: imgur | User: ${senderID} | Thread: ${threadID} | Link: ${imgurLink}`
      );

      
      return api.sendMessage(
        `Uploaded Imgur Link:\n${imgurLink}`,
        threadID,
        (error, info) => {
          if (!error) {
            global.GoatBot.onReply.set(info.messageID, {
              messageID: info.messageID,
              commandName: 'imgur',
              author: senderID
            });
          }
        },
        messageID
      );
    } catch (e) {
      console.error(
        `[Bot] Error in imgur reply | User: ${senderID} | Thread: ${threadID} | Error: ${e.message}`
      );
      return api.sendMessage(
        '[⚠️]➜ An error occurred while processing your reply.',
        threadID,
        messageID
      );
    }
  }
};
