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
	setContext(ctm) {}
	shadeRow(x, y, count, row) {}
}

/*abstract*/ class GFilter {
	filter(outRow, inRow, count) {}
}

class BitmapShader extends GShader {
	constructor(imgLoc) {
		super();
		let self = this;
		//this.promise = new Promise((resolve, reject) => {
			self.img = canvas._p5.loadImage(imgLoc, (img) => {
				self.imgData = img.canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data;
				self.imgData = new Uint32Array(self.imgData); // Uint8Array?
				//resolve();
				console.log('BitmapShader: image loaded');
			});
		//})
	}

	// setContext(ctm) {}
	async shadeRow(x, y, count, row) {
		// await this.promise;
		if (!this.imgData) {
			console.log('BitmapShader: image not loaded yet');
			return;
		}

		// TODO optimize
		for (let i = 0; i < count; i++) {
			const j = y * this.img.width + (x + i);
			const r = this.imgData[4*j];
			const g = this.imgData[4*j+1];
			const b = this.imgData[4*j+2];
			const a = this.imgData[4*j+3];
			row[i] = `rgba(${r},${g},${b},${a})`;
		}
	}
}

class RedGreenSwapFilter extends GFilter {
	filter(outRow, inRow, count) {
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
}

class GPaint {
	constructor(arg, blendmode) {
		this.color = null;
		this.shader = null;
		this.filter = null;
		this.blendmode = blendmode || 'SRC_OVER';

		if (!arg) { this.color = 'rgba(0,0,0,255)' }
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
				let canvas = p.createCanvas(width, height);
				canvas.parent('canvas-container');
				p.background(200);
			};

			/*
			p.draw = () => {
			};
			*/
		});

	}

	drawPaint(paint) {
		// TODO
	}

	// drawRect with only colors, without shaders or filters
	_drawRect_color_only(rect, paint) {
		this._applyMatrix();
		let color = paint.color;
		this._getCanvas().noStroke();
		this._getCanvas().fill(color);
		this._getCanvas().rect(rect.left, rect.top, rect.width(), rect.height());
	}

	drawRect(rect, paint) {
		const shader = paint.shader;
		const filter = paint.filter;

		if (!shader && !filter) {
			this._drawRect_color_only(rect, paint);
			return;
		}

		// TODO this is too much magic
		this._applyMatrix();

		// More magic
		// and hacks
		if (shader instanceof BitmapShader) {
			// Create canvas
			let g = this._p5.createGraphics(rect.width(), rect.height());

			// Draw image
			g.image(shader.img, rect.left, rect.top);

			// Filter
			if (filter) {
				for (let y = rect.top; y < rect.bottom; y++) {
					for (let x = rect.left; x < rect.right; x++) {
						let p = g.get(x, y);
						filter.filter([p], [p], 1);
						g.set(x, y, p);
					}
				}
				g.updatePixels();
			}

			// Draw canvas
			this._p5.image(g, rect.left, rect.top);
			return;
		}

		for (let y = rect.top; y < rect.bottom; y++) {
			const row = new Array(rect.width());

			// Shader
			if (shader) {
				shader.setContext(this._getCtm());
				shader.shadeRow(rect.left, y, rect.width(), row);
			}
			// No shader
			else {
				row.fill(paint.color);
			}

			// Filter
			if (filter) {
				filter.filter(row, row, rect.width());
			}

			this._blitRow(rect.left, y, rect.width(), row);

		}
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

	_blitRow(x, y, count, row) {
			for (let i = 0; i < count; i++) {
				let color = row[i];
				// this._getCanvas().stroke(color);
				this._getCanvas().set(x+i, y, color);
			}
		this._getCanvas().updatePixels();
	}

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
		this.resetCtm();
	}

	concat(m) { mat2d.multiply(this._getCtm(), this._getCtm(), m); }
	resetCtm() { mat2d.identity(this._getCtm()); }
	translate(tx, ty) { mat2d.translate(this._getCtm(), this._getCtm(), [tx, ty]); }
	translateCenter() { this.translate(this._width / 2, this._height / 2); }
	rotate(rad) { mat2d.rotate(this._getCtm(), this._getCtm(), rad); }
	scale(sx, sy) { mat2d.scale(this._getCtm(), this._getCtm(), [sx, sy]); }

	_applyMatrix() {
		this._getCanvas().applyMatrix(...this._getCtm());
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
