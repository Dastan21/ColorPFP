const Discord = require('discord.js');
const { token, prefix } = require('./config');
const bot = new Discord.Client();
const util = require('util')
const Jimp = require('jimp');
const Canvas = require('canvas');
const fs = require('fs');
const Vibrant = require('node-vibrant');

bot.on('ready', () => {
  console.log(bot.user.tag + " is online");
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
			if (arguments.length == 0)
				showHelp(msg);
			else
				helpCmd(msg, arguments[0]);
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
			msgReply(msg, "this command doesn't exists.");
	}
}

function validatorRole(msg, role, color) {
	if (!msg.guild.me.hasPermission('MANAGE_ROLES'))
		{ msgReply(msg, "I don't have permissions to change the role's color."); return false; }
	if (role == undefined)
		{ msgReply(msg, "this role doesn't exists."); return false; }
	if (!color.startsWith("#") || color.length != 7)
		{ msgReply(msg, "wrong color syntax."); return false; }
	return true;
}

async function msgReply(msg, message){
	await msg
		.reply(message)
		.catch(err => {
			console.log(err);
		});
}

function msgSend(msg, message){
	msgSend(msg, message, null)
}

async function msgSend(msg, message, attachment){
	await msg.channel
		.send(message, attachment)
		.catch(err => {
			console.log(err);
		});
}

function showHelp(msg) {
	let embed = new Discord.MessageEmbed()
		.setColor("#ffffff")
		.setAuthor(msg.author.username, msg.author.displayAvatarURL())
		.setTitle("Help panel")
		.setDescription("This bot allow you to modify your profile picture and to change the color of roles.")
		.setThumbnail(msg.author.avatarURL())
		.setThumbnail(bot.user.displayAvatarURL())
		.addFields(
			{ name: "• help", value: "Shows this panel."},
			{ name: "• help [COMMAND]", value: "Shows the command syntax."},
			{ name: "• prominent", value: "Shows the 6 prominents colors of your pfp."},
			{ name: "• color @ROLE", value: "Update the color of the role mentionned."},
			{ name: "• modify [OPTION]", value: "Modify your pfp."}
		)
		.setTimestamp()
		.setFooter("ColorPFP");
	msgSend(msg, embed)
}

function helpCmd(msg, cmd) {
	let message = "";
	switch (cmd) {
		case "prominent":
			message = "`pfp prominent`";
			break;
		case "circle":
			message = "`pfp modify circle COLOR [CIRCLE_SIZE]`\n• COLOR: hex color\n• CIRCLE_SIZE: integer";
			break;
		case "invert":
			message = "`pfp invert`";
			break;
		case "normalize":
			message = "`pfp normalize`";
			break;
		case "fisheye":
			message = "`pfp fisheye [RADIUS]`\n• RADIUS: decimal";
			break;
		case "gaussian":
			message = "`pfp gaussian [VALUE]`";
			break;
		case "shadow":
			message = "`pfp shadow [OPACITY] [SIZE] [BLUR]`\n• OPACITY: decimal\n• SIZE: decimal\n• BLUE: integer";
			break;
		default:
			msgReply(msg, "this command doesn't exist.");
	}
	msgSend(msg, message);
}



async function changeRole(msg, role, color) {
	await role
		.setColor(color)
		.then(() => msgReply(msg, "new color assigned."))
		.catch(err => {
			msgReply(msg, err);
		});
}

async function showProminents(msg) {
	const img_path = msg.author.displayAvatarURL({ format: 'png' });
	const square_size = 64;
	const canvas = Canvas.createCanvas(6*square_size, square_size);
	const ctx = canvas.getContext('2d');
	await Vibrant.from(img_path).getPalette()
		.then((palette) => {
			let i = 0;
			Object.keys(palette).forEach(function(key) {
				let hex = rgbToHex(palette[key]._rgb[0], palette[key]._rgb[1], palette[key]._rgb[2]);
				// Square
				// ctx.fillStyle = 'rgb('+palette[key]._rgb[0]+','+palette[key]._rgb[1]+','+palette[key]._rgb[2]+')';
				ctx.fillStyle = hex;
				ctx.fillRect(i*square_size, 0, (i+1)*square_size, square_size);
				// Hex text
				ctx.font = 'bold 12px sans-serif';
				let lum = palette[key]._rgb[0] * 0.2126 + palette[key]._rgb[1] * 0.7152 + palette[key]._rgb[2] * 0.0722;
				ctx.fillStyle = lum < 40 ? '#ffffff' : '#000000';
				ctx.fillText(hex, i*square_size+1, 0.9*square_size);
				++i;
			})
		})
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'prominents.png');
	msgSend(msg, "", attachment);
	// msgReply(msg, str);
}

function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (~~(r) << 16) + (~~(g) << 8) + ~~(b)).toString(16).slice(1);
}

async function imageProcess(msg, args) {
	// Paths
	const dir_path = 'tmp/';
	const img_path = msg.author.displayAvatarURL({ format: 'png' });
	const tmp_path = dir_path + 'tmp_'+msg.author.id+'_'+msg.author.avatar+'.png';
	// Jimp image
	var image = await Jimp.read(img_path);
	// Dimensions
	const height = image.bitmap.height;
	const width = image.bitmap.width;
	// Process
	switch (args[0]) {
		case 'circle':
			let col = args[1];
			let lw = args[2] ? Number(args[2]) : 10;
			if (col == undefined) { msgReply(msg, "you must choose a color."); return; }
			if (!col.startsWith("#") || col.length != 7) { msgReply(msg, "wrong color syntax."); return; }
			await image.write(tmp_path);
			const img_canvas = await Canvas.loadImage(msg.author.displayAvatarURL({ format: 'png' }));
			const w_canvas = img_canvas.width;
			const h_canvas = img_canvas.height;
			const canvas = Canvas.createCanvas(w_canvas, h_canvas);
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img_canvas, 0, 0, w_canvas, h_canvas);
			ctx.beginPath();
			ctx.arc(w_canvas/2, h_canvas/2, h_canvas/2, 0, 2*Math.PI);
			ctx.strokeStyle = col;
			ctx.lineWidth = lw;
			ctx.stroke();
			image = await Jimp.read(canvas.toBuffer("image/png"));
			await image.circle();
			break;
		case 'invert':
			await image.invert();
			break;
		case 'normalize':
			await image.normalize();
			break;
		case 'gaussian':
			let n = Number(args[1]);
			if (!isNaN(n))
				await image.gaussian(n);
			else {
				msgReply(msg, "argument must be a number.");
				return;
			}
			break;
		case 'shadow':
			let o = args[1] ? Number(args[1]) : 0.7;
			let s = args[1] ? Number(args[2]) : 1;
			let b = args[1] ? Number(args[3]) : 10;
			if (!isNaN(o) && !isNaN(s) && !isNaN(b))
				// await image.shadow({ opacity: o, size: s, blur: b, x: width/2, y: height/2 });
				await image.shadow();
			else {
				msgReply(msg, "arguments must be numbers.");
				return;
			}
			break;
		case 'fisheye':
			let r = args[1] ? Number(args[1]) : 2.0;
			if (!isNaN(r))
				await image.fisheye({ r: r });
			else {
				msgReply(msg, "argument must be a number.");
				return;
			}
			break;
		default:
			msgReply(msg, "unknown command.");
			return;
	}
	// Send
	await image.write(tmp_path);
	const attachment = new Discord.MessageAttachment(tmp_path);
	msgSend(msg, "", attachment);
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


bot.login(token);
