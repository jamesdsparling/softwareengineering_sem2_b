function getTickets() {
    var data = {}
    data.requestType = "ticket"
    post('/api/makeRequest', data)
}

function post(path, data) {

}