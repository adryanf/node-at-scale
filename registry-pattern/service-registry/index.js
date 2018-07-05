var config = require('config');

var seaport = require('seaport');
var server = seaport.createServer();

var registryConfig = config.get('registry');

server.on('register', function (service) {
    console.log(service);
});

server.on('connect', function () {
    console.log('connected');
})

server.listen(registryConfig.port);