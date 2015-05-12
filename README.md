#dvv.js
##To run
    Run npm install
We recommend you use ngrok for development

##Overview of Architecture
Dvv.js is an out of the box distributed network. It's designed to be easily customizable and get you running with a few lines of code. Crowdsource computing power now!!

##Overview of how the program works

Please refer to these powerpoint slides:

* [Quick overview](https://drive.google.com/open?id=1as-Hz8ekq8w2G1ZQZEBfOZRKrCCxTPBj8hhPTA0yu00&authuser=0)
* [Detailed overview](https://drive.google.com/open?id=1n4Zux3OoKREQ8TakJb4OfSNNw7QydGsfQ_iV23Dm-CA&authuser=0)

##Usage

###First example- simple example

>Server.js

    var dvv = require('./dvv.js);

    var doubler = function(element){
      return element*2;
    };

    dvv.config({
      staticPath: '/../client',
      timeout: 25000,
      data: [1,2,3],
      func: doubler,
      clock: true
    });

    dvv.start();

###Second example- usage of external functions

>Server.js

    var dvv = require('./dvv.js);

    dvv.config({
      staticPath: '/../client',
      timeout: 25000,
      data: createMatrixArrays(200, 10),
      func: math.inv,
      clock: true
    });

    dvv.start();

>WorkerTask.js

Append this line to the top of the worker task file

    //Import our math script
    importScripts("https://cdnjs.cloudflare.com/ajax/libs/mathjs/1.6.0/math.min.js");


###Third example - use of custom function and custom partitioning

>Server.js

    nqueens = require('./nqueens.js')(15);

    //Also each set of arguments must be in its own array

    dvv.config({
      staticPath: '/../client',
      timeout: 30000,
      data: nqueens.data,
      partitionLength: 0,
      func: nqueens.func,
      callback: nqueens.callback,
      clock: true
    });

    dvv.start();

###Configuration Settings

**static path**:
Here you can define the path of where your client side files reside. Otherwise it will default to '/'.

**timeout**:
Here you can specify the time the master process should wait for a packet to return before it declares it as a 'late packet'. You should optimize this value based on how long you estimate each packet takes to compute. The default value is 5 seconds. 

**data**:
Specify an array containing all the elements that you wish to compute on.

**partitionLength**:
Default value: 1
If your computing function requires more than one input parameter, you can specify how many parameters your computing function takes in.

**func**:
Default value: 'function(val){return val;}'
This is your computing function.
You should specify the function in string format that you wish to apply to every element. 
We recommend you minify it if possible, to reduce network effects.

**callback**:
Default value: function(val){console.log(val);} 
You can specify a callback function not in string format that will be passed in an array of the computed results.

**clock**:
Default value: true
This is a boolean to determine whether or not to set off an internal timer for testing purposes.

##Custom methods
These can be inserted into the 'completed' event right after the completed packets are heap sorted. (line 205 in the source code) or they can be defined as the callback function in dvv.config. Here are some examples you can copy paste in

###Reset and Redistribute

    partitionedData = partitionData(finishedResults);
    resetProcess();
    initializeProcess(partitionedData);
    availableClients.forEach(function(socket){
     sendNextAvailablePacket(socket);
    });

###Reduce
    
    finishedResults.reduce(function(accumulator, element){return accumulator + element;}, start);

###Filter

    finishedResult.filter(function(element){return element % 2 === 0});

###Save to database
Any database works really, but here is a sample firebase integration

Note*: Remember to include the firebase JS library preferably from a CDN

    var fb = new Firebase("https://<your-firebase>.firebaseio.com");
    fb.set({results: finishedResults});

Alternative custom methods are also possible, it's really up to you to define them!

##Front end integration
Anything you want, it's front end agnostic.
You can set the events for the client to listen to.

Current events: progress, complete, data, clientChange

##Adjusting client side script to mobile
Detect the screen size to use as an indicator of whether or not we're operating on a mobile phone
using this code: 

    window.mobilecheck = function() {
      var check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    }

and create a custom event for the master process. The master process can then be configured to dole out smaller packets to these mobile clients. 


##Team Members
Nick Bailey - Product Owner

Eddie Kong - Technical Lead

Andy Tran - Scrum Master