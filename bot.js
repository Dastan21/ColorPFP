/*
 * ColorPFP Discord bot
 * @author Dastan21
 */

const Discord = require('discord.js');
const { token, prefix } = require('./config');
const bot = new Discord.Client();
const util = require('util')
const Jimp = require('jimp');
const { createCanvas, ImageData} = require('canvas');
const Vibrant = require('node-vibrant');
const { GifFrame, GifUtil, GifCodec, BitmapImage } = require('gifwrap');
const phin = require('phin');

bot.on('ready', () => {
  console.log(bot.user.tag + " is online");
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
		commandProcess(msg);
});

async function commandProcess(msg) {
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
			showUsage(msg, arguments[0]);
			break;
		case 'show':
			const size_array = [ 16, 32, 64, 128, 256, 512, 1024 ];
			let size = arguments[0] ? Number(arguments[0]) : 128;
			if (isNaN(size) || !size_array.includes(size)) {
				msgReply(msg, "number must be 16, 32, 64, 128, 256, 512 or 1024.");
				return;
			}
			let img_url = msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: size });
			msgSend(msg, img_url);
			break;
		case 'prominent':
			showProminentsColors(msg);
			break;
		case 'color':
			var role = msg.mentions.roles.last();
			var color = arguments[0].startsWith("<@&") ? arguments[1] : arguments[0];
			if (validatorRole(msg, role, color))
				changeColorRole(msg, role, color);
			break;
		case 'modify':
			if (arguments[0] === 'list') {
				message = new Discord.MessageEmbed()
					.setColor("WHITE")
					.setAuthor(msg.author.username, msg.author.displayAvatarURL())
					.setTitle("Modify options list panel")
					.setDescription("Type `pfp usage [OPTION]` to see its usage.")
					.setThumbnail(msg.author.avatarURL())
					.setThumbnail(bot.user.displayAvatarURL())
					.addFields(
						{ name: "• circle #COLOR [CIRCLE_SIZE]", value: "Draw a circle around the pfp."},
						{ name: "• invert", value: "Invert an images colors."},
						{ name: "• fisheye [RADIUS]", value: "Apply a fisheye effect to the pfp."},
						{ name: "• blur [VALUE]", value: "Quickly blur the pfp."},
						{ name: "• pixelate [SIZE]", value: "Pixelate the pfp."},
						{ name: "• sepia", value: "Apply a sepia wash to the pfp."},
						{ name: "• gray", value: "Remove colour from the pfp."}
					)
					.setTimestamp()
					.setFooter("ColorPFP");
				msgSend(msg, "", message);
			} else {
				const pfp_url = msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 128});
				if (pfp_url.slice(0,(pfp_url.length-9)).endsWith('.gif'))
					gifModify(msg, arguments, pfp_url);
				else
					imgModify(msg, arguments, pfp_url);
			}
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
	if (color == undefined || !color.startsWith("#") || color.length != 7)
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
	msgSend(msg, message, null);
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
			{ name: "• help", value: "Show this panel."},
			{ name: "• prominent", value: "Show the 6 prominents colors of your pfp."},
			{ name: "• usage OPTION", value: "Show the command usage."},
			{ name: "• show [SIZE]", value: "Show the pfp."},
			{ name: "• color @ROLE #COLOR", value: "Update the color of a role."},
			{ name: "• modify OPTION", value: "Modify your pfp."},
			{ name: "• modify list", value: "Show the options' list."}
		)
		.setTimestamp()
		.setFooter("ColorPFP");
	msgSend(msg, embed)
}

function showUsage(msg, cmd) {
	let message = "";
	switch (cmd) {
		case "circle":
			message = "`pfp modify circle #COLOR [CIRCLE_SIZE]`\n*• #COLOR: hex color\n• CIRCLE_SIZE: integer (optional)*";
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
		case "pixelate":
			message = "`pfp modify pixelate [SIZE]`\n*• SIZE: integer (optional)*";
			break;
		case "sepia":
			message = "`pfp modify sepia`";
			break;
		case "gray":
			message = "`pfp modify gray`";
			break;
		default:
			msgReply(msg, "this command doesn't exist.");
	}
	msgSend(msg, message);
}

async function changeColorRole(msg, role, color) {
	await role
		.setColor(color)
		.then(() => msgReply(msg, "new color assigned."))
		.catch(err => {
			msgReply(msg, err);
		});
}

async function showProminentsColors(msg) {
	const img_url = msg.author.displayAvatarURL({ format: 'png' });
	const square_size = 64;
	const canvas = createCanvas(6*square_size, square_size);
	const ctx = canvas.getContext('2d');
	await Vibrant.from(img_url).getPalette()
		.then((palette) => {
			let i = 0;
			Object.keys(palette).forEach(function(key) {
				let hex = rgbToHex(palette[key]._rgb[0], palette[key]._rgb[1], palette[key]._rgb[2]);
				// Square
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
}

function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (~~(r) << 16) + (~~(g) << 8) + ~~(b)).toString(16).slice(1);
}

async function imgModify(msg, arguments, img_url) {
	modifyProcess(msg, arguments, await Jimp.read(img_url)).then(function(img) {
		if (img != null) {
			img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
				msgSend(msg, "", new Discord.MessageAttachment(buffer));
			});
		}
	});
}

async function gifModify(msg, args, gif_url) {
	const gif_name = msg.author.id + ".gif";
	const res = await phin({
		'url': gif_url
	});
	var frames = [];
	var img;
	await GifUtil.read(res.body).then(inputGif => {
		inputGif.frames.forEach((frame, frameIndex) => {
			Jimp.read(frame.bitmap, async function(err, image) {
				if (img != false) {
					await modifyProcess(msg, args, image).then(res => img = res);
					await GifUtil.quantizeDekker(new BitmapImage(img.bitmap), 256);
					await frames.push(new GifFrame(img.bitmap, { xOffset: await frame.xOffset, yOffset: await frame.yOffset, disposalMethod: await frame.disposalMethod, delayCentisecs: await frame.delayCentisecs, interlaced: await frame.interlaced }));
				}
			})
		});
	});
	if (img != false) {
		setTimeout(function() {
			let encoder = new GifCodec();
			encoder.encodeGif(frames).then(gif => {
				msgSend(msg, "", new Discord.MessageAttachment(gif.buffer, gif_name))
					.catch(err => {
						msgReply(msg, "sorry, the pfp took too long to upload.");
					});
			});
		}, 100);
	}
}

async function modifyProcess(msg, args, image) {
	var img = image;
	// Dimensions
	const height = img.bitmap.height;
	const width = img.bitmap.width;
	// Process
	switch (args[0]) {
		case 'circle':
			let col = args[1];
			let lw = args[2] ? Number(args[2]) : 20;
			if (col == undefined) { msgReply(msg, "you must choose a color."); return false; }
			if (!col.startsWith("#") || col.length != 7) { msgReply(msg, "wrong color syntax."); return false; }
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');
			var img_data = new ImageData(new Uint8ClampedArray(img.bitmap.data), width, height);
			ctx.putImageData(img_data, 0, 0);
			ctx.beginPath();
			ctx.arc(width/2, height/2, height/2, 0, 2*Math.PI);
			ctx.strokeStyle = col;
			ctx.lineWidth = lw;
			ctx.stroke();
			img = await Jimp.read(canvas.toBuffer(Jimp.MIME_PNG));
			await img.circle();
			break;
		case 'invert':
			await img.invert();
			break;
		case 'blur':
			let n = args[1] ? Number(args[1]) : 2;
			if (!isNaN(n))
				await img.blur(n);
			else {
				msgReply(msg, "argument must be a number.");
				return false;
			}
			break;
		case 'fisheye':
			let r = args[1] ? Number(args[1]) : 2.0;
			if (!isNaN(r))
				await img.fisheye({ r: r });
			else {
				msgReply(msg, "argument must be a number.");
				return false;
			}
			break;
		case 'pixelate':
			let sz = args[1] ? Number(args[1]) : 8;
			if (!isNaN(sz)) {
				await img.pixelate(sz);
			} else {
				msgReply(msg, "argument must be a number.");
				return false;
			}
			break;
		case 'sepia':
			await img.sepia();
			break;
		case 'gray':
			await img.grayscale();
			break;
		default:
			msgReply(msg, "unknown command.");
			return false;
	}
	return img;
}


bot.login(token);
