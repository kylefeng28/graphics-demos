'use strict';

let canvas = new GCanvas(500, 500);

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

	let filter = new GFilter();
	filter.filter = function(outRow, inRow, count) {
		for (let i = 0; i < count; i++) {
			let color = inRow[i];
			// Swap red and green
			outRow[i] = canvas._p5.color(
				canvas._p5.green(color),
				canvas._p5.red(color),
				canvas._p5.blue(color)
			);
		}
	}

	let paint = new GPaint();
	paint.setShader(shader);
	paint.setFilter(filter);

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

window.p5 = canvas._p5;
