function evalSelectionOrLine(editor) {
	// Get selection, otherwise get current line
	// TODO flash code on run
	let code = editor.getSelectedText();
	code = code ? code : editor.session.getLine(editor.getCursorPosition().row);
	eval(code);
}

function readFromLocalStorage(editor) {
	var data = localStorage.getItem('editor_contents');
	if (data) {
		editor.setValue(data, -1); // Replace everything
		return true;
	}
	else {
		return false;
	}
}

function saveToLocalStorage(editor) {
	console.log('Saving...');
	var data = editor.getValue();
	localStorage.setItem('editor_contents', data);
}
