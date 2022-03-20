function logIn() {
    var data = {}
    data.email = $('#email').val();
    data.password = $('#password').val();

    post('/signin', data);
}

function post(path, data) {
    var json = JSON.stringify(data)
    $.ajax({
        url: path,
        type: "POST",
        data: json,
        contentType: 'application/json',
        success: function(rt) {
            console.log(rt);
            window.location.href = "main.html";
        }
    })
}