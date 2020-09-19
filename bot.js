/*
 * ColorPFP Discord bot
 * @author Dastan21
 */

const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config');
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
	if (msg.content.toLowerCase().startsWith(config.prefix))
		commandProcess(msg);
});

async function commandProcess(msg) {
	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(config.prefix.length+1);
    let splitCommand = fullCommand.split(' ');
    let primaryCommand = splitCommand[0];
    let arguments = splitCommand.slice(1);

	switch (primaryCommand) {
		case 'help':
			if (arguments.length < 1)
				showHelp(msg);
			else
				showMoreHelp(msg, arguments[0]);
			break;
		case 'show':
			const size_array = [ 16, 32, 64, 128, 256, 512, 1024 ];
			let size = arguments[0] ? Number(arguments[0]) : config.const.SHOW_SIZE;
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
				changeRoleColor(msg, role, color);
			break;
		case 'effect':
			const pfp_url = isImgURL(arguments[arguments.length-1]) ? arguments[arguments.length-1] : msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: config.const.EFFECT_SIZE});
			const res = await phin({ 'url': pfp_url });
			var img_type = "gif";
			try { await Jimp.read(pfp_url); } catch (e) { img_type = null; }
			if (img_type != null) try { await GifUtil.read(res.body); } catch (e) { img_type = "png"; }
			if (img_type === "gif")
				gifModify(msg, arguments, res.body);
			else if (img_type === "png")
				imgModify(msg, arguments, pfp_url);
			else
				msgReply(msg, "the image link must end with an extension.");
			break;
		default:
			msgReply(msg, "this command doesn't exists.");
	}
}

function isImgURL(url) {
	return url.startsWith("https://") || url.startsWith("http://");
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
		.setColor("#fffffe")
		.setTitle("Help panel")
		.setDescription("ColorPFP allows you to apply effects on your profile picture or any other image plus some extras commands")
		.setThumbnail(bot.user.displayAvatarURL())
		.addFields(
			{
				name: "[ Basic commands ]",
				value: "`help` `prominent` `show` `color` `effect`"
			},
			{
				name: "[ Effect commands ]",
				value:
				"`circle` `round` `invert` `fisheye` `blur` `pixel` `sepia` `gray`"
			},
			{
				name: "‎",
				value:
				"P.S: You can use any image for the effects commands by adding a link to this image at the end of these commands"
			}
		)
		.setTimestamp()
		.setFooter("Created by Dastan#4444");
	msgSend(msg, embed)
}

function showMoreHelp(msg, cmd) {
	let correct = true;
	let embed = new Discord.MessageEmbed().setColor("#fffffe");
	switch (cmd) {
		/* Basic commands */
		case "help":
			embed.setTitle("HELP").addFields({ name: "‎", value: "Really?!" });
			break;
		case "prominent":
			embed.setTitle("PROMINENT").addFields({ name: "[ Usage ]", value: "`pfp prominent`" }, { name: "[ Description ]" , value: "*Show the 6 prominents colors of your pfp*" });
			break;
		case "show":
			embed.setTitle("SHOW").addFields({ name: "[ Usage ]", value: "`pfp show [SIZE]`" }, { name: "[ Default ]", value: "• SIZE: `"+config.const.SHOW_SIZE+"`" }, { name: "[ Description ]" , value: "*Show your pfp*" });
			break;
		case "color":
			embed.setTitle("COLOR").addFields({ name: "[ Usage ]", value: "`pfp color @ROLE #COLOR`" }, { name: "[ Description ]" , value: "*Change color of a role*" });
			break;
		case "effect":
			embed.setTitle("EFFECT").addFields({ name: "[ Usage ]", value: "`pfp effect EFFECT`" }, { name: "[ Description ]" , value: "*Apply an effect to the image*" });
			break;
		/* Effect commands */
		case "circle":
			embed.setTitle("CIRCLE").addFields({ name: "[ Usage ]", value: "`pfp effect circle #COLOR [CIRCLE_SIZE]`" }, { name: "[ Default ]", value: "• CIRCLE_SIZE: `"+config.const.CIRCLE_SIZE+"`" }, { name: "[ Description ]" , value: "*Draw a circle around the image*" });
			break;
		case "round":
			embed.setTitle("ROUND").addFields({ name: "[ Usage ]", value: "`pfp effect round`" }, { name: "[ Description ]" , value: "*Round the image with transparency*" });
			break;
		case "invert":
			embed.setTitle("INVERT").addFields({ name: "[ Usage ]", value: "`pfp effect invert`" }, { name: "[ Description ]" , value: "*Invert the image colors*" });
			break;
		case "fisheye":
			embed.setTitle("FISHEYE").addFields({ name: "[ Usage ]", value: "`pfp effect fisheye [RADIUS]`" }, { name: "[ Default ]", value: "• RADIUS: `"+config.const.FISHEYE_RADIUS+"`" }, { name: "[ Description ]" , value: "*Apply a fisheye effect to the image*" });
			break;
		case "blur":
			embed.setTitle("FISHEYE").addFields({ name: "[ Usage ]", value: "`pfp effect blur [VALUE]`" }, { name: "[ Default ]", value: "• VALUE: `"+config.const.BLUR_VALUE+"`" }, { name: "[ Description ]" , value: "*Quickly blur the image*" });
			break;
		case "pixel":
			embed.setTitle("PIXELATE").addFields({ name: "[ Usage ]", value: "`pfp effect pixel [SIZE]`" }, { name: "[ Default ]", value: "• SIZE: `"+config.const.PIXEL_SIZE+"`" }, { name: "[ Description ]" , value: "*Pixelize the image*" });
			break;
		case "sepia":
			embed.setTitle("SEPIA").addFields({ name: "[ Usage ]", value: "`pfp effect sepia`" }, { name: "[ Description ]" , value: "*Apply a sepia wash to the image*" });
			break;
		case "gray":
			embed.setTitle("GRAY").addFields({ name: "[ Usage ]", value: "`pfp effect gray`" }, { name: "[ Description ]" , value: "*Remove color from the image*" });
			break;
		default:
			msgReply(msg, "this command doesn't exist.");
			correct = false;
	}
	if (correct)
		msgSend(msg, embed)
}

async function changeRoleColor(msg, role, color) {
	await role
		.setColor(color)
		.then(() => msgReply(msg, "new color assigned to <@&"+role.id+">."))
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

function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (~~(r) << 16) + (~~(g) << 8) + ~~(b)).toString(16).slice(1); }

async function imgModify(msg, args, img_url) {
	const img_name = msg.author.id + ".png";
	var img = await effectProcess(msg, args, await Jimp.read(img_url));
	if (args[0] === 'circle') {
		args[0] = 'round';
		img = await effectProcess(msg, args, img);
	}
	msgSend(msg, "", new Discord.MessageAttachment(await img.getBufferAsync(Jimp.MIME_PNG)), img_name);
}

async function gifModify(msg, args, gif_buf) {
	const gif_name = msg.author.id + ".gif";
	var frames = [];
	var frame;
	var img;
	let strEffect = ""; for (var a = 0; a < args.length; a++) { if (!isImgURL(args[a])) { if (a > 0) strEffect = strEffect + " "; strEffect = strEffect + args[a]; } }
	var msgBar = await msg.channel.send("", new Discord.MessageEmbed().setColor("#fffffe").addFields({ name: "[ Effect in progress ]", value: "`"+strEffect+"`" }, { name: "[ Progress bar ]", value: "`🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬   0%`" }));
	var gif = await GifUtil.read(gif_buf);
	for (var i = 0; i < gif.frames.length; i++) {
		frame = gif.frames[i];
		let strProgress = "`"; let valProgress = Math.floor((i+1)/gif.frames.length*48); for (var j = 0; j < 49; j++) { if (j != valProgress) strProgress = strProgress + "▬"; else strProgress = strProgress + "🔘"; } strProgress = strProgress + "   "+ Math.floor(valProgress/48*100)+"%`";
		await msgBar.edit("", new Discord.MessageEmbed().setColor("#fffffe").addFields({ name: "[ Effect in progress ]", value: "`"+strEffect+"`" }, { name: "[ Progress bar ]", value: strProgress }));
		img = await Jimp.read(frame.bitmap);
		img = await effectProcess(msg, args, img);
		await GifUtil.quantizeWu(new BitmapImage(img.bitmap), 256);
		await frames.push(new GifFrame(img.bitmap, { xOffset: frame.xOffset, yOffset: frame.yOffset, disposalMethod: frame.disposalMethod, delayCentisecs: frame.delayCentisecs, interlaced: frame.interlaced }));
	};


	const encoder = new GifCodec();
	gif = await encoder.encodeGif(frames);
	await msgBar.delete();
	if (args[0] === 'circle') {
		args[0] = 'round';
		gifModify(msg, args, gif.buffer);
	} else {
		await msg.channel.send("", new Discord.MessageAttachment(gif.buffer, gif_name));
	}
}

async function effectProcess(msg, args, image) {
	var img = image;
	// Dimensions
	const height = img.bitmap.height;
	const width = img.bitmap.width;
	// Process
	switch (args[0]) {
		case 'circle':
			let col = args[1];
			let lw = args[2] && !isImgURL(args[2]) ? Number(args[2]) : config.const.CIRCLE_SIZE;
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
			break;
		case 'round':
			await img.circle();
			break;
		case 'invert':
			await img.invert();
			break;
		case 'blur':
			let n = args[1] && !isImgURL(args[1]) ? Number(args[1]) : config.const.BLUR_VALUE;
			if (!isNaN(n))
				await img.blur(n);
			else {
				msgReply(msg, "argument must be a number.");
				return false;
			}
			break;
		case 'fisheye':
			let r = args[1] && !isImgURL(args[1]) ? Number(args[1]) : config.const.FISHEYE_RADIUS;
			if (!isNaN(r))
				await img.fisheye({ r: r });
			else {
				msgReply(msg, "argument must be a number.");
				return false;
			}
			break;
		case 'pixel':
			let sz = args[1] && !isImgURL(args[1]) ? Number(args[1]) : config.const.PIXEL_SIZE;
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


bot.login(config.token);
