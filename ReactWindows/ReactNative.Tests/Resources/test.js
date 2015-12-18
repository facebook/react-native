function require(name)
{
    return this[name];
}

var BatchProcessCalls = new Array();
var BatchedBridge =
{
    "processBatch": function (args)
    {
        BatchProcessCalls.push(args);
        return [[],[],[]];
    }
}