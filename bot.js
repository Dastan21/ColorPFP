const Discord = require('discord.js');
const { token, prefix } = require('./config');
const bot = new Discord.Client();
const util = require('util')
var Jimp = require('jimp');

bot.on('ready', () => {
  console.log(bot.user.tag + " est en ligne");
	bot.user.setStatus('online');
})


bot.on('message', msg => {
	if (msg.content.toLowerCase().startsWith(prefix))
		cmdProcess(msg);
});

async function cmdProcess(msg) {
	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(prefix.length+1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0];
    let arguments = splitCommand.slice(1);

	switch (primaryCommand) {
		case 'help':
			helpCmd(msg);
			break;
		case 'update':
			var role = msg.mentions.roles.first();
			if (validatorRole(msg, role))
				pfpProcess(msg, role);
			break;
		default:
			sendMsg(msg, "cette commande n'existe pas.");
	}
}

function validatorRole(msg, role) {
	if (!msg.guild.me.hasPermission('MANAGE_ROLES'))
		{ sendMsg(msg, "je n'ai pas les permissions pour changer la couleur du rôle."); return false; }
	if (role == undefined)
		{ sendMsg(msg, "ce rôle n'existe pas."); return false; }
	return true;
}

async function sendMsg(msg, message){
	await msg
		.reply(message)
		.catch();
}

function helpCmd(msg) {
	let embed = new Discord.MessageEmbed()
		.setColor("#ffffff")
		.setAuthor(msg.author.username, msg.author.displayAvatarURL())
		.setTitle("Panneau d'aide")
		.setDescription("Ce bot permet de changer la couleur d'un rôle en fonction de la couleur de votre image de profile.")
		.setThumbnail(msg.author.avatarURL())
		.setThumbnail(bot.user.displayAvatarURL())
		.addFields(
			{ name: "• help", value: "Affiche ce panneau d'aide."},
			{ name: "• update @Role", value: "Met à jour la couleur du rôle mentionné."}
		)
		.setTimestamp()
		.setFooter("ColorPFP");
	sendMsg(msg, embed)
}

async function pfpProcess(msg, role){
	Jimp.read("https://cdn.discordapp.com/avatars/"+msg.author.id+"/"+msg.author.avatar+".png", (err, img) => {
		if (err) throw err;
		var imgWidth = img.bitmap.width;
		var imgHeight = img.bitmap.height;
		var pxlColor;
		var red = 0; var green = 0; var blue = 0; var alpha = 0;
		var count = 0;
		img.scan(0, 0, imgWidth, imgHeight, function(x, y, idx) {
			pxlColor = img.getPixelColor(x, y);
			alpha = this.bitmap.data[idx + 3];
			if (alpha >= 128) {
				red += this.bitmap.data[idx + 0];
				green += this.bitmap.data[idx + 1];
				blue += this.bitmap.data[idx + 2];
				++count;
			}
			if (x == imgWidth - 1 && y == imgHeight - 1)
				changeRole(msg, role, averageColor(red, green, blue, count));
		});
	});
}

function averageColor(r, g, b, c) {
	return [~~(r/c), ~~(g/c), ~~(b/c)];
}

async function changeRole(msg, role, color) {
	await role
		.setColor(color)
		.then(() => sendMsg(msg, "nouvelle couleur appliquée."))
		.catch(err => {
			console.error(err);
		});
}

bot.login(token);
