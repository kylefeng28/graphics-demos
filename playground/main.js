'use strict';

const example = `mandelShader = new MandelbrotShader();
imgShader = new ImageShader("./img/spock.png");

draw = async function() {
	canvas.clear();

	// Animated Mandelbrot shader
	await canvas.drawRect(new GRect(0, 0, 500, 500), new GPaint(mandelShader));

	// Uncomment lines and press "Run code" to see things work!

	// Spock image shader
	// await canvas.drawRect(new GRect(0, 0,500, 500), new GPaint(imgShader));

	// Simple rectangles
	// await canvas.drawRect(new GRect(0, 0, 250, 250), new GPaint("#0095DD"));
	// await canvas.drawRect(new GRect(250, 250, 500, 500), new GPaint("#4D4E53"));
}
`;

// Init canvas
let canvas = new GCanvas(500, 500);

// Init Ace editor
let editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

// Load saved or example
if (!readFromLocalStorage(editor)) {
	loadExample(editor, example);
}

/* Keybindings */
// Save keybinding
editor.commands.addCommand({
	name: 'save',
	exec: function() {
		saveToLocalStorage(editor);
	},
	bindKey: { mac: 'Cmd-S', win: 'Ctrl-S' }
});

// Eval keybinding
editor.commands.addCommand({
	name: 'eval',
	exec: function() {
		evalSelectionOrLine(editor);
	},
	bindKey: { mac: 'Cmd-Enter', win: 'Ctrl-Enter' }
});

window.p = canvas._p;
