let matrix = mat2d.create();
let matrix_ = mat2d.clone(matrix);
riot.mount('matrix-view', { matrix: matrix });

// Helpers
function applyGlMatrix(m) {
	applyMatrix(...m);
}

let canvas;
let img;

function preload() {
	img = loadImage('./img/spock.png');
}

function setup() {
	canvas = createCanvas(500, 500);
	canvas.parent('canvas-container');
}

function draw() {
	// Lerp
	if (!mat2d.equals(matrix_, matrix)) {
		for (let i = 0; i < 6; i++) {
			matrix_[i] = lerp(matrix_[i], matrix[i], 0.1);
		}
	}

	// Center
	background(240);
	translate(width/2, height/2);

	// Apply transformation
	applyGlMatrix(matrix_);

	// Draw in center of canvas
	image(img, -img.width/4, -img.height/4, img.width/2, img.height/2);
}
