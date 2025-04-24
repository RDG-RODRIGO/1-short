const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "jok",
    version: "1.0",
    author: "Jubayer",
    countDown: 5,
    role: 0,
    shortDescription: "Sends a random joke",
    longDescription: "Selects and sends a random joke from jok.json file",
    category: "fun",
    guide: "${pn}jok"
  },

  onStart: async function({ message }) {
    try {
      const jokePath = path.join(__dirname, '..', '..', 'cmds', 'tmp', 'jok.json');
      const jokeData = fs.readFileSync(jokePath, 'utf8');
      const jokes = JSON.parse(jokeData);
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      message.reply(randomJoke);
    } catch (error) {
      console.error("Error loading jokes:", error);
      message.reply("Failed to load jokes.");
    }
  }
};
