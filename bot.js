const Discord = require('discord.js');
const { token, prefix } = require('./config');
const bot = new Discord.Client();
const util = require('util')
const Jimp = require('jimp');
const Canvas = require('canvas');
const fs = require('fs');
const Vibrant = require('node-vibrant');

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
		case 'color':
			var role = msg.mentions.roles.last();
			var color = arguments[0].startsWith("<@&") ? arguments[1] : arguments[0];
			if (validatorRole(msg, role, color))
				changeRole(msg, role, color);
			break;
		case 'modify':
			imageProcess(msg, arguments);
			break;
		case 'prominent':
			showProminents(msg);
			break;
		default:
			sendMsg(msg, "cette commande n'existe pas.");
	}
}

function validatorRole(msg, role, color) {
	if (!msg.guild.me.hasPermission('MANAGE_ROLES'))
		{ sendMsg(msg, "je n'ai pas les permissions pour changer la couleur du rôle."); return false; }
	if (role == undefined)
		{ sendMsg(msg, "ce rôle n'existe pas."); return false; }
	if (!color.startsWith("#") || color.length != 7)
		{ sendMsg(msg, "la couleur est incorrecte."); return false; }
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
		.setDescription("Ce bot permet d'éditer votre photo de profile.")
		.setThumbnail(msg.author.avatarURL())
		.setThumbnail(bot.user.displayAvatarURL())
		.addFields(
			{ name: "• help", value: "Affiche ce panneau d'aide."},
			{ name: "• prominent", value: "Affiche les 6 couleurs dominantes de ta photo de profile."},
			{ name: "• color @ROLE", value: "Met à jour la couleur du rôle mentionné."},
			{ name: "• modify [OPTION]", value: "Applique un filtre à ta photo de profile."}
		)
		.setTimestamp()
		.setFooter("ColorPFP");
	sendMsg(msg, embed)
}

async function changeRole(msg, role, color) {
	await role
		.setColor(color)
		.then(() => sendMsg(msg, "nouvelle couleur appliquée."))
		.catch(err => {
			sendMsg(msg, err);
		});
}

async function showProminents(msg) {
	const img_path = msg.author.displayAvatarURL({ format: 'png' });
	const square_size = 64;
	const canvas = Canvas.createCanvas(6*square_size, square_size);
	const ctx = canvas.getContext('2d');
	let str = "here are the prominents colors:\n";
	await Vibrant.from(img_path).getPalette()
		.then((palette) => {
			let i = 0;
			Object.keys(palette).forEach(function(key) {
				// console.table('Key : ' + key + ', Value : ' + palette[key]._rgb);
				let hex = rgbToHex(palette[key]._rgb[0], palette[key]._rgb[1], palette[key]._rgb[2]);
				str += "• " + key + ": " + hex.toUpperCase() + "\n"
				// Square
				ctx.fillStyle = hex;
				ctx.fillRect(i*square_size, 0, (i+1)*square_size, square_size);
				// Hex text
				ctx.font = 'bold 12px sans-serif';
				ctx.fillStyle = '#ffffff';
				ctx.fillText(hex, i*square_size+1, 0.9*square_size);
				++i;
			})
		})
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'palette.png');
	await msg.channel.send("", attachment);
	// sendMsg(msg, str);
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

async function imageProcess(msg, args) {
	// Paths
	const dir_path = 'tmp/';
	const img_path = msg.author.displayAvatarURL({ format: 'png' });
	const tmp_path = dir_path + 'tmp_'+msg.author.id+'_'+msg.author.avatar+'.png';
	// Jimp image
	const image = await Jimp.read(img_path);
	// Dimensions
	const height = image.bitmap.height;
	const width = image.bitmap.width;
	// Process
	switch (args[0]) {
		case 'circle':
			drawCircle(msg, image);
			break;
		case 'invert':
			image.invert();
			break;
		case 'normalize':
			image.normalize();
			break;
		case 'gaussian':
			let n = Number(args[1]);
			if (!isNaN(n))
				image.gaussian(n);
			else {
				sendMsg(msg, "le nombre doit être un nombre.");
				return;
			}
			break;
		case 'shadow':
			image.shadow({ opacity: 0.7, size: 1, blur: 10, x: 0, y: 0 });
			break;
		case 'fisheye':
			image.fisheye({ r: 2.0 });
			break;
		default:
			sendMsg(msg, "l'option est inconnue.");
			return;
	}
	// Send
	image.write(tmp_path);
	const attachment = new Discord.MessageAttachment(tmp_path);
	await msg.channel.send("", attachment);
	await setInterval(() => {
		fs.exists(tmp_path, function(exists) {
			if(exists) {
				fs.unlink(tmp_path, (err) => {
					if (err) { throw err; }
				})
			}
		})
	}, 100);
}

async function drawCircle(msg, img) {
	// img.write(tmp_path);
	// const image = await Canvas.loadImage(msg.author.displayAvatarURL({ format: 'png' }));
	// const width = image.width;
	// const height = image.height;
	// const canvas = Canvas.createCanvas(width, height);
	// const ctx = canvas.getContext('2d');
	// ctx.drawImage(image, 0, 0, width, height);
	// ctx.beginPath();
	// ctx.arc(width/2, height/2, height/2, 0, 2*Math.PI);
	// ctx.strokeStyle = '#ffffff';
	// ctx.stroke();
	// canvas.toBlob(function(blob) {
	//     saveAs(blob, tmp_path);
	// });
	// img = await Jimp.read(tmp_path);
	// img.circle({ radius: height/2, x: width/2, y: height/2 });
	const canvas = Canvas.createCanvas(200, 200);
	const ctx = canvas.getContext('2d');

	ctx.font = '30px Impact';
	ctx.rotate(.1);
	ctx.fillText("Awesome!", 50, 100);

	var te = ctx.measureText('Awesome!');
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.beginPath();
	ctx.lineTo(50, 102);
	ctx.lineTo(50 + te.width, 102);
	ctx.stroke();

	console.log('<img src="' + canvas.toDataURL() + '" />');
	img.circle();
}


bot.login(token);
