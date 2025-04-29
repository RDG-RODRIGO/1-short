const fs = require("fs");
const path = require("path");

const pointsFile = path.join(__dirname, "../../database/points.json");

if (!fs.existsSync(pointsFile)) {
  fs.writeFileSync(pointsFile, JSON.stringify({}));
}

function generateMathQuestion() {
  const operations = ["+", "-", "*", "/"];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1, num2, answer;

  switch (operation) {
    case "+":
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
      answer = num1 + num2;
      break;
    case "-":
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case "*":
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 * num2;
      break;
    case "/":
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * answer;
      break;
  }

  return { question: `${num1} ${operation} ${num2} = ?`, answer };
}

module.exports = {
  config: {
    name: "mathgame",
    version: "1.0",
    author: "Jubayer",
    countDown: 10,
    role: 0,
    shortDescription: "Play a math game to earn points",
    longDescription: "Answer math questions to earn 5000 points for correct answers or lose 5000 points for wrong answers. Check points with {pn}point and leaderboard with {pn}pointleader.",
    category: "game",
    guide: `{pn}mathgame - Start a math game\n{pn}point - Check your points\n{pn}pointleader - View the leaderboard`
  },

  onStart: async function ({ message, args, api, event, prefix }) {
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    if (subCommand === "point") {
      const pointsData = JSON.parse(fs.readFileSync(pointsFile));
      const userPoints = pointsData[event.senderID] || 0;

      const userInfo = await api.getUserInfo([event.senderID]);
      const userName = userInfo[event.senderID]?.name || "Unknown User";

      return api.sendMessage(
        `${userName}, আপনার বর্তমান পয়েন্ট: ${userPoints}`,
        event.threadID,
        event.messageID
      );
    } else if (subCommand === "pointleader") {
      const pointsData = JSON.parse(fs.readFileSync(pointsFile));
      const userIDs = Object.keys(pointsData);

      if (userIDs.length === 0) {
        return api.sendMessage("কেউ এখনও খেলেনি!", event.threadID, event.messageID);
      }

      const userInfo = await api.getUserInfo(userIDs);
      const leaderboard = Object.entries(pointsData)
        .map(([userID, points]) => ({
          name: userInfo[userID]?.name || `User ${userID}`,
          points
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => `${index + 1}. ${entry.name}: ${entry.points} points`);

      return api.sendMessage(
        `🏆 লিডারবোর্ড 🏆\n\n${leaderboard.join("\n")}`,
        event.threadID,
        event.messageID
      );
    } else {
      const { question, answer } = generateMathQuestion();

      global.GoatBot.onReply.set(event.messageID, {
        commandName: "mathgame",
        messageID: event.messageID,
        answer,
        senderID: event.senderID
      });

      return api.sendMessage(
        `গণিত প্রশ্ন: ${question}\nউত্তর দিতে এই মেসেজে রিপ্লাই করুন।`,
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async function ({ event, api, reply }) {
    if (reply.commandName !== "mathgame" || reply.senderID !== event.senderID) return;

    const userAnswer = parseFloat(event.body);
    const correctAnswer = reply.answer;

    const pointsData = JSON.parse(fs.readFileSync(pointsFile));
    if (!pointsData[event.senderID]) pointsData[event.senderID] = 0;

    const userInfo = await api.getUserInfo([event.senderID]);
    const userName = userInfo[event.senderID]?.name || "Unknown User";

    if (userAnswer === correctAnswer) {
      pointsData[event.senderID] += 5000;
      fs.writeFileSync(pointsFile, JSON.stringify(pointsData, null, 2));
      await api.sendMessage(
        `${name}, আপনি সত্যিই অনেক জিনিয়াস! 😊 আপনার উত্তরটি সঠিক হয়েছে এবং আমি আপনাকে ৫০০০ পয়েন্ট দিচ্ছি!\nবর্তমান পয়েন্ট: ${pointsData[event.senderID]}`,
        event.threadID
      );
    } else {
      pointsData[event.senderID] -= 5000;
      fs.writeFileSync(pointsFile, JSON.stringify(pointsData, null, 2));
      await api.sendMessage(
        `${name}, আপনার উত্তরটি সঠিক হয়নি। 😔 আপনাকে ৫০০০ পয়েন্ট মাইনাস করে দেয়া হলো।\nসঠিক উত্তর ছিল: ${correctAnswer}\nবর্তমান পয়েন্ট: ${pointsData[event.senderID]}`,
        event.threadID
      );
    }

    global.GoatBot.onReply.delete(reply.messageID);
  }
};
