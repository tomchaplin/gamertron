var newUserURL = '/new_user'

var form = document.getElementById('user-form')
form.addEventListener("submit", function(e) {
	e.preventDefault();
	var user = document.getElementById('inputUser').value;
	var pass = document.getElementById('inputPassword').value;
	var payload = { user: user, pass: pass };
	
	fetch(newUserURL, {
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
		var feedback = `Your account was succesfully created, please check back later. Don't forget your password!`
		form.style.visibility = 'hidden';	
	}
	document.getElementById('form-feedback').innerHTML = feedback;
}
