<cell-view>
	<span draggable="true" ondragstart={dragStarted} ondrag={dragged} ondragend={dragEnded}>
		{matrix[i].toFixed(2)}
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
		{text}
	</span>

	<script>
		this.matrix = opts.matrix;
		this.text = opts.text;
		this.xform = opts.xform;
		this.scrubamt = opts.scrubamt || 1;

		dragStarted(e) {
			this.x0 = e.clientX;
			this.matrix_old = mat2d.clone(this.matrix);
		}

		dragged(e) {
			if (e.clientX > 0) {
				let dx = e.clientX - this.x0;
				let amt = (dx / 10) * this.scrubamt;
				this.xform(this.matrix, this.matrix_old, amt);
			}
			this.parent.update();
		}

	</script>
</matrix-xformer>

<matrix-view>
	<matrix-xformer matrix={matrix} xform={rotate} scrubamt={0.01} text="Rotate"></matrix-xformer>
	<matrix-xformer matrix={matrix} xform={scale} scrubamt={0.1} text="Scale"></matrix-xformer>

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
		<button onclick={update}>Update</button>
	</div>

	<script>
		if (!opts.matrix) { throw new Error('matrix cannot be null') }

		this.matrix = opts.matrix;

		reset() {
			mat2d.identity(this.matrix);
		}

		rotate(m, m_old, amt) {
			mat2d.rotate(m, m_old, amt);
		}

		scale(m, m_old, amt) {
			mat2d.scale(m, m_old, [ 1+amt, 1+amt ]);
		}

	</script>

</matrix-view>
