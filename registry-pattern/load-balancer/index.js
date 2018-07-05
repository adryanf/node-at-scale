var config = require('config');

var http = require('http');
var httpProxy = require('http-proxy');

var seaport = require('seaport');

var loadBalancerConfig = config.get('load-balancer');

var sc = seaport.connect(loadBalancerConfig.service.registry.host, loadBalancerConfig.service.registry.port);

var servicesMap = {};

sc.on('register', function (service) {
    console.log('registered');
    console.log(service);
    servicesMap[service.id] = {
        host: service.host,
        port: service.port
    };
});

sc.on('free', function (service) {
    console.log('freed');
    console.log(service);
    delete servicesMap[service.id];
});

var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {
    
    var serviceMapKeys = Object.keys(servicesMap);

    // if there are no services, give an error
    if (!serviceMapKeys.length) {
        res.writeHead(503, {'Content-Type' : 'text/plain'});
        res.end('Service unavailable');
        return;
    }

    var idx = Math.floor(Math.random() * serviceMapKeys.length);
    var serviceIdkey = serviceMapKeys[idx];
    var serviceLocation = servicesMap[serviceIdkey];

    proxy.web(req, res, {
        target: {
            host: serviceLocation.host,
            port: serviceLocation.port
        }
    });
}).listen(loadBalancerConfig.port);