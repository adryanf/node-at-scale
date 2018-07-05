var config = require('config');

var http = require('http');
var pidusage = require('pidusage');
var Discover = require('@dashersw/node-discover');

var serviceConfig = config.get('service');

/**
 * This function estimates pi using Monte-Carlo integration
 * https://en.wikipedia.org/wiki/Monte_Carlo_integration
 * @returns {number}
 */
function estimatePi() {
    var n = 10000000, inside = 0, i, x, y;

    for ( i = 0; i < n; i++ ) {
        x = Math.random();
        y = Math.random();
        if ( Math.sqrt(x * x + y * y) <= 1 )
            inside++;
    }

    return 4 * inside / n;
}

var spawnedAt = new Date();

// Create a basic server that responds to any request with the pi estimation
var server = http.createServer(function (req, res) {
    
    var pi = estimatePi();

    var result = {
        spawnedAt: spawnedAt,
        pi: pi
    };

    res.writeHead(200, {'Content-Type' : 'application/json'});
    res.write(JSON.stringify(result));
    res.end();
});


function startup(){
    var discovery = Discover({
        redis: {
            host: serviceConfig.redis.host,
            port: serviceConfig.redis.port
        },
        advertisement: {
            name: serviceConfig.name,
            hostName: serviceConfig.hostName,
            port: serviceConfig.port
        }
    }, function(error){
        if(!error){
            discovery.demote(true);
            setInterval(function(){
                pidusage(process.pid, function (err, stats) {
                    if(!err){
                        discovery.send(serviceConfig.name, {
                            id: discovery.broadcast.instanceUuid,
                            stats: stats
                        });
                    }
                });
            }, serviceConfig.statsReportingIntervalInms);
        }
    });
}

// Listen to a specified port
server.listen(serviceConfig.port, serviceConfig.hostName, function(error){
    if(!error){
        startup();
    }
});
