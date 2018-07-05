var config = require('config');

var http = require('http');
var httpProxy = require('http-proxy');

var Discover = require('@dashersw/node-discover');

var loadBalancerConfig = config.get('load-balancer');

var discovery = Discover({
    redis: {
        host: loadBalancerConfig.redis.host,
        port: loadBalancerConfig.redis.port
    }
}, function(error){
    if(!error){
        discovery.promote();

        var success = discovery.join(loadBalancerConfig.service.name, function (data) {
            console.log(data);
        });

        if (!success) {
            //could not join that channel; probably because it is reserved
        }
    }
});
var nodeMap = {};

discovery.on('added', function (node) {
    console.log("A new node has been added.");
    console.log(node);
    nodeMap[node.id] = {
        hostName: node.advertisement.hostName,
        port: node.advertisement.port
    };
});

discovery.on('removed', function (node) {
    console.log("A node has been removed.");
    console.log(node);
    delete nodeMap[node.id];
});

var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {
    
    var nodeMapKeys = Object.keys(nodeMap);

    // if there are no services, give an error
    if (!nodeMapKeys.length) {
        res.writeHead(503, {'Content-Type' : 'text/plain'});
        res.end('Service unavailable');
        return;
    }

    var idx = Math.floor(Math.random() * nodeMapKeys.length);
    var nodeIdkey = nodeMapKeys[idx];
    var nodeLocation = nodeMap[nodeIdkey];

    proxy.web(req, res, {
        target: {
            host: nodeLocation.hostName,
            port: nodeLocation.port
        }
    });
}).listen(loadBalancerConfig.port);
