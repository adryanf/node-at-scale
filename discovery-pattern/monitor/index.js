var config = require('config');

var Discover = require('@dashersw/node-discover');

var monitorConfig = config.get('monitor');

var discovery = Discover({
    redis: {
        host: monitorConfig.redis.host,
        port: monitorConfig.redis.port
    }
}, function(error){
    if(!error){
        discovery.demote(true);

        discovery.join(monitorConfig.statsChannel, function (node) {
            console.log('['+node.name+'] Node id: '+ node.id + ' has stats:');
            console.log(node.stats);
        });
    }
});

// discovery.on('added', function (node) {
//     console.log("A new node has been added.");
//     console.log(node);

//     nodeMap[node.id] = {
//         hostName: node.advertisement.hostName,
//         port: node.advertisement.port
//     };
// });

// discovery.on('removed', function (node) {
//     console.log("A node has been removed.");
//     console.log(node);
//     delete nodeMap[node.id];    
// });