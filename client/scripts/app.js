// YOUR CODE HERE:
$(document).ready(function () {
  var msgObj = {};
  var endNameIndex = window.location.search.lastIndexOf('?');
  var roomIndex = window.location.search.lastIndexOf('=');
  var myName = window.location.search.substring(10, endNameIndex);
  var myRoom = window.location.search.substring(roomIndex+1);
  console.log(myRoom);
  var lastMessageTime = (new Date(0)).toJSON();
  var rooms = {};
  var friends = {};
  var banned = {};

  var postMSG = function (message) {
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: "POST",
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log("message SENT!", data);
      },
      error: function (data) {
        console.log("message not sent!", data);
      }
    });
  };

  var removeLastMessage = function () {
    $('div.messages').children().last().remove();
  };

  var formatMessages = function(results){
    var userPostCount = {};
    for(var j = 0; j < results.length; j++){
      if(userPostCount[results[j].username] === undefined){
        userPostCount[results[j].username] = 1;
      } else {
        userPostCount[results[j].username]++;
      }
    }
    for(var k = 0; k < results.length; k++){
      if(userPostCount[results[k].username] > 10 ){
        banned[results[k].username] = true;
      }
    }
    for(var i = results.length-1; i >= 0; i--) {
      if(banned[results[i].username] !== true){
        var $paragraph = $('<p></p>');
        var text = results[i].text;
        var $username = $('<span></span>').text(results[i].username).addClass(results[i].username);

        if (friends[results[i].username] === true) {
          $username.addClass('friend');
          $paragraph.addClass('friend');
        } else if (friends[results[i].username] === false) {
          $username.removeClass('friend');
          $paragraph.removeClass('friend');
        }
        var createdAt = results[i].createdAt;
        var messageContent =  ": " + text + "  " + createdAt;

        $('div.messages').prepend($paragraph.text(messageContent).prepend($username));

        if ($('div.messages').children().length >= 25) {
          removeLastMessage();
        }
      }
    }
    lastMessageTime = results[0].createdAt;
  };

  var getMessages = function(){
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'GET',
      data: {
        order: '-createdAt',
        where: JSON.stringify({
          roomname: myRoom,
          createdAt: { $gt: {"__type": "Date", iso: lastMessageTime}}
        })
      },
      success: function (data) {
        if(data.results.length > 0){
          formatMessages(data["results"]);
        }
      },
      error: function (data) {
        console.log('not retrieved');
      }
    });
  };

  // get active rooms
  var getActiveRooms = function () {
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'GET',
      data: {
        order: '-createdAt',
        limit: 500,
        where: JSON.stringify({
          createdAt: { $gt: {"__type": "Date", iso: lastMessageTime}}
        })
      },
      success: function (data) {
        if(data.results.length > 0){
          roomFormat(data.results);
        }
      },
      error: function (data) {
        console.log('active rooms not retrieved');
      }
    });
  };

  var roomFormat = function (results) {
    for (var i = 0; i < results.length; i++) {
      if(rooms[results[i].roomname] === undefined){
        rooms[results[i].roomname] = false;   // default false, meaning not yet appended
      }
    }
    for (var roomname in rooms) {
      // added if clause so that only rooms that have not been added will be appended
      if (!rooms[roomname]) {
        // changed to div (from span) so that rooms appear on side (because too many rooms on top)
        // added class 'roomname' to each room div
        $('<div></div>').addClass('roomname').text(roomname).appendTo($('div.activeRooms'));
        rooms[roomname] = true;
      }
    }
  };

  var goToRoom = function () {
    window.open(window.location.pathname + "?username=" + myName + "?roomname=" + myRoom,myRoom);
  };

  // changing rooms by clicking on room names
  $('.activeRooms').on('click', '.roomname',function (e) {
    myRoom = $(this).text();
    console.log("room: " + $(this).text());
    goToRoom();
  });

  // sending messages
  $('button.send').on('click', function (e) {
    var text = $('.draft').val();
    msgObj.text = text;
    msgObj.username = myName;
    msgObj.roomname = myRoom;

    postMSG(msgObj);
  });

  // retrieving username from input box
  $('.username').on("keyup", function(){
      myName = $(this).val() || window.location.search.substring(10);
  });

  // retrieving chatroom name
  $('.changeRoom').on("click", function (e) {
    myRoom = $('.chatroom').val() || "4chan";
    goToRoom();
  });

  // friending
  $('div.messages').on('click', 'span', function (e) {
    var name = $(this).text();
    if(friends[name] !== true){
      friends[name] = true;
      $('.' + name).addClass('friend').parent().addClass('friend');
    } else{
      friends[name] = false;
       $('.' + name).removeClass('friend').parent().removeClass('friend');
    }
  });
  $('h2.room').text(myRoom);

 getActiveRooms();
 getMessages();

 setInterval(function () {
   getMessages();
   getActiveRooms();
 }, 3000);
});
