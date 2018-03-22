'use strict';

class GRect {
	constructor(left, top, right, bottom) {
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	}

	width() { return this.right - this.left; }
	height() { return this.bottom - this.top; }

	static MakeXYWH(x, y, w, h) {
		return new GRect(x, y, x+w, y+h);
	} 

	static MakeWH(w, h) {
		return new GRect(0, 0, w, h);
	}

	toList() {
		return [ this.left, this.top, this.width(), this.height() ];
	}
}

/*abstract*/ class GShader {
	constructor(pshader) {
		this.pshader = pshader;
	}
}

/*abstract*/ class GFilter {
	constructor(pshader) {
		this.pshader = pshader; // PShader, which contains a vertex shader and fragment shader
	}
}

// Not a real shader, as in it doesn't use OpenGL or a PShader
class TextureShader extends GShader {
	constructor(imgLoc) {
		super(null);
		this.img = canvas._p5.loadImage(imgLoc);
	}

	use(canvas) {
		console.log(canvas);
		canvas.texture(this.img);
	}
}

class MandelbrotShader extends GShader {
	constructor() {
		const vs = `
		// Taken from https://p5js.org/reference/#/p5/createShader
		precision highp float;
		varying vec2 vPos;

		attribute vec3 aPosition;

		uniform mat4 uProjectionMatrix;
		uniform mat4 uModelViewMatrix;

		void main() {
			mat4 mvp = uProjectionMatrix * uModelViewMatrix;

			gl_Position = mvp * vec4(aPosition,1.0);
			// vPos = aPosition.xy;
			vPos = gl_Position.xy; // this looks cooler
		}
		`;

		const fs = `
		// Taken from https://p5js.org/reference/#/p5/createShader
		precision highp float;
		varying vec2 vPos;

		uniform vec2 p;
		uniform float r;
		const int I = 500;

		uniform vec4 iResolution;

		vec4 mandelbrot() {
			vec2 c = p + vPos * r, z = c;
			float n = 0.0;
			for (int i = I; i > 0; i --) {
				if(z.x*z.x+z.y*z.y > 4.0) {
					n = float(i)/float(I);
					break;
				}
				z = vec2(z.x*z.x-z.y*z.y, 2.0*z.x*z.y) + c;
			}
			return vec4(0.5-cos(n*17.0)/2.0,0.5-cos(n*13.0)/2.0,0.5-cos(n*23.0)/2.0,1.0);
		} 

		void main() {
			gl_FragColor = mandelbrot();
		}
		`;

		const pshader = canvas._p5.createShader(vs, fs);

		super(pshader);
	}

	use(canvas) {
		canvas.shader(this.pshader);
		this.pshader.setUniform('iResolution', [ canvas.width, canvas.height ]);
		this.pshader.setUniform('p', [-0.74364388703, 0.13182590421]);
		// this.pshader.setUniform('r', 1.5 * exp(-6.5 * (1 + sin(millis() / 2000))));
		// this.pshader.setUniform('r', 10 / (canvas.frameCount ** 2)); // animated
		this.pshader.setUniform('r', 10 / (1000 ** 2));
	}
}

class GPaint {
	constructor(arg, blendmode) {
		this.color = 'rgb(0,0,0)';
		this.shader = null;
		this.filter = null;
		this.blendmode = blendmode || 'SRC_OVER';

		if (!arg) { return; }
		else if (arg instanceof GShader) { this.shader = arg; }
		else { this.color = arg; }
	}

	setShader(shader) { this.shader = shader; }
	setColor(color) { this.color = color; }
	setFilter(filter) { this.filter = filter; }

}

class GCanvas {
	constructor(width, height) {
		this._width = width || 500;
		this._height = height || 500;

		this._initCtm = mat2d.create();
		this._stack = [];
		this._ctmStack = [];
		this._layerStack = [];

		const self = this;

		this._p5 = new p5((p) => {
			/*
			p.preload = () => {
			}
			*/

			p.setup = () => {
				let canvas = p.createCanvas(width, height, p.WEBGL);
				canvas.parent('canvas-container');
				p.background(200);
			};

			p.draw = () => {
				if (this.draw) { this.draw(); }
			};
		});

	}

	drawPaint(paint) {
		// TODO
	}

	drawRect(rect, paint) {
		const color = paint.color;
		const shader = paint.shader;
		const filter = paint.filter;

		this._applyMatrix();

		this._getCanvas().push();
		this._getCanvas().translate(-this._getCanvas().width/2, -this._getCanvas().height/2);

		if (shader) {
			shader.use(this._getCanvas());
		} else {
			this._getCanvas().fill(color);
		}

		// TODO filter

		this._getCanvas().noStroke();
		this._getCanvas().beginShape();
		this._getCanvas().vertex(rect.left, rect.top, 0)
		this._getCanvas().vertex(rect.right, rect.top, 0)
		this._getCanvas().vertex(rect.right, rect.bottom, 0)
		this._getCanvas().vertex(rect.left, rect.bottom, 0)
		this._getCanvas().endShape();

		this._getCanvas().pop();
	}

	// drawConvexPolygon(points, paint) override {
	// 	const count = points.length;

	// 	if (count < 3) {
	// 		return;
	// 	}

	// 	const Layer& bitmap = getCanvas();

	// 	// Map points
	// 	const GMatrix& ctm = getCtm();
	// 	GPoint mappedPoints[count];
	// 	ctm.mapPoints(mappedPoints, points, count);

	// 	// Make edges
	// 	GEdge* clippedEdges[count * 3];
	// 	int clippedEdgesCount = 0;

	// 	// Shader
	// 	GShader* shader = paint.getShader();
	// 	GFilter* filter = paint.getFilter();
	// 	if (shader) {
	// 		shader->setContext(ctm);
	// 		// TODO what if this fails?
	// 	}

	// 	for (int i = 0; i < count; i++) {
	// 		const GPoint* p0 = &mappedPoints[i];
	// 		const GPoint* p1 = &mappedPoints[i < count-1 ? i+1 : 0];

	// 		// Sort s.t. p0.y <= p1.y
	// 		if (p0->fY > p1->fY) {
	// 			const GPoint* tmp = p0;
	// 			p0 = p1;
	// 			p1 = tmp;
	// 		}

	// 		GEdge* edge = new GEdge(p0, p1);

	// 		// Clip
	// 		edge->clipTopBot(bitmap.top(), bitmap.bottom());
	// 		GEdge** newEdges = edge->clipLeftRight(bitmap.left(), bitmap.right());

	// 		if (edge->visible) {
	// 			clippedEdges[clippedEdgesCount++] = edge;
	// 		} else {
	// 			delete edge;
	// 		}

	// 		if (newEdges) {
	// 			if (newEdges[0]) {
	// 				clippedEdges[clippedEdgesCount++] = newEdges[0];
	// 			}
	// 			if (newEdges[1]) {
	// 				clippedEdges[clippedEdgesCount++] = newEdges[1];
	// 			}
	// 		}

	// 		delete[] newEdges;
	// 	}

	// 	// Walk and blit
	// 	for (int y = bitmap.top(); y < bitmap.bottom(); y++) {
	// 		std::vector<GEdge*> edges;

	// 		for (int i = 0; i < clippedEdgesCount; i++) {
	// 			GEdge* edge = clippedEdges[i];
	// 			// TODO GRoundToInt
	// 			if (edge->topY <= y && y < edge->botY) {
	// 				edges.push_back(edge);
	// 			}
	// 		}

	// 		if (edges.size() > 0) {
	// 			// Find left and right edges
	// 			int left = GRoundToInt(edges[0]->currX), right = GRoundToInt(edges[0]->currX);
	// 			for (int i = 0; i < edges.size(); i++) {
	// 				left = std::min(left, GRoundToInt(edges[i]->currX));
	// 				right = std::max(right, GRoundToInt(edges[i]->currX));
	// 			}

	// 			left = std::max(left, bitmap.left());
	// 			right = std::min(right, bitmap.right());

	// 			// Shader
	// 			if (shader) {
	// 				GPixel row[right-left];
	// 				shader->shadeRow(left, y, right-left, row);

	// 				// Filter
	// 				if (filter) {
	// 					filter->filter(row, row, right-left);
	// 				}

	// 				// Blend
	// 				for (int x = left, i = 0; x < right; x++, i++) {
	// 					GPixel* pixel = bitmap.getAddr(x, y);
	// 					*pixel = PorterDuff_Blend(*pixel, row[i], paint.getBlendMode());
	// 				}
	// 			}
	// 			// No shader
	// 			else {
	// 				int a = 0;

	// 				// Blit scanline
	// 				for (int x = left; x < right; x++) {
	// 					GPixel out = GColorToGPixel(paint.getColor());

	// 					// Filter
	// 					if (filter) {
	// 						filter->filter(&out, &out, 1);
	// 					}

	// 					// Blend
	// 					GPixel* pixel = bitmap.getAddr(x, y);
	// 					*pixel = PorterDuff_Blend(*pixel, out, paint.getBlendMode());
	// 				}

	// 				if (a) std::cout << a << '\n';
	// 			}

	// 			// Change x
	// 			for (int i = 0; i < edges.size(); i++) {
	// 				edges[i]->currX += edges[i]->slope;
	// 			}
	// 		}

	// 	}

	// 	// Free memory
	// 	for (int i = 0; i < clippedEdgesCount; i++) {
	// 		delete clippedEdges[i];
	// 	}

	// }

	save() {
		this._stack.push('ctm');
		this._ctmStack.push(this._getCtm());
	}

	saveLayer(bounds) {
		if (!bounds) {
			bounds = GRect.MakeXYWH(0, 0, this._getCanvas().width, this._getCanvas().height);
		}

		const c = this._p5.createGraphics(bounds.width(), bounds.height());

		// TODO wrap in a proper Layer object
		const layer = {
			canvas: c,
			x: bounds.left,
			y: bounds.top
		};

		this._stack.push('layer');
		this._layerStack.push(layer);

		return c;
	}

	restore() {
		const type = this._stack.pop();

		switch (type) {
		case 'ctm':
				this._ctmStack.pop();
				break;
		case 'layer':
				const layer = this._layerStack.pop();
				this._p5.image(layer.canvas, layer.x, layer.y);
				break;
		}
	}

	clear() {
		this._getCanvas().clear();
		this._getCanvas().background(200);
		this.resetCtm();
	}

	concat(m) { mat2d.multiply(this._getCtm(), this._getCtm(), m); }
	resetCtm() { mat2d.identity(this._getCtm()); }
	translate(tx, ty) { mat2d.translate(this._getCtm(), this._getCtm(), [tx, ty]); }
	translateCenter() { this.translate(this._width / 2, this._height / 2); }
	rotate(rad) { mat2d.rotate(this._getCtm(), this._getCtm(), rad); }
	scale(sx, sy) { mat2d.scale(this._getCtm(), this._getCtm(), [sx, sy]); }

	_applyMatrix() {
		console.log('TODO!');
		// this._getCanvas().applyMatrix(...this._getCtm());
	}

	_getCtm() {
		return this._ctmStack.length > 0 ? this._ctmStack[this._ctmStack.length-1] : this._initCtm;
	}

	_getCanvas() {
		return this._layerStack.length > 0 ? this._layerStack[this._layerStack.length-1].canvas : this._p5;
	}

	/* TODO
	 * convexPoly
	 * BitmapShader
	 * CheckerShader
	 * BlendFilter
	 * blendmodes
	 * layers
	 * writeToFile()
	 * GRoundToInt
	*/

}
// TODO ctm is being applied twice
// reset all layers matrix, only use top layers?
