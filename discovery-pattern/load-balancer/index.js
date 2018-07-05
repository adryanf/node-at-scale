var config = require('config');

var http = require('http');
var httpProxy = require('http-proxy');

var Discover = require('@dashersw/node-discover');

var loadBalancerConfig = config.get('load-balancer');

var serviceNodeMap = {};

var discovery = Discover({
    redis: {
        host: loadBalancerConfig.redis.host,
        port: loadBalancerConfig.redis.port
    }
}, function(error){
    if(!error){
        discovery.promote();
    }
});

discovery.on('added', function (node) {
    console.log("A new node has been added.");
    console.log(node);
    if(node.advertisement && node.advertisement.service){
        serviceNodeMap[node.id] = {
            hostName: node.advertisement.hostName,
            port: node.advertisement.port
        };
    }
});

discovery.on('removed', function (node) {
    console.log("A node has been removed.");
    console.log(node);
    delete serviceNodeMap[node.id];
});

var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {
    
    var serviceNodeMapKeys = Object.keys(serviceNodeMap);

    // if there are no services, give an error
    if (!serviceNodeMapKeys.length) {
        res.writeHead(503, {'Content-Type' : 'text/plain'});
        res.end('Service unavailable');
        return;
    }

    var idx = Math.floor(Math.random() * serviceNodeMapKeys.length);
    var serviceNodeIdkey = serviceNodeMapKeys[idx];
    var serviceNodeLocation = serviceNodeMap[serviceNodeIdkey];

    var target = {
        host: serviceNodeLocation.hostName,
        port: serviceNodeLocation.port
    };

    proxy.web(req, res, {
        target: target
    }, function(err){
        console.log(err)
        if(err){
            res.writeHead(503, {'Content-Type' : 'text/plain'});
            res.end('Service unavailable');
            return;
        }
    });
}).listen(loadBalancerConfig.port);
