var config = require('config');

var http = require('http');

var seaport = require('seaport');

var serviceConfig = config.get('service');

var sc = seaport.connect(serviceConfig.registry.host, serviceConfig.registry.port);

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

// Listen to a specified port
server.listen(sc.register(serviceConfig.name));