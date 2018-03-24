'use strict';

// Init canvas
let canvas = new GCanvas(500, 500);

// Init Ace editor
let editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

// Load
readFromLocalStorage(editor);

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

function test1() {
	canvas.drawRect(new GRect(50, 50, 100, 100), new GPaint("#0095DD"));
	canvas.drawRect(new GRect(0,0, 50, 50), new GPaint("#4D4E53"));
}

function test2()  {
	let shader = new GShader();
	shader.setContext = function(ctm) {
	}

	shader.shadeRow = function(x, y, count, row) {
		for (let i = 0; i < count; i++) {
			row[i] = "rgb(" + Math.round((i/count)*255) + ",0,0)";
		}
	}

	let paint = new GPaint();
	paint.setShader(shader);
	paint.setFilter(new RedGreenSwapFilter());

	canvas.resetCtm();
	canvas.translateCenter();
	canvas.drawRect(new GRect(-25,-25,25,25), paint);
	canvas.resetCtm();

}

/*
canvas.onReady(function() {
	test1();
	test2();
})
*/

window.p = canvas._p;
