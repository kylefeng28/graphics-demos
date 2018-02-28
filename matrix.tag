<cell-view>
	<span draggable="true" ondragstart={dragStarted} ondrag={dragged} ondragend={dragEnded}>
		<strong>{matrix[i].toFixed(2)}</strong>
	</span>

	<script>
		this.matrix = opts.matrix;
		this.i = opts.i;
		this.scrubamt = opts.scrubamt || 0.1;

		dragStarted(e) {
			this.x0 = e.clientX;
			this.matrix_old = mat2d.clone(this.matrix);
		}

		dragged(e) {
			if (e.clientX > 0) {
				let dx = e.clientX - this.x0;
				this.matrix[this.i] = this.matrix_old[this.i] + (dx / 10) * this.scrubamt;
			}
		}

	</script>
</cell-view>

<matrix-xformer>
	<span draggable="true" ondragstart={dragStarted} ondrag={dragged} ondragend={dragEnded}>
		<strong>{text}</strong>
	</span>

	<script>
		this.matrix = opts.matrix;
		this.text = opts.text;
		this.xform = opts.xform;
		this.scrubamt = opts.scrubamt || 1;

		dragStarted(e) {
			this.x0 = e.clientX;
			this.y0 = e.clientY;
			this.matrix_old = mat2d.clone(this.matrix);
		}

		dragged(e) {
			if (e.clientX > 0) {
				let dx = e.clientX - this.x0;
				let dy = e.clientY - this.y0;
				let amtx = (dx / 10) * this.scrubamt;
				let amty = (dy / 10) * this.scrubamt;
				this.xform(this.matrix, this.matrix_old, amtx, amty);
			}
			this.parent.update();
		}

	</script>
</matrix-xformer>

<matrix-view>
	<p>
		Click and drag anything in bold to change the value:
	</p>

	<matrix-xformer matrix={matrix} xform={rotate} scrubamt={0.01} text="Rotation"></matrix-xformer>
	<matrix-xformer matrix={matrix} xform={scale} scrubamt={0.1} text="Scale"></matrix-xformer>
	<matrix-xformer matrix={matrix} xform={translate} scrubamt={10} text="Translation"></matrix-xformer>

	<div>
		<!--TODO settranslate, rotate, etc-->
		<span>
			<cell-view matrix={matrix} i={0}></cell-view>
			<cell-view matrix={matrix} i={2}></cell-view>
			<cell-view matrix={matrix} i={4} scrubamt={10}></cell-view>
		</span><br/>
		<span>
			<cell-view matrix={matrix} i={1}></cell-view>
			<cell-view matrix={matrix} i={3}></cell-view>
			<cell-view matrix={matrix} i={5} scrubamt={10}></cell-view>
		</span><br/>
		<span>
			<span>0.00</span>
			<span>0.00</span>
			<span>1.00</span>
		</span><br/>
		<button onclick={reset}>Reset</button>
		<!--<button onclick={update}>Update</button>-->
		<button onclick={randomize}>Randomize</button>
	</div>

	<script>
		if (!opts.matrix) { throw new Error('matrix cannot be null') }

		this.matrix = opts.matrix;

		reset() {
			mat2d.identity(this.matrix);
		}

		randomize() {
			this.matrix[0] = random(-1, 1);
			this.matrix[1] = random(-1, 1);
			this.matrix[2] = random(-1, 1);
			this.matrix[3] = random(-1, 1);
		}

		rotate(m, m_old, amt) {
			mat2d.rotate(m, m_old, amt);
		}

		scale(m, m_old, amt) {
			mat2d.scale(m, m_old, [ 1+amt, 1+amt ]);
		}

		translate(m, m_old, amtx, amty) {
		    console.log(amtx, amty);
			mat2d.translate(m, m_old, [amtx, amty]);
		}

	</script>

</matrix-view>
