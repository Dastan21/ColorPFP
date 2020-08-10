/*
 * ColorPFP Discord bot
 * @author Dastan21
 */

const Discord = require('discord.js');
const { token, prefix } = require('./config');
const bot = new Discord.Client();
const util = require('util')
const Jimp = require('jimp');
const Canvas = require('canvas');
const Vibrant = require('node-vibrant');

bot.on('ready', () => {
  console.log(bot.user.tag + " is online");
	// bot.user.setStatus('online');
	bot.user.setPresence({
		activity: {
			name: 'closely users pfp...',
			type: 'WATCHING'
		},
		status: 'online' }
	)
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
				showHelp(msg);
			break;
		case 'usage':
				helpCmd(msg, arguments[0]);
			break;
		case 'color':
			var role = msg.mentions.roles.last();
			var color = arguments[0].startsWith("<@&") ? arguments[1] : arguments[0];
			if (validatorRole(msg, role, color))
				changeRole(msg, role, color);
			break;
		case 'modify':
			if (arguments[0] === 'list') {
				message = new Discord.MessageEmbed()
					.setColor("WHITE")
					.setAuthor(msg.author.username, msg.author.displayAvatarURL())
					.setTitle("Modify options list panel")
					.setDescription("Use `pfp usage [OPTION]` to see its usage.")
					.setThumbnail(msg.author.avatarURL())
					.setThumbnail(bot.user.displayAvatarURL())
					.addFields(
						{ name: "• circle COLOR", value: "Creates a shadow on the pfp."},
						{ name: "• invert", value: "Creates a shadow on the pfp."},
						{ name: "• fisheye [RADIUS]", value: "Apply a fisheye effect to the pfp."},
						{ name: "• blur [VALUE]", value: "Quickly blur the pfp."},
						{ name: "• shadow [OPACITY] [SIZE] [BLUR]", value: "Creates a shadow on the pfp."},
						{ name: "• pixelate [SIZE]", value: "Pixelate the pfp."}
					)
					.setTimestamp()
					.setFooter("ColorPFP");
				msgSend(msg, "", message);
			} else
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
			{ name: "• usage COMMAND/OPTION", value: "Shows the command usage."},
			{ name: "• prominent", value: "Shows the 6 prominents colors of your pfp."},
			{ name: "• color @ROLE COLOR", value: "Update the color of a role."},
			{ name: "• modify OPTION", value: "Modify your pfp."},
			{ name: "• modify list", value: "Shows the list of options."}
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
			message = "`pfp modify circle COLOR [CIRCLE_SIZE]`\n*• COLOR: hex color\n• CIRCLE_SIZE: integer (optional)*";
			break;
		case "invert":
			message = "`pfp modify invert`";
			break;
		case "fisheye":
			message = "`pfp modify fisheye [RADIUS]`\n*• RADIUS: decimal*";
			break;
		case "blur":
			message = "`pfp modify blur [VALUE]`\n*• VALUE: decimal (optional)*";
			break;
		case "shadow":
			message = "`pfp modify shadow [OPACITY] [SIZE] [BLUR]`\n*• OPACITY: decimal (optional)\n• SIZE: decimal (optional)\n• BLUR: integer (optional)*";
			break;
		case "pixelate":
			message = "`pfp modify pixelate [SIZE]`\n*• SIZE: integer (optional)*";
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
	const img_url = msg.author.displayAvatarURL({ format: 'png' });
	const square_size = 64;
	const canvas = Canvas.createCanvas(6*square_size, square_size);
	const ctx = canvas.getContext('2d');
	await Vibrant.from(img_url).getPalette()
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
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'prominent.png');
	msgSend(msg, "", attachment);
	// msgReply(msg, str);
}

function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (~~(r) << 16) + (~~(g) << 8) + ~~(b)).toString(16).slice(1);
}

async function imageProcess(msg, args) {
	// Paths
	const img_url = msg.author.displayAvatarURL({ format: 'png' });
	// Jimp image
	var image = await Jimp.read(img_url);
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
		case 'blur':
			let n = Number(args[1]);
			if (!isNaN(n))
				await image.blur(n);
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
				await image.shadow({ opacity: o, size: s, blur: b, x: 0, y: 0 });
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
		case 'pixelate':
			let sz = args[1] ? Number(args[1]) : 8;
			if (!isNaN(sz)) {
				await image.pixelate(sz);
			} else {
				msgReply(msg, "argument must be a number.");
				return;
			}
			break;
		default:
			msgReply(msg, "unknown command.");
			return;
	}
	// Send
	image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
		msgSend(msg, "", new Discord.MessageAttachment(buffer));
	});
}


bot.login(token);
