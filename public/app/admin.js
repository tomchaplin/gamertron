var changeModeURL = '/change_mode'

var form = document.getElementById('user-form')
form.addEventListener("submit", function(e) {
	e.preventDefault();
	var pass = document.getElementById('inputPassword').value;
	var showResults = document.getElementById('showResults').checked;
	var payload = { showResults: showResults, pass: pass };
	console.log(payload);
	
	fetch(changeModeURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	})
		.then( res => res.json())
		.then( dealWithRes );

});

function dealWithRes(res) {
	if(res.err) {
		var feedback = `There was a problem: ${res.err}`;
	} else {
		var feedback = 'Mode changed'
		form.style.visibility = 'hidden';	
	}
	document.getElementById('form-feedback').innerHTML = feedback;
}
